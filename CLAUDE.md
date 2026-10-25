# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目性质

这是一个 AI Agent 技能仓库（vibe-knowledge-video）：把硬知识做成「Vibe知识大赏」风格的电影感短视频（1920×1080 / 30fps、无配音、中文主句 + 英文斜体双语字幕、纯代码生成）。没有构建系统和单元测试；"代码"是静态 HTML Canvas 页面（单文件或模块化均可）+ Python/ffmpeg 渲染脚本，验证手段是抽帧预览和 `qa_check.py`。

与用户交流用中文，代码注释用中文。

## 收到视频制作请求时

1. 先完整读 `SKILL.md`（工作流总纲），需要细节时读 `references/`：`cinematic-vibe-engine.md`（电影感后期光学链/物理材质/乐句网格/审美标准）、`style-guide.md`（布局坐标/配色/动效）、`narrative-templates.md`（六段叙事弧 + 原片拆解）、`prompt-brief.md`（简报模板）、`script.md`（字幕文体规律）、`visualization.md`（文案→画面的讲解设计）、`bgm-beat-map.md`（共享 BGM 实测卡点网格：BPM 112.90、`BAR0=0.228s`，字幕/转场时间点一律用其中的 `bar(n)`/`beat(n)` 计算，禁止手抄近似值）。
2. 事实（年份/人名/论文/数字）须联网核实，没把握的不写。
3. 写代码前必须让用户确认剧本和分镜，不要直接开做。
4. 用 `python scripts/new_episode.py <slug> --title "《片名》"` 创建一期工程（固定目录 + `episode.json` + 发布文案骨架 + 更新 `episodes/CURRENT`）。新片从 `assets/template.html`（唯一正式模板；`examples/` 仅参考）改起，替换 `CFG / SUBTITLES / SECTIONS / TITLE_CARD`，在 `drawScene(t)` 里实现中央动画；入口必须是 `episodes/<slug>/index.html`。
5. BGM 一律使用共享 `assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3`，由 `episode.json.bgm` 指向；不要逐期运行 `synth_bgm.py` 或生成 `episodes/<slug>/assets/bgm.wav`，除非用户明确要求自定义配乐。渲染端负责 `-14 LUFS / TP -1` 与 2.5s 淡出，源文件不改。
6. 语义音效是可选叠加层，不替代 BGM：cue 表写 `episodes/<slug>/assets/sfx.json`，运行 `python scripts/make_sfx.py` 生成 44.1kHz 立体声 `assets/sfx.wav`，再让 `episode.json.sfx` 指向它；`sfx.wav` 被 `.gitignore` 忽略，cue 表才是可复现源。渲染器将 BGM 与 SFX 1:1 混合后统一归一化；清单登记但文件缺失时直接报错，`--no-sfx` 可显式关闭。

规范版本已全面统一到 V2.1：`SKILL.md`、`README.md`、`AGENTS.md`、`assets/template.html` 均已同步为 V2.1 工业级标准（160.0s/4800 帧、底色 `#0F0D24` 渐变、水印 `@anran`、年份 2026、GPU 流水线）。

## 页面技术契约（渲染器依赖，不可违反）

- 每集 `episodes/<slug>/index.html` 必须暴露 `window.render(t)`：画面只由 t 决定。随机数用固定种子（模板里的 `mulberry32`），禁止 setTimeout / 帧间状态驱动内容。
- 渲染器会设 `window.__RENDER_MODE__ = true`；页面自带的 rAF 预览循环检测到后必须停止，否则会用墙上时钟覆盖画面。入口页面在该模式下还会隐藏 `#player-controls` 预览控件。
- 可选 `window.setup(done)` 异步初始化钩子；截图前等 `document.fonts.ready`。
- Canvas 文字手动换行；右对齐文本用 `textAlign='right'` 并锚定 `cardX + cardWidth - 安全边距(≥20px)`，不要写死常量。
- 分层结构：`#bg`（背景星空）/ `#scene`（中央动画）两层 canvas + DOM 叠加层（水印、顶标签、注释带、`#subtitle`/`#subtitle-en` 字幕、`#titlecard` 标题卡）。

## 两套渲染流水线

**V1 可移植流水线**（PNG 帧 → libx264，共享 BGM）：

