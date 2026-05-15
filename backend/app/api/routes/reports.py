from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import ScreeningReport, Candidate
from app.schemas.schemas import ScreeningReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{candidate_id}", response_model=ScreeningReportResponse)
async def get_report_by_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Get latest screening report for a candidate (by candidate_id)."""
    # First check if it's a report ID
    report = await db.get(ScreeningReport, candidate_id)
    if report:
        return report
    # Otherwise treat as candidate_id
    result = await db.execute(
        select(ScreeningReport)
        .where(ScreeningReport.candidate_id == candidate_id)
        .order_by(ScreeningReport.created_at.desc())
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/all/list", response_model=list[ScreeningReportResponse])
async def list_all_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScreeningReport).order_by(ScreeningReport.created_at.desc()))
    return result.scalars().all()
