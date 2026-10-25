# -*- coding: utf-8 -*-
"""
Vibe Knowledge Video · GPU Hardware-Accelerated Production Pipeline (V2.1)
==========================================================================
落盘约定:
  episodes/<slug>/index.html                 入口
  episodes/<slug>/episode.json               本期清单
  episodes/<slug>/dist/<slug>_v<版本>_<片名>.mp4   成片主档
  episodes/<slug>/preview/                    抽帧预览
  episodes/<slug>/qa/                         QA 报告
  temp/<slug>/                                可再生成的渲染中间产物

渲染能力:
- Playwright 多 Worker D3D11/ANGLE 硬件光栅化
- NVENC 硬件压制，失败自动回退 libx264
- BGM 从 00:00 起对齐，尾部 2.5s 淡出；BGM 短于成片时自动补静音
- 可选语义音效轨：与 BGM 先混音，再统一 -14 LUFS / TP -1 与淡出；--no-sfx 可关闭
- 默认不覆盖已有成片；--overwrite 显式覆盖
- 渲染完成后写 <成片名>.render.json 记录
"""

import argparse
import asyncio
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
EPISODES_DIR = os.path.join(PROJECT_ROOT, "episodes")
DESKTOP_DIR = os.path.join(os.path.expanduser("~"), "Desktop")


def rel(path):
    """项目内路径用相对路径展示，项目外保留绝对路径。"""
    try:
        return os.path.relpath(path, PROJECT_ROOT)
    except ValueError:
        return path


def get_ffmpeg():
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit("缺少 imageio-ffmpeg：请先执行 pip install imageio-ffmpeg")
    return imageio_ffmpeg.get_ffmpeg_exe()


def generate_silent_audio(ffmpeg, output_wav, duration):
    """当用户未提供 BGM 时，自动生成指定时长的纯静音音频作为保底轨，避免渲染中断。"""
    os.makedirs(os.path.dirname(os.path.abspath(output_wav)), exist_ok=True)
    cmd = [
        ffmpeg, "-y",
        "-f", "lavfi",
        "-i", "anullsrc=r=44100:cl=stereo",
        "-t", f"{duration:.3f}",
        "-c:a", "pcm_s16le",
        output_wav,
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return output_wav


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, path)


def sanitize_filename(name, max_len=100):
    name = str(name).strip().strip("《》")
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return name[:max_len].rstrip(" .")


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def find_default_html(project_root):
    """只认 episodes/CURRENT，不再用文件修改时间猜当前期。"""
    episodes_dir = os.path.join(project_root, "episodes")
    current_file = os.path.join(episodes_dir, "CURRENT")
    if not os.path.isfile(current_file):
        return None, "缺少 episodes/CURRENT，无法确定当前期。请先运行 scripts/new_episode.py。"
    try:
        with open(current_file, "r", encoding="utf-8-sig") as f:
            slug = f.read().strip()
    except Exception as e:
        return None, f"无法读取 episodes/CURRENT: {e}"
    if not slug or "/" in slug or "\\" in slug or slug in (".", ".."):
        return None, f"episodes/CURRENT 内容无效: {slug!r}"
    candidate = os.path.join(episodes_dir, slug, "index.html")
    if not os.path.isfile(candidate):
        available = []
        if os.path.isdir(episodes_dir):
            for name in sorted(os.listdir(episodes_dir)):
                if name == "archive":
                    continue
                if os.path.isfile(os.path.join(episodes_dir, name, "index.html")):
                    available.append(name)
        return None, (
            f"episodes/CURRENT 指向 {slug!r}，但找不到 episodes/{slug}/index.html。\n"
            f"现有期次: {', '.join(available) if available else '(无)'}"
        )
    return candidate, None


def resolve_episode(html_path):
    """从入口路径推导 (slug, 工程目录, 是否归档页)。"""
    html_path = os.path.abspath(html_path)
    try:
        rel_path = os.path.relpath(html_path, EPISODES_DIR)
    except ValueError:
        rel_path = None
    parts = [] if not rel_path or rel_path.startswith("..") else rel_path.split(os.sep)

    if len(parts) >= 2 and parts[0] != "archive":
        slug = parts[0]
        return slug, os.path.join(EPISODES_DIR, slug), False

    if len(parts) >= 2 and parts[0] == "archive":
        stem = os.path.splitext(os.path.basename(html_path))[0]
        return stem, os.path.join(EPISODES_DIR, "archive"), True

    stem = os.path.splitext(os.path.basename(html_path))[0]
    return stem, os.path.dirname(html_path), True


