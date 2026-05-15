"""
Screening Service — orchestrates the full pipeline:
  1. Scrape public data per platform
  2. Send to Claude for risk analysis
  3. Save results to DB
"""
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.models import ScreeningReport, Candidate, ScreeningStatus, RiskLevel
from app.services.scrapers import (
    scrape_google,
    scrape_twitter,
    scrape_linkedin,
    scrape_news,
)
from app.services.ai_analyzer import analyze_with_claude
import structlog

logger = structlog.get_logger()


async def start_screening_job(candidate_id: str, report_id: str):
    """Entry point called as a background task from the API route."""
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
    """Main screening pipeline."""
    candidate = await db.get(Candidate, candidate_id)
    report = await db.get(ScreeningReport, report_id)

    if not candidate or not report:
        raise ValueError("Candidate or report not found")

    # Mark as processing
    report.status = ScreeningStatus.processing
    await db.commit()

    logger.info("screening_started", candidate=candidate.full_name, report_id=report_id)

    # ── Step 1: Scrape all platforms in parallel ──────────────
    scrape_tasks = [
        scrape_google(candidate.full_name, candidate.phone),
        scrape_twitter(candidate.twitter_url),
        scrape_linkedin(candidate.linkedin_url),
        scrape_news(candidate.full_name),
    ]
    results = await asyncio.gather(*scrape_tasks, return_exceptions=True)

    google_data   = results[0] if not isinstance(results[0], Exception) else {}
    twitter_data  = results[1] if not isinstance(results[1], Exception) else {}
    linkedin_data = results[2] if not isinstance(results[2], Exception) else {}
    news_data     = results[3] if not isinstance(results[3], Exception) else {}

    raw_data = {
        "google": google_data,
        "twitter": twitter_data,
        "linkedin": linkedin_data,
        "news": news_data,
    }

    # ── Step 2: AI analysis ───────────────────────────────────
    analysis = await analyze_with_claude(candidate.full_name, raw_data)

    # ── Step 3: Save results ──────────────────────────────────
    report.status = ScreeningStatus.completed
    report.overall_risk = _compute_overall_risk(analysis["risk_scores"])
    report.risk_scores = analysis["risk_scores"]
    report.found_profiles = _extract_profiles(raw_data)
    report.flagged_content = analysis["flagged_content"]
    report.ai_summary = analysis["summary"]
    report.raw_data = raw_data
    report.completed_at = datetime.utcnow()

    await db.commit()
    logger.info("screening_completed", report_id=report_id, risk=report.overall_risk)


def _compute_overall_risk(scores: dict) -> RiskLevel:
    """Compute overall risk level from category scores."""
    if not scores:
        return RiskLevel.low
    max_score = max(scores.values(), default=0)
    if max_score >= 75:
        return RiskLevel.critical
    elif max_score >= 50:
        return RiskLevel.high
    elif max_score >= 25:
        return RiskLevel.medium
    return RiskLevel.low


def _extract_profiles(raw_data: dict) -> dict:
    """Extract discovered social profiles from scraped data."""
    profiles = {}
    if raw_data.get("linkedin", {}).get("profile_url"):
        profiles["linkedin"] = raw_data["linkedin"]["profile_url"]
    if raw_data.get("twitter", {}).get("username"):
        profiles["twitter"] = f"@{raw_data['twitter']['username']}"
    if raw_data.get("google", {}).get("found_urls"):
        profiles["google_results"] = raw_data["google"]["found_urls"][:5]
    return profiles
