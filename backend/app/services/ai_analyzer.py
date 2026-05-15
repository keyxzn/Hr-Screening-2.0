"""
AI Analyzer — pakai Ollama + Llama3 (GRATIS, lokal).
Ganti Claude API yang berbayar.
Setup: ollama serve && ollama pull llama3
"""
import json
import httpx
from app.core.config import settings

RISK_CATEGORIES = [
    "explicit_content",
    "toxic_language",
    "hate_speech",
    "violence",
    "extremism",
    "professional_risk",
]

PROMPT_TEMPLATE = """Kamu adalah sistem analisis risiko HR profesional.
Analisis data publik kandidat berikut dan berikan skor risiko per kategori.

PENTING:
- Hanya nilai berdasarkan DATA PUBLIK yang diberikan
- Jangan berasumsi negatif tanpa bukti
- Bersikap objektif dan profesional
- False positive merusak karir kandidat

Kategori yang harus dinilai (skor 0-100):
- explicit_content: pornografi / konten vulgar
- toxic_language: kata kasar, bullying, harassment
- hate_speech: serangan ras, agama, gender
- violence: ancaman kekerasan
- extremism: terorisme / kekerasan politik
- professional_risk: fraud, scam, fake profile

Data kandidat:
{content}

Kembalikan HANYA JSON valid, tidak ada teks lain:
{{
  "risk_scores": {{
    "explicit_content": 0,
    "toxic_language": 0,
    "hate_speech": 0,
    "violence": 0,
    "extremism": 0,
    "professional_risk": 0
  }},
  "flagged_content": [],
  "summary": "Ringkasan singkat 2-3 kalimat dalam bahasa Indonesia."
}}"""


async def analyze_with_claude(candidate_name: str, raw_data: dict) -> dict:
    """
    Nama fungsi dipertahankan agar tidak perlu ubah screening_service.py.
    Tapi sekarang pakai Ollama + Llama3, bukan Claude API.
    """
    content = _prepare_content(candidate_name, raw_data)
    prompt = PROMPT_TEMPLATE.format(content=content)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            if resp.status_code == 200:
                raw = resp.json().get("response", "{}")
                parsed = json.loads(raw)
                # Pastikan semua kategori ada
                for cat in RISK_CATEGORIES:
                    parsed.setdefault("risk_scores", {})[cat] = parsed.get("risk_scores", {}).get(cat, 0)
                parsed.setdefault("flagged_content", [])
                parsed.setdefault("summary", "Analisis selesai.")
                return parsed
    except Exception as e:
        print(f"[Ollama error] {e}")

    # Fallback jika Ollama tidak jalan
    return {
        "risk_scores": {cat: 0 for cat in RISK_CATEGORIES},
        "flagged_content": [],
        "summary": (
            f"Tidak dapat menjalankan analisis AI untuk {candidate_name}. "
            "Pastikan Ollama sudah berjalan: `ollama serve` lalu `ollama pull llama3`."
        ),
    }


def _prepare_content(name: str, raw_data: dict) -> str:
    parts = [f"Nama: {name}"]

    if google := raw_data.get("google", {}):
        results = google.get("results", [])
        if results:
            snippets = [f"- {r.get('title','')}: {r.get('snippet','')}" for r in results[:5]]
            parts.append("=== Google Search ===\n" + "\n".join(snippets))
        else:
            parts.append("=== Google Search ===\nTidak ada hasil ditemukan.")

    if twitter := raw_data.get("twitter", {}):
        tweets = twitter.get("tweets", [])
        if tweets:
            texts = [f"- {t.get('text','')}" for t in tweets[:10]]
            parts.append("=== Twitter/X Posts ===\n" + "\n".join(texts))

    if linkedin := raw_data.get("linkedin", {}):
        if linkedin.get("name") or linkedin.get("headline"):
            parts.append(f"=== LinkedIn ===\nNama: {linkedin.get('name','')}\nHeadline: {linkedin.get('headline','')}\nAbout: {linkedin.get('about','')[:300]}")

    if news := raw_data.get("news", {}):
        articles = news.get("articles", [])
        if articles:
            art_texts = [f"- {a.get('title','')}" for a in articles[:5]]
            parts.append("=== Berita ===\n" + "\n".join(art_texts))

    return "\n\n".join(parts) if len(parts) > 1 else f"Tidak ada data publik ditemukan untuk {name}."
