from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Candidate, ScreeningReport, ScreeningStatus, HRSettings, HRUser
from app.schemas.schemas import (
    CandidateCreate, CandidateResponse, MessageResponse,
    BlacklistResult, HRSettingUpdate, HRSettingResponse,
)
from app.services.screening_service import start_screening_job
import csv
import io
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/candidates", tags=["candidates"])


# ─── Helpers ─────────────────────────────────────────────

def require_admin(current_user: HRUser = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


# ─── CRUD Candidates ─────────────────────────────────────

@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.scalar(select(Candidate).where(Candidate.email == payload.email))
    if existing:
        raise HTTPException(status_code=409, detail="Candidate with this email already exists")

    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    await db.flush()

    report = ScreeningReport(candidate_id=candidate.id, status=ScreeningStatus.pending)
    db.add(report)
    await db.commit()
    await db.refresh(candidate)

    background_tasks.add_task(start_screening_job, candidate.id, report.id)
    logger.info("candidate_created", candidate_id=candidate.id, name=candidate.full_name)
    return candidate


@router.get("/", response_model=list[CandidateResponse])
async def list_candidates(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Candidate).order_by(Candidate.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.delete("/{candidate_id}", response_model=MessageResponse)
async def delete_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    await db.execute(
        delete(ScreeningReport).where(ScreeningReport.candidate_id == candidate_id)
    )
    await db.delete(candidate)
    await db.commit()

    logger.info("candidate_deleted", candidate_id=candidate_id)
    return MessageResponse(message="Candidate and all associated data deleted successfully")


# ─── Blacklist Upload ─────────────────────────────────────

@router.post("/blacklist/upload", response_model=BlacklistResult)
async def upload_blacklist(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: HRUser = Depends(get_current_user),
):
    """
    Upload CSV blacklist (format sama dengan bulk upload).
    Sistem cari kandidat by email → set assessment_status=inappropriate + locked.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handle BOM dari Excel
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    # Normalize header — cari kolom 'email' (case-insensitive)
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    if "email" not in fieldnames:
        raise HTTPException(status_code=400, detail="CSV harus punya kolom 'email'")

    emails = []
    for row in reader:
        normalized = {k.strip().lower(): v.strip() for k, v in row.items()}
        email = normalized.get("email", "").strip().lower()
        if email:
            emails.append(email)

    if not emails:
        raise HTTPException(status_code=400, detail="Tidak ada email valid di CSV")

    matched = 0
    not_found = []

    for email in emails:
        candidate = await db.scalar(
            select(Candidate).where(Candidate.email == email)
        )
        if not candidate:
            not_found.append(email)
            continue

        # Ambil report terbaru
        result = await db.execute(
            select(ScreeningReport)
            .where(ScreeningReport.candidate_id == candidate.id)
            .order_by(ScreeningReport.created_at.desc())
        )
        report = result.scalars().first()

        if not report:
            # Buat report placeholder yang langsung blacklisted
            report = ScreeningReport(
                candidate_id=candidate.id,
                status=ScreeningStatus.completed,
                completed_at=datetime.utcnow(),
            )
            db.add(report)
            await db.flush()

        report.assessment_status = "inappropriate"
        report.assessed_by       = "system"
        report.assessed_by_name  = "Blacklist"
        report.assessed_at       = datetime.utcnow()
        report.assessment_locked = True
        matched += 1
        logger.info("blacklisted", email=email, candidate_id=candidate.id)

    await db.commit()
    return BlacklistResult(matched=matched, not_found=not_found)


# ─── HR Settings ─────────────────────────────────────────

@router.get("/settings/all", response_model=list[HRSettingResponse])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _: HRUser = Depends(get_current_user),
):
    result = await db.execute(select(HRSettings))
    rows = result.scalars().all()
    # Inject default kalau belum ada
    keys_in_db = {r.key for r in rows}
    defaults = []
    if "medium_threshold" not in keys_in_db:
        defaults.append(HRSettingResponse(key="medium_threshold", value="50"))
    return list(rows) + defaults


@router.patch("/settings/{key}", response_model=HRSettingResponse)
async def update_setting(
    key: str,
    data: HRSettingUpdate,
    db: AsyncSession = Depends(get_db),
    _: HRUser = Depends(require_admin),
):
    """Update setting. Hanya admin yang bisa."""
    ALLOWED_KEYS = {"medium_threshold"}
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail=f"Setting '{key}' tidak dikenal")

    # Validasi value untuk medium_threshold
    if key == "medium_threshold":
        try:
            v = int(data.value)
            if not (0 <= v <= 100):
                raise ValueError()
        except ValueError:
            raise HTTPException(status_code=400, detail="medium_threshold harus angka 0-100")

    setting = await db.get(HRSettings, key)
    if setting:
        setting.value = data.value
    else:
        setting = HRSettings(key=key, value=data.value)
        db.add(setting)

    await db.commit()
    await db.refresh(setting)
    return setting