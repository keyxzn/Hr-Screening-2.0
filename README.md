# 🛡️ HRCheck — HR Candidate Background Checker

Aplikasi web screening kandidat dari data publik sosial media.
**Total biaya tools: Rp 0** — semua open source & gratis.

---

## Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Python + FastAPI + SQLAlchemy |
| Database | PostgreSQL |
| AI Analisis | Ollama + Llama 3 (lokal, gratis) |
| OSINT | googlesearch-python + Playwright |

---

## Cara Jalankan (Step by Step)

### 1. Install prasyarat

- [Node.js 18+](https://nodejs.org)
- [Python 3.11+](https://python.org)
- [PostgreSQL 15+](https://postgresql.org)
- [Ollama](https://ollama.com) — untuk AI analisis

### 2. Setup Database PostgreSQL

```bash
# Masuk ke psql
psql -U postgres

# Buat database
CREATE DATABASE hr_checker;
\q
```

### 3. Setup Backend

```bash
cd backend

# Buat virtual environment
python -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

# Install dependensi
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Setup environment
cp .env.example .env
# Edit .env sesuai konfigurasi kamu

# Jalankan backend
uvicorn app.main:app --reload --port 8000
```

Backend akan jalan di: http://localhost:8000  
Dokumentasi API: http://localhost:8000/docs

### 4. Setup Ollama (AI Lokal)

```bash
# Install Ollama dari https://ollama.com
# Lalu jalankan:
ollama serve

# Di terminal lain, download model Llama3:
ollama pull llama3
```

### 5. Setup Frontend

```bash
cd frontend

# Install dependensi
npm install

# Buat file environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Jalankan frontend
npm run dev
```

Frontend akan jalan di: http://localhost:3000

---

## Alur Kerja Aplikasi

```
HR isi form kandidat
        ↓
FastAPI terima request → simpan ke PostgreSQL
        ↓
Background task jalan:
  ├── Google Search (googlesearch-python)
  ├── Twitter scraping (Playwright)
  ├── LinkedIn scraping (Playwright)
  └── News scraping (googlesearch-python)
        ↓
Ollama + Llama3 analisis konten
        ↓
Hasil disimpan ke DB → tampil di dashboard
```

---

## Kategori Risiko yang Dicek

| Kategori | Yang Dicek |
|---|---|
| Fraud / Scam | Penipuan, akun palsu |
| Toxic Language | Kata kasar, bullying |
| Hate Speech | Serangan ras, agama, gender |
| Explicit Content | Konten vulgar/pornografi |
| Violence | Ancaman kekerasan |
| Extremism | Terorisme, kekerasan politik |
| Professional Risk | Fraud kerja, fake profile |

---

## Struktur Folder

```
hr-checker/
├── frontend/               ← Next.js app
│   ├── app/
│   │   ├── screening/      ← Form input kandidat
│   │   ├── candidates/     ← List semua kandidat
│   │   └── candidates/[id] ← Detail & hasil screening
│   ├── components/         ← Navbar, RiskBadge, dll
│   └── lib/api.ts          ← API client
│
└── backend/                ← FastAPI app
    └── app/
        ├── api/routes/     ← candidates.py, reports.py
        ├── services/
        │   ├── scrapers.py         ← Google + Playwright
        │   ├── ai_analyzer.py      ← Ollama + Llama3
        │   ├── screening_service.py← Orchestrator utama
        │   └── report_service.py   ← Export PDF
        ├── models/         ← SQLAlchemy models
        ├── schemas/        ← Pydantic schemas
        └── core/           ← Config, database
```

---

## Legal & Etika

✅ **Yang boleh:** Hanya data publik, kandidat sudah consent  
❌ **Yang tidak boleh:** Akses akun privat, tanpa consent, diskriminasi