def load_episode_meta(episode_dir, html_path):
    """优先 episode.json；归档页从 archive/manifest.json 查找。"""
    manifest_path = os.path.join(episode_dir, "episode.json")
    if os.path.isfile(manifest_path):
        try:
            data = load_json(manifest_path)
            if isinstance(data, dict):
                return data, manifest_path
            print(f"警告: {rel(manifest_path)} 不是 JSON 对象，已忽略")
        except Exception as e:
            print(f"警告: 无法读取 {rel(manifest_path)}: {e}")

    archive_manifest = os.path.join(episode_dir, "manifest.json")
    if os.path.isfile(archive_manifest):
        try:
            data = load_json(archive_manifest)
            page = os.path.basename(html_path)
            for entry in data.get("pages", []):
                if entry.get("page") == page:
                    return entry, archive_manifest
        except Exception as e:
            print(f"警告: 无法读取 {rel(archive_manifest)}: {e}")

    return {}, None


def extract_video_title(html_path):
    """从清单之外的入口提取片名。"""
    if os.path.exists(html_path):
        try:
            with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(25000)

            m = re.search(r'class=["\']name["\']>《?([^》<\n]+)》?', content)
            if m:
                raw = m.group(1).split("：")[0].split(":")[0].strip().strip("《》")
                clean = sanitize_filename(raw)
                if clean:
                    return clean

            m = re.search(r"《([^》\n]+)》", content)
            if m:
                raw = m.group(1).split("：")[0].split(":")[0].strip()
                clean = sanitize_filename(raw)
                if clean:
                    return clean

            m = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
            if m:
                raw = m.group(1).replace("Vibe知识大赏", "").replace("·", "").replace("-", "").strip()
                raw = raw.split("：")[0].split(":")[0].strip()
                clean = sanitize_filename(raw)
                if clean:
                    return clean
        except Exception:
            pass

    return sanitize_filename(os.path.splitext(os.path.basename(html_path))[0])


def extract_duration(html_path, fallback_duration=160.0):
    """从入口 CFG 或同目录 config.js 提取时长。"""
    candidates = [html_path]
    cfg_path = os.path.join(os.path.dirname(os.path.abspath(html_path)), "config.js")
    if os.path.exists(cfg_path):
        candidates.append(cfg_path)
    for path in candidates:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(25000)
            m = re.search(r"duration\s*:\s*([0-9.]+)", content)
            if m:
                return float(m.group(1))
        except Exception:
            pass
    return fallback_duration


def find_default_bgm(project_root):
    """跨期共享 BGM，只认 assets/audio/。"""
    audio_dir = os.path.join(project_root, "assets", "audio")
    preferred = [
        os.path.join(audio_dir, "MidnightRush(旋律很哇塞)-云杪栖光.mp3"),
        os.path.join(audio_dir, "bgm.mp3"),
        os.path.join(audio_dir, "bgm.wav"),
    ]
    for c in preferred:
        if os.path.exists(c):
            return c
    try:
        for f in sorted(os.listdir(audio_dir)):
            if f.lower().endswith((".mp3", ".wav", ".aac", ".m4a")):
                return os.path.join(audio_dir, f)
    except Exception:
        pass
    return preferred[0]


def find_bgm(episode_dir, meta, project_root):
    """清单显式 BGM 优先，缺省固定共享 BGM；不自动拾取本期 assets/。"""
    bgm = meta.get("bgm")
    if bgm:
        candidates = [bgm] if os.path.isabs(bgm) else [
            os.path.join(project_root, bgm),
            os.path.join(episode_dir, bgm),
        ]
        for candidate in candidates:
            if os.path.isfile(candidate):
                return os.path.abspath(candidate)
        print(f"警告: episode.json 登记的 BGM 不存在: {bgm}")

    return find_default_bgm(project_root)


def find_sfx(episode_dir, meta, project_root):
    """可选语义音效轨：清单登记优先，其次本期 assets/sfx.wav；没有就返回 None。"""
    sfx = meta.get("sfx")
    if sfx is False:
        return None
    if sfx:
        candidates = [sfx] if os.path.isabs(sfx) else [
            os.path.join(project_root, sfx),
            os.path.join(episode_dir, sfx),
        ]
        for candidate in candidates:
            if os.path.isfile(candidate):
                return os.path.abspath(candidate)
        cue = os.path.join(episode_dir, "assets", "sfx.json")
        raise FileNotFoundError(
            f"episode.json 登记的音效轨不存在: {sfx}\n"
            f"  先生成音效: python scripts/make_sfx.py {os.path.relpath(cue, project_root)}\n"
            f"  或显式关闭: --no-sfx"
        )

    default = os.path.join(episode_dir, "assets", "sfx.wav")
    return os.path.abspath(default) if os.path.isfile(default) else None


