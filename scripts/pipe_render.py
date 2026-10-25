# -*- coding: utf-8 -*-
"""
LEGACY 直通编码实验：已被 scripts/gpu_master_render.py 取代。

仅保留作最小直通管线参考；产物同样写入 episodes/archive/dist/，
中间文件写入 temp/archive-ecommerce/，不再写桌面。
新项目请使用 scripts/gpu_master_render.py（GPU 并发 + 渲染记录 + 默认不覆盖）。
"""

import asyncio
import os
import time
import subprocess
import imageio_ffmpeg
from playwright.async_api import async_playwright

FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
HTML_PATH = os.path.join(PROJECT_ROOT, "episodes", "archive", "index_ecommerce.html")
TEMP_DIR = os.path.join(PROJECT_ROOT, "temp", "archive-ecommerce")
TEMP_VIDEO = os.path.join(TEMP_DIR, "canvas_stream_no_audio.mp4")
BGM_PATH = os.path.join(PROJECT_ROOT, "assets", "audio", "MidnightRush(旋律很哇塞)-云杪栖光.mp3")
FINAL_MP4 = os.path.join(PROJECT_ROOT, "episodes", "archive", "dist", "archive-ecommerce_v1_你被猜透的那一刻.mp4")

FPS = 30
DURATION = 160.0 # 2m 40s (160 seconds)
TOTAL_FRAMES = int(DURATION * FPS) # 4800 frames

async def render_pipe():
    print("⚠️ LEGACY 脚本：建议改用 scripts/gpu_master_render.py")
    print(f"=== Starting Playwright Canvas Render: {TOTAL_FRAMES} frames @ {FPS}fps (Duration: {DURATION}s) ===")
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(FINAL_MP4), exist_ok=True)
    final_mp4 = FINAL_MP4
    if os.path.exists(final_mp4):
        base, ext = os.path.splitext(final_mp4)
        counter = 2
        while os.path.exists(f"{base}_r{counter}{ext}"):
            counter += 1
        final_mp4 = f"{base}_r{counter}{ext}"
    
    ffmpeg_cmd = [
        FFMPEG_BIN, "-y",
        "-f", "image2pipe",
        "-vcodec", "mjpeg",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        TEMP_VIDEO
    ]
    
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.add_init_script("window.__RENDER_MODE__ = true;")
        await page.goto(f"file://{HTML_PATH}")
        await page.evaluate("document.fonts.ready.then(()=>true)")
        await page.evaluate("Promise.all([...document.fonts].map(f => f.load().catch(() => {}))).then(() => true)")
        await page.evaluate("document.fonts.ready.then(()=>true)")
        await page.evaluate("window.__RENDER_MODE__ = true")
        
        t0 = time.time()
        locator = page.locator("#stage")
        for fi in range(TOTAL_FRAMES):
            t = fi / FPS
            await page.evaluate(f"window.render({t})")
            buf = await locator.screenshot(type="jpeg", quality=95)
            proc.stdin.write(buf)
            
            if fi % 200 == 0:
                el = time.time() - t0
                pct = (fi / TOTAL_FRAMES) * 100
                fps_cur = (fi + 1) / max(0.1, el)
                eta = (TOTAL_FRAMES - fi) / max(0.1, fps_cur)
                print(f"Progress: {fi}/{TOTAL_FRAMES} frames ({pct:.1f}%) | Time: {t:.1f}s/{DURATION}s | Speed: {fps_cur:.1f} fps | ETA: {eta:.0f}s", flush=True)
                
        await browser.close()
        
    proc.stdin.close()
    proc.wait()
    print("Raw video stream rendered successfully!")
    
    print(f"Mixing MidnightRush BGM from 00:00 to {DURATION}s with fadeout...")
    mix_cmd = [
        FFMPEG_BIN, "-y",
        "-i", TEMP_VIDEO,
        "-ss", "00:00:00",
        "-t", str(DURATION),
        "-i", BGM_PATH,
        "-filter_complex", f"[1:a]loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st={DURATION - 2.5}:d=2.5[a]",
        "-map", "0:v:0",
        "-map", "[a]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_mp4
    ]
    subprocess.run(mix_cmd, check=True)
    print(f"\n==========================================")
    print(f"🎉 FINAL MOVIE READY: {final_mp4}")
    print(f"==========================================")

if __name__ == "__main__":
    asyncio.run(render_pipe())
