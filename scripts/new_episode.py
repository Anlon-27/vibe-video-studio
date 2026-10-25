#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""创建一期新工程：固定目录结构 + episode.json + 发布文案骨架 + CURRENT 指针。

用法:
  python scripts/new_episode.py <slug> --title "《片名》"
  python scripts/new_episode.py inertia --title "《惯性》" --duration 160 --version 1
"""

import argparse
import json
import os
import re
import shutil
import sys
from datetime import date

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
EPISODES_DIR = os.path.join(PROJECT_ROOT, "episodes")
DEFAULT_TEMPLATE = os.path.join(PROJECT_ROOT, "assets", "template.html")
DEFAULT_BGM = "assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3"
PUBLISH_DIR = os.path.join(PROJECT_ROOT, "publish", "douyin")


def sanitize_slug(slug):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", slug):
        raise ValueError("slug 只能使用字母、数字、点、下划线、短横线，且必须以字母或数字开头")
    return slug


def sanitize_title(title):
    title = title.strip().strip("《》")
    title = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", title)
    title = re.sub(r"\s+", " ", title).strip(" .")
    if not title:
        raise ValueError("标题不能为空")
    return title


def output_stem(slug, version, title):
    version_pattern = rf"(?:^|[-_])v{re.escape(str(version))}$"
    base = slug if re.search(version_pattern, slug, re.IGNORECASE) else f"{slug}_v{version}"
    return f"{base}_{title}"


def build_publish_skeleton(slug, title, version, duration, fps):
    stem = output_stem(slug, version, title)
    return f"""# 《{title}》· 抖音全案发布文案与置顶策略

> 成片主档：`episodes/{slug}/dist/{stem}.mp4`
> 规格：1920×1080 / {fps}fps / {duration:g}s / 无旁白 / 中英双语字幕 / 共享 BGM + 可选语义音效
> 页面：`episodes/{slug}/index.html`
> 状态：draft

## 主文案

（待填写：悬念钩子 + 痛点场景 + 硬核破局 + 模型推演 + 哲学收尾）

## 置顶评论

（待填写：互动问题 + 关键数据 + 参考文献）

## 参考文献

（待填写；所有年份/人名/数字须联网核实）
"""


def main():
    parser = argparse.ArgumentParser(description="创建一期新的 Vibe 知识视频工程")
    parser.add_argument("slug", help="目录名/归档标识，例如 procrastination")
    parser.add_argument("--title", required=True, help="片名，可带《》")
    parser.add_argument("--version", type=int, default=1)
    parser.add_argument("--duration", type=float, default=160.0)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--template", default=DEFAULT_TEMPLATE)
    parser.add_argument("--dry-run", action="store_true", help="只打印将创建的内容，不写盘")
    args = parser.parse_args()

    try:
        slug = sanitize_slug(args.slug)
        title = sanitize_title(args.title)
    except ValueError as e:
        print(f"错误: {e}")
        sys.exit(1)

    if args.version <= 0:
        print("错误: --version 必须大于 0")
        sys.exit(1)
    if args.version > 1 and not re.search(rf"(?:^|[-_])v{args.version}$", slug, re.IGNORECASE):
        print(f"错误: version>1 时 slug 必须以 _v{args.version} 或 -v{args.version} 结尾（一期一目录，旧版保留）")
        sys.exit(1)
    if args.duration <= 0 or args.fps <= 0:
        print("错误: --duration 与 --fps 必须大于 0")
        sys.exit(1)
    if not os.path.isfile(args.template):
        print(f"错误: 模板不存在: {args.template}")
        sys.exit(1)

    episode_dir = os.path.join(EPISODES_DIR, slug)
    if os.path.exists(episode_dir):
        print(f"错误: 目录已存在，拒绝覆盖: {os.path.relpath(episode_dir, PROJECT_ROOT)}")
        sys.exit(1)

    publish_path = os.path.join(PUBLISH_DIR, f"{slug}.md")
    stem = output_stem(slug, args.version, title)
    manifest = {
        "slug": slug,
        "title": title,
        "version": args.version,
        "status": "draft",
        "duration": args.duration,
        "fps": args.fps,
        "template": os.path.relpath(args.template, PROJECT_ROOT).replace("\\", "/"),
        "publishDoc": os.path.relpath(publish_path, PROJECT_ROOT).replace("\\", "/"),
        "bgm": DEFAULT_BGM,
        "sfx": None,
        "supersedes": None,
        "supersededBy": None,
        "createdAt": date.today().isoformat(),
    }

    print("将创建一期新工程:")
    print(f"  目录:       episodes/{slug}/")
    print(f"  入口:       episodes/{slug}/index.html（来自 {os.path.relpath(args.template, PROJECT_ROOT)}）")
    print(f"  清单:       episodes/{slug}/episode.json")
    print(f"  产物目录:   episodes/{slug}/dist/  preview/  qa/  assets/")
    print(f"  音效（可选）: episodes/{slug}/assets/sfx.json → assets/sfx.wav")
    print(f"  成片主档:   episodes/{slug}/dist/{stem}.mp4")
    print(f"  发布文案:   publish/douyin/{slug}.md")
    print(f"  CURRENT:    {slug}")

    if args.dry_run:
        print("\n[dry-run] 未写盘。")
        return

    # 1. 目录骨架
    os.makedirs(episode_dir)
    for sub in ("dist", "preview", "qa", "assets"):
        os.makedirs(os.path.join(episode_dir, sub))

    # 2. 模板入口（替换片名与时长）
    with open(args.template, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("《片名》", f"《{title}》")
    content = re.sub(r"(duration\s*:\s*)160\.0", rf"\g<1>{args.duration:g}", content, count=1)
    # 模板位于 assets/，复制到 episodes/<slug>/ 后音频需改为跨两级的共享路径
    content = content.replace('src="audio/', 'src="../../assets/audio/')
    with open(os.path.join(episode_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(content)

    # 3. 本期清单
    with open(os.path.join(episode_dir, "episode.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # 4. CURRENT 指针
    with open(os.path.join(EPISODES_DIR, "CURRENT"), "w", encoding="utf-8") as f:
        f.write(slug + "\n")

    # 5. 发布文案骨架（已存在则不覆盖）
    os.makedirs(PUBLISH_DIR, exist_ok=True)
    if os.path.exists(publish_path):
        print(f"提示: 发布文案已存在，保留原文件: {os.path.relpath(publish_path, PROJECT_ROOT)}")
    else:
        with open(publish_path, "w", encoding="utf-8") as f:
            f.write(build_publish_skeleton(slug, title, args.version, args.duration, args.fps))

    print("\n创建完成。下一步:")
    print(f"  1. 编辑 episodes/{slug}/index.html，替换 CFG / SUBTITLES / SECTIONS / TITLE_CARD 与中央动画")
    print(f"  2. 可选音效: 写 episodes/{slug}/assets/sfx.json 后运行 python scripts/make_sfx.py episodes/{slug}/assets/sfx.json")
    print(f"     再把 episode.json 的 sfx 指向 episodes/{slug}/assets/sfx.wav，并把页面 CFG.sfx 设为 'assets/sfx.wav'")
    print(f"  3. 预检: python scripts/gpu_master_render.py --html episodes/{slug}/index.html --dry-run")
    print(f"  4. 渲染: python scripts/gpu_master_render.py --html episodes/{slug}/index.html")
    print(f"  5. 自检: python scripts/qa_check.py episodes/{slug}/dist/{stem}.mp4")


if __name__ == "__main__":
    main()