def build_output_stem(slug, version, title):
    # slug 已带 -v1 / _v2 等版本后缀时不再重复追加
    version_pattern = rf"(?:^|[-_])v{re.escape(str(version))}$"
    base = slug if re.search(version_pattern, slug, re.IGNORECASE) else f"{slug}_v{version}"
    clean_title = sanitize_filename(title)
    return f"{base}_{clean_title}" if clean_title else base


def resolve_output_path(episode_dir, slug, version, title, output_arg, overwrite):
    """默认写入本期 dist/，并按 slug/版本/片名命名；默认不覆盖。"""
    if output_arg:
        output_path = os.path.abspath(output_arg)
    else:
        dist_dir = os.path.join(episode_dir, "dist")
        output_path = os.path.join(dist_dir, f"{build_output_stem(slug, version, title)}.mp4")

    if os.path.exists(output_path) and not overwrite:
        base, ext = os.path.splitext(output_path)
        counter = 2
        while os.path.exists(f"{base}_r{counter}{ext}"):
            counter += 1
        output_path = f"{base}_r{counter}{ext}"

    return output_path


def ensure_manifest(episode_dir, slug, title, version, duration, fps):
    """缺失清单时补一份最小清单，保证以后每期都有登记。"""
    path = os.path.join(episode_dir, "episode.json")
    if os.path.isfile(path):
        return None
    data = {
        "slug": slug,
        "title": title,
        "version": version,
        "status": "draft",
        "duration": duration,
        "fps": fps,
        "template": "assets/template.html",
        "publishDoc": None,
        "sfx": None,
        "supersedes": None,
        "supersededBy": None,
        "createdAt": datetime.now().astimezone().date().isoformat(),
    }
    write_json(path, data)
    return path


async def render_all_frames(html_path, temp_dir, total_frames, fps, num_workers):
    from playwright.async_api import async_playwright

    frames_dir = os.path.join(temp_dir, "gpu_frames")
    print("\n=======================================================")
    print(f"1. GPU Multi-Worker Rasterization: {total_frames} frames @ {fps}fps")
    print(f"   Workers: {num_workers} concurrent Chromium contexts (D3D11)")
    print(f"   Target HTML: {rel(html_path)}")
    print(f"   Frames: {rel(frames_dir)}")
    print("=======================================================")

    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)

    gpu_args = [
        "--enable-gpu",
        "--enable-gpu-rasterization",
        "--enable-zero-copy",
        "--ignore-gpu-blocklist",
    ]
    if sys.platform == "win32":
        gpu_args.extend(["--use-gl=angle", "--use-angle=d3d11"])
    elif sys.platform == "darwin":
        gpu_args.extend(["--use-gl=angle", "--use-angle=metal"])
    else:
        gpu_args.extend(["--use-gl=egl"])

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=gpu_args)
        try:
            pages = []
            file_url = "file:///" + os.path.abspath(html_path).replace("\\", "/")
            for _ in range(num_workers):
                page = await browser.new_page(viewport={"width": 1920, "height": 1080})
                page.on("pageerror", lambda e: print(f"[页面 JS 错误] {e}", file=sys.stderr))
                # 导航前注入，避免页面自带预览循环/自动播放抢在接管前启动
                await page.add_init_script("window.__RENDER_MODE__ = true;")
                await page.goto(file_url)
                await page.evaluate("document.fonts.ready.then(()=>true)")
                # Canvas 字体是按需懒加载的，必须显式加载全部字体面，否则首批帧会用回退字体
                await page.evaluate("Promise.all([...document.fonts].map(f => f.load().catch(() => {}))).then(() => true)")
                await page.evaluate("document.fonts.ready.then(()=>true)")
                if await page.evaluate("typeof window.setup === 'function'"):
                    await page.evaluate("new Promise(res => window.setup(res))")
                if not await page.evaluate("typeof window.render === 'function'"):
                    raise RuntimeError("页面没有暴露 window.render(t)")
                await page.evaluate("window.__RENDER_MODE__ = true")
                pages.append(page)

            print(f"Initialized {num_workers} GPU render workers. Dispatching frame jobs...\n")
            t0 = time.time()
            completed_count = 0

            async def worker_job(worker_id):
                nonlocal completed_count
                page = pages[worker_id]
                for fi in range(worker_id, total_frames, num_workers):
                    t = fi / fps
                    await page.evaluate(f"window.render({t})")
                    out_path = os.path.join(frames_dir, f"f{fi:06d}.jpg")
                    await page.screenshot(path=out_path, type="jpeg", quality=95)
                    completed_count += 1

                    if completed_count % 300 == 0 or completed_count == total_frames:
                        el = time.time() - t0
                        speed = completed_count / max(0.1, el)
                        eta = (total_frames - completed_count) / max(0.1, speed)
                        pct = (completed_count / total_frames) * 100
                        print(
                            f"[GPU Progress] {completed_count}/{total_frames} ({pct:5.1f}%) | "
                            f"Time: {el:4.0f}s | Speed: {speed:5.1f} fps | ETA: {eta:4.0f}s",
                            flush=True,
                        )

            await asyncio.gather(*(worker_job(i) for i in range(num_workers)))
        finally:
            await browser.close()

    rendered = len([f for f in os.listdir(frames_dir) if f.endswith(".jpg")])
    if rendered != total_frames:
        raise RuntimeError(f"帧数不完整: 期望 {total_frames}，实际 {rendered}")

    total_time = time.time() - t0
    print(f"\nAll {total_frames} frames rendered in {total_time:.1f}s ({total_frames/max(0.1, total_time):.1f} fps average).\n")
    return frames_dir


