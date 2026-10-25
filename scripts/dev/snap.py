# 临时抽帧预览：python scripts/dev/snap.py episodes/<slug>/index.html 5 18 30 ...  → temp/snap/ + 拼成 temp/snap/sheet.jpg
import asyncio, os, sys
from playwright.async_api import async_playwright
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

async def main():
    html = os.path.abspath(sys.argv[1]); ts = [float(x) for x in sys.argv[2:]]
    out = os.path.join(ROOT, "temp", "snap"); os.makedirs(out, exist_ok=True)
    for f in os.listdir(out): os.remove(os.path.join(out, f))
    paths = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        pg.on("pageerror", lambda e: print("JSERR", e))
        pg.on("console", lambda m: m.type == "error" and print("CONSOLE", m.text))
        await pg.add_init_script("window.__RENDER_MODE__ = true;")
        await pg.goto("file:///" + html.replace("\\", "/"))
        await pg.evaluate("document.fonts.ready.then(()=>true)")
        await pg.evaluate("Promise.all([...document.fonts].map(f => f.load().catch(() => {}))).then(() => true)")
        await pg.evaluate("document.fonts.ready.then(()=>true)")
        if await pg.evaluate("typeof window.setup === 'function'"):
            await pg.evaluate("new Promise(r => window.setup(r))")
        await pg.evaluate("window.__RENDER_MODE__ = true")
        for t in ts:
            await pg.evaluate(f"window.render({t})")
            pth = os.path.join(out, f"s_{t:06.1f}.jpg"); paths.append(pth)
            await pg.screenshot(path=pth, type="jpeg", quality=85)
        await b.close()
    cols = 2; w, h = 960, 540; rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (w * cols, h * rows))
    for i, pth in enumerate(paths):
        sheet.paste(Image.open(pth).resize((w, h)), ((i % cols) * w, (i // cols) * h))
    sheet.save(os.path.join(out, "sheet.jpg"), quality=85)

asyncio.run(main())
