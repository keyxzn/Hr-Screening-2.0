"""
Screening Service — orchestrates the full pipeline
"""
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.models import ScreeningReport, Candidate, ScreeningStatus, RiskLevel, HRSettings
from app.services.scrapers import (
    scrape_google,
    scrape_twitter,
    scrape_linkedin,
    scrape_news,
    scrape_instagram,
    scrape_facebook,
)
from app.services.ai_analyzer import analyze_with_claude
import structlog

logger = structlog.get_logger()

DEFAULT_MEDIUM_THRESHOLD = 50


async def _get_medium_threshold(db: AsyncSession) -> int:
    setting = await db.get(HRSettings, "medium_threshold")
    if setting:
        try:
            return int(setting.value)
        except ValueError:
            pass
    return DEFAULT_MEDIUM_THRESHOLD


async def start_screening_job(candidate_id: str, report_id: str):
    async with AsyncSessionLocal() as db:
        try:
            await _run_screening(db, candidate_id, report_id)
        except Exception as e:
            logger.error("screening_failed", report_id=report_id, error=str(e))
            report = await db.get(ScreeningReport, report_id)
            if report:
                report.status = ScreeningStatus.failed
                report.error_message = str(e)
                await db.commit()


async def _run_screening(db: AsyncSession, candidate_id: str, report_id: str):
    candidate = await db.get(Candidate, candidate_id)
    report    = await db.get(ScreeningReport, report_id)

    if not candidate or not report:
        raise ValueError("Candidate or report not found")

    report.status = ScreeningStatus.processing
    await db.commit()

    logger.info("screening_started", candidate=candidate.full_name)

    # ── Step 1: Scrape semua platform paralel ─────────────
    scrape_tasks = [
        scrape_google(candidate.full_name, candidate.phone),
        scrape_twitter(candidate.twitter_url),
        scrape_linkedin(candidate.linkedin_url),
        scrape_news(candidate.full_name),
        scrape_instagram(candidate.instagram_url),
        scrape_facebook(candidate.facebook_url),
    ]
    results = await asyncio.gather(*scrape_tasks, return_exceptions=True)

    google_data    = results[0] if not isinstance(results[0], Exception) else {}
    twitter_data   = results[1] if not isinstance(results[1], Exception) else {}
    linkedin_data  = results[2] if not isinstance(results[2], Exception) else {}
    news_data      = results[3] if not isinstance(results[3], Exception) else {}
    instagram_data = results[4] if not isinstance(results[4], Exception) else {}
    facebook_data  = results[5] if not isinstance(results[5], Exception) else {}

    raw_data = {
        "google":    google_data,
        "twitter":   twitter_data,
        "linkedin":  linkedin_data,
        "news":      news_data,
        "instagram": instagram_data,
        "facebook":  facebook_data,
    }

    # ── Step 2: AI analysis ────────────────────────────────
    await asyncio.sleep(5)
    analysis = await analyze_with_claude(candidate.full_name, raw_data)

    # ── Step 3: Compute risk ───────────────────────────────
    overall_risk = _compute_overall_risk(analysis["risk_scores"])

    report.status          = ScreeningStatus.completed
    report.overall_risk    = overall_risk
    report.risk_scores     = analysis["risk_scores"]
    report.found_profiles  = _extract_profiles(raw_data, candidate)
    report.flagged_content = analysis["flagged_content"]
    report.ai_summary      = analysis["summary"]
    report.raw_data        = raw_data
    report.completed_at    = datetime.utcnow()

    # ── Step 4: Auto-assessment berdasarkan overall_risk ───
    threshold = await _get_medium_threshold(db)
    overall_score = max(analysis["risk_scores"].values(), default=0) if analysis["risk_scores"] else 0

    if overall_risk in (RiskLevel.critical, RiskLevel.high):
        report.assessment_status = "inappropriate"
        report.assessed_by       = "system"
        report.assessed_by_name  = "Auto-assessed"
        report.assessed_at       = datetime.utcnow()
        report.assessment_locked = True
        logger.info("auto_assessed_inappropriate", report_id=report_id, risk=overall_risk)

    elif overall_risk == RiskLevel.low:
        report.assessment_status = "appropriate"
        report.assessed_by       = "system"
        report.assessed_by_name  = "Auto-assessed"
        report.assessed_at       = datetime.utcnow()
        report.assessment_locked = True
        logger.info("auto_assessed_appropriate", report_id=report_id, risk=overall_risk)

    elif overall_risk == RiskLevel.medium:
        if overall_score > threshold:
            report.assessment_status = "inappropriate"
            report.assessed_by       = "system"
            report.assessed_by_name  = "Auto-assessed"
            report.assessed_at       = datetime.utcnow()
            report.assessment_locked = True
            logger.info("auto_assessed_medium_inappropriate", report_id=report_id, score=overall_score, threshold=threshold)
        else:
            # Tetap manual — HR yang harus decide
            logger.info("medium_risk_manual", report_id=report_id, score=overall_score, threshold=threshold)

    await db.commit()
    logger.info("screening_completed", report_id=report_id, risk=report.overall_risk)


def _compute_overall_risk(scores: dict) -> RiskLevel:
    if not scores:
        return RiskLevel.low
    max_score = max(scores.values(), default=0)
    if max_score >= 75:  return RiskLevel.critical
    if max_score >= 50:  return RiskLevel.high
    if max_score >= 25:  return RiskLevel.medium
    return RiskLevel.low


def _extract_profiles(raw_data: dict, candidate=None) -> dict:
    profiles = {}

    if ig := raw_data.get("instagram", {}):
        if ig.get("profile_url") and ig.get("username"):
            profiles["instagram"] = ig["profile_url"]
    elif candidate and candidate.instagram_url:
        u = candidate.instagram_url.strip()
        handle = u.replace("@","").split("/")[-1]
        profiles["instagram"] = f"https://www.instagram.com/{handle}/"

    if fb := raw_data.get("facebook", {}):
        if fb.get("profile_url") and fb.get("username"):
            profiles["facebook"] = fb["profile_url"]
    elif candidate and getattr(candidate, "facebook_url", None):
        u = candidate.facebook_url.strip()
        if u.startswith("http"):
            profiles["facebook"] = u
        else:
            handle = u.replace("@","").split("/")[-1]
            profiles["facebook"] = f"https://www.facebook.com/{handle}"

    if tw := raw_data.get("twitter", {}):
        if tw.get("username"):
            profiles["twitter"] = f"https://x.com/{tw['username']}"
    elif candidate and getattr(candidate, "twitter_url", None):
        u = candidate.twitter_url.strip()
        handle = u.replace("@","").split("/")[-1]
        profiles["twitter"] = f"https://x.com/{handle}"

    if li := raw_data.get("linkedin", {}):
        if li.get("profile_url"):
            profiles["linkedin"] = li["profile_url"]
    elif candidate and getattr(candidate, "linkedin_url", None):
        profiles["linkedin"] = candidate.linkedin_url

    return profiles