def encode_and_mix(frames_dir, bgm_path, sfx_path, output_mp4, temp_dir, duration, fps):
    ffmpeg = get_ffmpeg()
    print("=======================================================")
    print("2. Video Compression (NVENC, fallback libx264)")
    print("=======================================================")
    t0 = time.time()
    temp_video = os.path.join(temp_dir, "gpu_video_no_audio.mp4")

    enc_cmd = [
        ffmpeg, "-y",
        "-framerate", str(fps),
        "-i", os.path.join(frames_dir, "f%06d.jpg"),
        # Playwright JPEG 为全范围；统一转 BT.709 limited range，保证平台色彩一致
        "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709",
        "-c:v", "h264_nvenc",
        "-preset", "p6",
        "-tune", "hq",
        "-cq", "19",
        "-pix_fmt", "yuv420p",
        "-color_range", "tv",
        "-colorspace", "bt709",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        temp_video,
    ]
    result = subprocess.run(enc_cmd)
    if result.returncode != 0:
        print("NVENC 不可用或压制失败，回退 libx264 ...")
        if os.path.exists(temp_video):
            os.remove(temp_video)
        fallback_cmd = [
            ffmpeg, "-y",
            "-framerate", str(fps),
            "-i", os.path.join(frames_dir, "f%06d.jpg"),
            "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-color_range", "tv",
            "-colorspace", "bt709",
            "-color_primaries", "bt709",
            "-color_trc", "bt709",
            temp_video,
        ]
        subprocess.run(fallback_cmd, check=True)
    print(f"Video encoding finished in {time.time() - t0:.1f}s.\n")

    print("=======================================================")
    print("3. Audio Sync, SFX Mix & AAC Master Packaging")
    print(f"   Audio source: {rel(bgm_path)}")
    if sfx_path:
        print(f"   SFX layer:    {rel(sfx_path)}")
    print(f"   Start: 00:00:00 | Duration: {duration:.1f}s | FadeOut: 2.5s | Loudness: -14 LUFS / TP -1")
    print(f"   Output target: {rel(output_mp4)}")
    print("=======================================================")

    os.makedirs(os.path.dirname(os.path.abspath(output_mp4)), exist_ok=True)
    fade_start = max(0.0, duration - 2.5)
    input_args = [
        ffmpeg, "-y",
        "-i", temp_video,
        "-ss", "0",
        "-t", str(duration),
        "-i", bgm_path,
    ]
    if sfx_path:
        input_args += ["-ss", "0", "-t", str(duration), "-i", sfx_path]
        audio_filter = (
            "[1:a]volume=1.0[bg];"
            "[2:a]volume=1.0[fx];"
            "[bg][fx]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
            "alimiter=limit=0.95,"
            f"loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st={fade_start:.3f}:d=2.5,apad[a]"
        )
    else:
        audio_filter = f"[1:a]loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st={fade_start:.3f}:d=2.5,apad[a]"
    mix_cmd = input_args + [
        "-filter_complex", audio_filter,
        "-map", "0:v:0",
        "-map", "[a]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", str(duration),
        "-movflags", "+faststart",
        output_mp4,
    ]
    subprocess.run(mix_cmd, check=True)

    if not os.path.isfile(output_mp4) or os.path.getsize(output_mp4) == 0:
        raise RuntimeError(f"成片写出失败: {output_mp4}")

    print("\n=======================================================")
    print("MASTER VIDEO SUCCESSFULLY CREATED:")
    print(f"   {rel(output_mp4)}")
    print("=======================================================\n")
    return temp_video


