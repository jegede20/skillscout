import sys, asyncio
from playwright.async_api import async_playwright
async def main(urls):
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", viewport={"width":1280,"height":900})
        page = await ctx.new_page()
        for url in urls:
            try:
                resp = await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                await page.wait_for_timeout(4000)
                title = (await page.title())[:80]
                body = (await page.inner_text("body"))[:4000].lower() if await page.query_selector("body") else ""
                flags = [f for f in ["free trial","start your free","captcha","just a moment","access denied","verify you are human","client challenge","sign up for free trial"] if f in body]
                print(f"{resp.status if resp else '-'}\t{url}\t{page.url}\t{title}\t{','.join(flags)}")
            except Exception as e:
                print(f"ERR\t{url}\t\t{str(e)[:90]}")
        await b.close()
asyncio.run(main(sys.argv[1:]))
