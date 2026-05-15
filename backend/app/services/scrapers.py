"""
Scrapers — semua GRATIS:
- Google: googlesearch-python (pip install googlesearch-python)
- Twitter/X: Playwright (scraping publik, tanpa API key)
- LinkedIn: Playwright (scraping publik)
- News: Playwright scraping Google News
"""
import asyncio
from googlesearch import search as google_search
import structlog

logger = structlog.get_logger()


# ─── Google Search (googlesearch-python, GRATIS) ──────────────────────
async def scrape_google(full_name: str, phone: str | None = None) -> dict:
    """Cari nama + nomor kandidat di Google. Gratis, tanpa API key."""
    loop = asyncio.get_event_loop()
    results = []

    queries = [
        f'"{full_name}" scam OR fraud OR penipuan',
        f'"{full_name}" kontroversi OR skandal OR kasus',
        full_name,
    ]
    if phone:
        queries.append(f'"{phone}" penipuan OR scam')

    def _search(q: str):
        try:
            return list(google_search(q, num_results=5, lang="id", sleep_interval=1))
        except Exception:
            return []

    found_urls = []
    for q in queries:
        urls = await loop.run_in_executor(None, _search, q)
        for url in urls:
            results.append({"title": "", "snippet": q, "url": url})
            found_urls.append(url)

    return {"results": results[:15], "found_urls": list(set(found_urls))[:10]}


# ─── Twitter / X (Playwright, GRATIS) ────────────────────────────────
async def scrape_twitter(twitter_url: str | None) -> dict:
    """Scraping profil publik Twitter/X pakai Playwright. Tanpa API key."""
    if not twitter_url:
        return {"error": "URL tidak diberikan", "tweets": []}
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            await page.goto(twitter_url, timeout=15000)
            await page.wait_for_timeout(3000)

            username = twitter_url.rstrip("/").split("/")[-1].lstrip("@")
            name_el  = await page.query_selector('[data-testid="UserName"]')
            bio_el   = await page.query_selector('[data-testid="UserDescription"]')
            name     = await name_el.inner_text() if name_el else ""
            bio      = await bio_el.inner_text() if bio_el else ""

            tweet_els = await page.query_selector_all('[data-testid="tweetText"]')
            tweets = [{"text": await el.inner_text()} for el in tweet_els[:15]]

            await browser.close()
            return {"username": username, "name": name.strip(), "bio": bio.strip(),
                    "tweet_count": len(tweets), "tweets": tweets}
    except Exception as e:
        logger.warning("twitter_scrape_error", url=twitter_url, error=str(e))
        return {"error": str(e), "tweets": []}


# ─── LinkedIn (Playwright, GRATIS) ────────────────────────────────────
async def scrape_linkedin(linkedin_url: str | None) -> dict:
    """Scraping profil publik LinkedIn pakai Playwright. Tanpa API key."""
    if not linkedin_url:
        return {"error": "URL tidak diberikan"}
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
            )
            await page.goto(linkedin_url, timeout=15000)
            await page.wait_for_timeout(2000)

            name     = await page.text_content("h1") or ""
            headline = await page.text_content(".text-body-medium") or ""
            about    = await page.text_content(".core-section-container__content p") or ""

            await browser.close()
            return {"profile_url": linkedin_url, "name": name.strip(),
                    "headline": headline.strip(), "about": about.strip()[:800]}
    except Exception as e:
        logger.warning("linkedin_scrape_error", url=linkedin_url, error=str(e))
        return {"error": str(e), "profile_url": linkedin_url}


# ─── News (Google News via googlesearch-python, GRATIS) ───────────────
async def scrape_news(full_name: str) -> dict:
    """Cari berita tentang kandidat via Google News. Gratis."""
    loop = asyncio.get_event_loop()

    def _search():
        try:
            query = f'"{full_name}" site:news.google.com OR site:detik.com OR site:kompas.com OR site:tribunnews.com'
            urls = list(google_search(query, num_results=10, lang="id", sleep_interval=1))
            return [{"title": "", "url": u, "source": u.split("/")[2]} for u in urls]
        except Exception:
            return []

    articles = await loop.run_in_executor(None, _search)
    return {"article_count": len(articles), "articles": articles}