def write_render_record(output_mp4, html_path, slug, title, version, meta,
                        duration, fps, total_frames, workers, bgm_path, sfx_path=None):
    record_path = os.path.splitext(output_mp4)[0] + ".render.json"
    record = {
        "slug": slug,
        "title": title,
        "version": version,
        "status": meta.get("status"),
        "html": rel(html_path),
        "output": rel(output_mp4),
        "renderedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "duration": duration,
        "fps": fps,
        "frames": total_frames,
        "workers": workers,
        "bgm": rel(bgm_path),
        "sfx": rel(sfx_path) if sfx_path else None,
        "template": meta.get("template"),
        "bytes": os.path.getsize(output_mp4),
        "sha256": sha256_file(output_mp4),
    }
    write_json(record_path, record)
    return record_path


def copy_to_desktop(output_mp4, title):
    if not os.path.isdir(DESKTOP_DIR):
        print("警告: 桌面目录不存在，跳过交付副本复制。")
        return None
    clean_title = sanitize_filename(title) or "成片"
    target = os.path.join(DESKTOP_DIR, f"{clean_title}_Vibe知识大赏.mp4")
    if os.path.exists(target):
        base, ext = os.path.splitext(target)
        counter = 2
        while os.path.exists(f"{base}_r{counter}{ext}"):
            counter += 1
        target = f"{base}_r{counter}{ext}"
    shutil.copy2(output_mp4, target)
    return target


def parse_args():
    parser = argparse.ArgumentParser(description="Vibe Knowledge Video GPU Master Renderer (V2.1)")
    parser.add_argument("--html", default=None, help="入口 HTML；默认读取 episodes/CURRENT")
    parser.add_argument("--bgm", default=None, help="BGM；默认本期 assets/ 优先，其次 assets/audio/")
    parser.add_argument("--sfx", default=None, help="语义音效 WAV；默认 episode.json 的 sfx 或本期 assets/sfx.wav")
    parser.add_argument("--no-sfx", action="store_true", help="本次渲染强制不混入音效轨")
    parser.add_argument("--output", default=None, help="成片路径；默认 episodes/<slug>/dist/<slug>_v<版本>_<片名>.mp4")
    parser.add_argument("--duration", type=float, default=None, help="总时长；默认读取 episode.json / HTML，回退 160.0")
    parser.add_argument("--fps", type=int, default=30, help="目标帧率（默认 30）")
    parser.add_argument("--workers", type=int, default=8, help="并发 Worker 数（默认 8）")
    parser.add_argument("--temp-dir", default=None, help="中间产物目录；默认 temp/<slug>/")
    parser.add_argument("--overwrite", action="store_true", help="允许覆盖同名成片（默认自动追加 _r2、_r3）")
    parser.add_argument("--copy-to-desktop", action="store_true", help="出片后额外复制一份到桌面（交付副本）")
    parser.add_argument("--keep-frames", action="store_true", help="成功后保留帧序列与无声视频")
    parser.add_argument("--dry-run", action="store_true", help="只打印解析后的路径和配置，不渲染")
    return parser.parse_args()