```bash
python3 scripts/render_frames.py episodes/procrastination/index.html temp/procrastination/frames --fps 30 --duration 160
python3 scripts/render_frames.py episodes/procrastination/index.html episodes/procrastination/preview --duration 160 --preview 8
# BGM 固定使用共享 MP3，不逐期合成；有 SFX 时在合成命令末尾追加 --sfx episodes/<slug>/assets/sfx.wav
# 可选：先生成语义音效轨（cue 表 → WAV）
python3 scripts/make_sfx.py episodes/procrastination/assets/sfx.json
bash scripts/build_video.sh temp/procrastination/frames "assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3" episodes/procrastination/dist/procrastination_v1_拖延不是懒.mp4
python3 scripts/qa_check.py episodes/procrastination/dist/procrastination_v1_拖延不是懒.mp4
```

**V2 Windows GPU 流水线**（当前实际使用，RTX + NVENC）：

```bash
python scripts/gpu_master_render.py --html episodes/procrastination/index.html --workers 8   # 时长默认读 episode.json / HTML，回退 160.0
render_and_mix.bat   # 读取 episodes/CURRENT；参数原样透传给 gpu_master_render.py
python scripts/gpu_master_render.py --dry-run   # 只检查清单/路径/时长
python scripts/dev/snap.py episodes/<slug>/index.html 5 18 30   # 开发期快速抽帧：指定秒数 → temp/snap/ + 拼图 sheet.jpg（需 playwright + Pillow）
```

- 多个 Chromium 页面（D3D11/ANGLE）按 `fi % workers` 交错分片截 JPEG 到 `temp/<slug>/gpu_frames/`（每次运行先清空），统一转 BT.709 limited-range 后 `h264_nvenc` 压制（失败自动回退 libx264），最后混入共享 BGM（从 00:00 起截取 duration 秒）与可选 SFX（1:1 → alimiter → `loudnorm=I=-14:TP=-1`，尾部 2.5s `afade`；BGM 短于成片时自动补静音）。SFX 可由 `--sfx` 显式指定或读 `episode.json.sfx`；清单登记却缺失时直接报错，`--no-sfx` 关闭。
- 用 `imageio_ffmpeg` 自带的 ffmpeg，不依赖系统 ffmpeg；需要 `pip install imageio-ffmpeg`。
- 落盘解析：不指定 `--html` 时只认 `episodes/CURRENT`（不再按修改时间猜）；从入口目录和 `episode.json` 推导 slug/版本/片名；成片默认写入 `episodes/<slug>/dist/<slug>_v<版本>_<片名>.mp4`（slug 已带版本后缀则不重复追加），同名已存在时自动追加 `_r2`、`_r3`…，`--overwrite` 才覆盖；每次渲染写 `<成片名>.render.json`。成功后默认删除帧序列，`--keep-frames` 保留。
- BGM 解析：`--bgm` > `episode.json.bgm` > `assets/audio/` 共享音源；不会自动拾取本期 `assets/`（`--bgm` 的 help 文本说"本期 assets/ 优先"已过时，以代码为准）。桌面副本仅在 `--copy-to-desktop` 时生成。
- `scripts/new_episode.py` 负责创建一期固定目录、清单、发布文案骨架并更新 `CURRENT`。
- `scripts/qa_check.py` 在成片位于 `dist/` 时默认把 QA 报告写入本期 `qa/`；优先使用系统 ffmpeg，缺失时回退 imageio-ffmpeg。
- `scripts/pipe_render.py` 是单页面 → ffmpeg 管道的旧版实验脚本，默认指向 `episodes/archive/index_ecommerce.html`。

## 工作区约定

- `episodes/<slug>/` 是各期成片的自包含工程：入口 `index.html`、清单 `episode.json`、产物 `dist/`、抽帧 `preview/`、QA 报告 `qa/`、本期素材 `assets/`（含可选 `sfx.json` 与生成的 `sfx.wav`）；`episodes/CURRENT` 指向默认渲染期；`episodes/archive/` 是早期单体页面 + `manifest.json`。
- `publish/douyin/` 存放对应的抖音发布文案（主文案 + 置顶评论 + 参考文献，模板见 `SKILL.md` 第四节）；新文件用 `<slug>.md`，已有旧文件由 `episode.json` 的 `publishDoc` 映射。
- `assets/audio/` 存放共享 BGM；`temp/<slug>/` 存放可再生成的渲染中间产物。`temp/`、单集 `preview/`、`*.mp3`、`*.wav`、`*.mp4` 和根目录抽帧预览图已被 `.gitignore` 忽略。
- 落盘铁律：一期一目录；根目录不放生成物；成片主档只进 `dist/`；默认不覆盖；旧版目录保留并标记 `status: archived` + `supersededBy`。
- `docs/original-analysis/` 是原片逐秒 OCR 记录，仅作风格研究，勿二次发布。
- 不能执行 shell 的环境下只做到剧本/分镜/index.html，把上面的渲染命令交给用户本地执行（见 `AGENTS.md`）。
