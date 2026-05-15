import asyncio
import uuid
from app.core.database import AsyncSessionLocal
from app.models.models import Candidate, ScreeningReport, ScreeningStatus, RiskLevel

async def seed():
    async with AsyncSessionLocal() as db:
        c = Candidate(
            id=str(uuid.uuid4()),
            full_name="John Doe (Test)",
            email="johndoe.test@dummy.com",
            phone="+62 812 0000 0001",
            twitter_url="https://x.com/dummy",
            consent_given=True
        )
        db.add(c)
        await db.flush()
        r = ScreeningReport(
            candidate_id=c.id,
            status=ScreeningStatus.completed,
            overall_risk=RiskLevel.high,
            risk_scores={"explicit_content":10,"toxic_language":78,"hate_speech":65,"violence":20,"extremism":5,"professional_risk":40},
            found_profiles={"twitter":"https://x.com/dummy"},
            flagged_content=[{"platform":"Twitter","content_snippet":"Contoh tweet kasar dan bullying","category":"Toxic Language","severity":"high"}],
            ai_summary="Kandidat terdeteksi sering menggunakan bahasa kasar dan hate speech di Twitter. Ditemukan 15 postingan yang mengandung bullying dan 8 postingan dengan ujaran kebencian. Tidak direkomendasikan untuk lanjut ke tahap interview."
        )
        db.add(r)
        await db.commit()
        print("Done! Candidate ID:", c.id)

asyncio.run(seed())