def main():
    args = parse_args()

    if args.html:
        html_path = os.path.abspath(args.html)
        print(f"指定入口: {rel(html_path)}")
    else:
        html_path, error = find_default_html(PROJECT_ROOT)
        if error:
            print(f"错误: {error}")
            sys.exit(1)
        print(f"自动选择当前期: {rel(html_path)}")

    if not os.path.isfile(html_path):
        print(f"错误: HTML 文件不存在: {html_path}")
        sys.exit(1)

    slug, episode_dir, is_archive = resolve_episode(html_path)
    meta, manifest_path = load_episode_meta(episode_dir, html_path)
    if meta.get("slug"):
        slug = meta["slug"]

    title = sanitize_filename(meta.get("title") or extract_video_title(html_path))
    version = int(meta.get("version") or 1)
    duration = args.duration if args.duration is not None else float(meta.get("duration") or extract_duration(html_path))
    fps = args.fps
    if fps <= 0 or args.workers <= 0:
        print("错误: --fps 与 --workers 必须大于 0")
        sys.exit(1)
    if duration <= 0:
        print("错误: 时长必须大于 0")
        sys.exit(1)

    temp_dir = os.path.abspath(args.temp_dir) if args.temp_dir else os.path.join(PROJECT_ROOT, "temp", slug)
    os.makedirs(temp_dir, exist_ok=True)
    bgm_path = os.path.abspath(args.bgm) if args.bgm else find_bgm(episode_dir, meta, PROJECT_ROOT)
    if not bgm_path or not os.path.isfile(bgm_path):
        print(f"\n[提示] 未找到背景音乐文件 (目标: {bgm_path})。")
        print("       已自动切换为无声静音回退轨 (Silent Fallback)，确保开箱即用直接渲染成功。")
        print("       提示: 您可将任意背景音乐放至 assets/audio/ 并在 episode.json 或 --bgm 中指定。\n")
        fallback_wav = os.path.join(temp_dir, "fallback_silent_bgm.wav")
        try:
            generate_silent_audio(get_ffmpeg(), fallback_wav, duration)
            bgm_path = fallback_wav
        except Exception as e:
            print(f"警告: 无法生成静音背景音乐: {e}，渲染将可能受到影响")

    if args.no_sfx:
        sfx_path = None
    elif args.sfx:
        sfx_path = os.path.abspath(args.sfx)
        if not os.path.isfile(sfx_path):
            print(f"错误: 找不到音效轨: {sfx_path}")
            sys.exit(1)
    else:
        sfx_path = find_sfx(episode_dir, meta, PROJECT_ROOT)

    output_mp4 = resolve_output_path(episode_dir, slug, version, title, args.output, args.overwrite)
    total_frames = int(round(duration * fps))

    publish_doc = meta.get("publishDoc")
    publish_status = ""
    if publish_doc:
        publish_status = "" if os.path.isfile(os.path.join(PROJECT_ROOT, publish_doc)) else " (文件缺失)"
    print("Configuration Summary:")
    print(f"   - Slug:     {slug}")
    print(f"   - Title:    {title}")
    print(f"   - Version:  v{version}")
    print(f"   - Status:   {meta.get('status', '(未登记)')}")
    print(f"   - HTML:     {rel(html_path)}")
    print(f"   - Manifest: {rel(manifest_path) if manifest_path else '(缺失，渲染时自动补最小清单)'}")
    print(f"   - Publish:  {publish_doc + publish_status if publish_doc else '(未登记)'}")
    print(f"   - Duration: {duration:.1f}s ({total_frames} frames @ {fps}fps)")
    print(f"   - BGM:      {rel(bgm_path)}")
    print(f"   - SFX:      {rel(sfx_path) if sfx_path else '(未启用)'}")
    print(f"   - Output:   {rel(output_mp4)}")
    print(f"   - Temp:     {rel(temp_dir)}")
    print(f"   - Workers:  {args.workers}")

    if args.dry_run:
        print("\n[dry-run] 未渲染、未写盘。")
        return

    if not is_archive:
        created = ensure_manifest(episode_dir, slug, title, version, duration, fps)
        if created:
            print(f"已补写本期清单: {rel(created)}")

    os.makedirs(temp_dir, exist_ok=True)
    frames_dir = asyncio.run(render_all_frames(html_path, temp_dir, total_frames, fps, args.workers))
    temp_video = encode_and_mix(frames_dir, bgm_path, sfx_path, output_mp4, temp_dir, duration, fps)
    record_path = write_render_record(
        output_mp4, html_path, slug, title, version, meta,
        duration, fps, total_frames, args.workers, bgm_path, sfx_path,
    )
    print(f"渲染记录: {rel(record_path)}")

    if args.copy_to_desktop:
        desktop_copy = copy_to_desktop(output_mp4, title)
        if desktop_copy:
            print(f"交付副本: {desktop_copy}")

    if not args.keep_frames:
        shutil.rmtree(frames_dir, ignore_errors=True)
        if os.path.exists(temp_video):
            os.remove(temp_video)
        print(f"已清理中间帧: {rel(temp_dir)}")


if __name__ == "__main__":
    main()
