# AGENTS.md — vibe-knowledge-video 通用 Agent 指令 (V2.1)

> 本文件是给 AI 编程助手（OpenAI Codex / Gemini CLI / Jules / Cursor / Trae 等）看的入口指令。
> 这些工具会自动读取仓库根目录的 `AGENTS.md` 并遵守其中约定。

## 你现在拿到了什么

这是一个**工业级 AI 知识视频制作技能仓库**：把数学/概率/哲学/计算机等硬知识拍成「Vibe知识大赏」风格的电影感知识短视频（1920×1080、严格 30fps、2:30–2:50 / 典型 160.0s / 4800 帧、零配音纯器乐 BGM、中英双语胶囊悬浮字幕、纯代码 HTML5 Canvas 驱动、GPU 硬件加速合成）。

## 收到视频制作请求时，你必须这样做

1. **先完整阅读 `SKILL.md`**——它是七步工作流的总纲（选题核实→剧本→分镜→用户确认→代码实现→渲染合成→自检交付），逐步执行，不可跳步。
2. 需要风格与叙事细节时读 `references/`：
   - `references/cinematic-vibe-engine.md` — 电影级视听美学、后期光学链（Bloom/暗角/颗粒）、材质光影与乐句网格（必读）
   - `references/bgm-beat-map.md` — 共享 BGM 实测卡点表（112.90 BPM、0–75 小节帧网格、章节锚点与自检命令）
   - `references/style-guide.md` — 布局坐标、配色渐变、动效规格、视觉母题库
   - `references/narrative-templates.md` — 六段式叙事弧模板 + 原片逐段拆解
   - `references/prompt-brief.md` — 创作简报（Brief）填空模板
   - `references/script.md` — 字幕文体规律
   - `references/visualization.md` — 文案转画面的动态设计
3. 写代码前**必须让用户确认剧本和分镜**（第 4 步），不要自作主张直接开做。
4. 用 `python scripts/new_episode.py <slug> --title "《片名》"` 创建一期工程（固定目录 + `episode.json` + 发布文案骨架 + 更新 `episodes/CURRENT`）。页面模板以 `assets/template.html` 为唯一正式模板，替换 `CFG / SUBTITLES / SECTIONS / TITLE_CARD`，在 `drawScene(t)` 里实现中央动画。入口必须是 `episodes/<slug>/index.html`。

## 环境准备（渲染合成前执行一次）

```bash
# Python 依赖 (V2 GPU 流水线需 imageio-ffmpeg)
pip install playwright pillow numpy imageio-ffmpeg

# 无头浏览器环境
playwright install chromium

# ffmpeg（V2 与 QA 默认自动使用 imageio-ffmpeg 内置二进制；V1 build_video.sh 需要系统 ffmpeg）
# 可选：系统级 ffmpeg
# Ubuntu/Debian: apt install -y ffmpeg
# macOS: brew install ffmpeg
# Windows: winget install ffmpeg

# 可选：QA 字幕 OCR 校验
# apt install -y tesseract-ocr tesseract-ocr-chi-sim
```

## 不可违反的技术契约

- **纯时间函数渲染**：每集 `episodes/<slug>/index.html` 必须暴露 **`window.render(t)`**：给定秒数 t 画出该帧；画面只由 t 决定（固定随机种子 `mulberry32`、禁止 setTimeout/setInterval、无帧间状态）。
- **渲染模式安全接管**：渲染器会设置 `window.__RENDER_MODE__ = true` 接管渲染循环——页面自带的 `requestAnimationFrame` 预览循环检测到该标志后**必须立刻停止**（`if (window.__RENDER_MODE__) return;`），否则会用墙上时钟覆盖渲染器的画面状态，并自动隐藏 `#player-controls` 播放器控制栏。
- **字体就绪校验**：截图前确保字体加载完成。Canvas 字体会按需懒加载，渲染器会等 `document.fonts.ready` 并强制加载全部字体面；页面不要做运行时字体切换。首次渲染需联网访问 Google Fonts，离线会回退系统字体。
- **Canvas 文字手动换行**：禁止依赖浏览器自动换行。
- **卡片边界安全锚定**：卡片右侧文本必须显式设置 `textAlign = 'right'`，并将 X 坐标锚定在 `cardX + cardWidth - safetyMargin`（安全边距 $\ge 20\text{px}$），禁止写死常量造成截断。
- **视觉风格基调**：深蓝黑渐变 `#0F0D24` $\to$ `#080716` $\to$ `#03020A`，左上角恒定标注作者水印 `@anran`，当前年份 2026。
- **双语胶囊悬浮框**：字幕置于 $y \approx 85-91\%$ 胶囊框内，中文主句（加粗，支持 `<em>` 金色强调）+ 英文斜体小字。
- **约 16–24s 标题卡**：模板默认 16–22s，实际按 BGM 小节对齐（通常 17.3–23.7s）；居中落《片名》标题卡（大写标签 + 金色大字片名 + 中英双语核心提问）。
- **统一 BGM**：默认且统一使用共享 `assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3`；禁止逐期运行 `synth_bgm.py` 或在 `episodes/<slug>/assets/` 生成 `bgm.wav`。`episode.json` 的 `bgm` 指向共享 MP3，仅当用户明确要求自定义配乐时才更换音源。渲染端负责 `-14 LUFS / TP -1` 与 2.5s 淡出，源文件不改。
- **语义音效（可选，不替代 BGM）**：在 `episodes/<slug>/assets/sfx.json` 写 cue 表，运行 `python scripts/make_sfx.py episodes/<slug>/assets/sfx.json` 生成 44.1kHz 立体声 `sfx.wav`，并把 `episode.json.sfx` 指向该 WAV。音效只做语义点缀（转场 / 落点 / 翻页 / 打印 / 冲击），渲染端与 BGM 1:1 混合后统一做 `-14 LUFS / TP -1` 与 2.5s 淡出。`sfx.wav` 被 `.gitignore` 忽略，cue 表才是可复现源；渲染前必须先生成，缺失时渲染器会直接报错。

## 落盘规范（不可违反）

- **一期一目录**：工程与媒体产物只写入 `episodes/<slug>/`；项目根目录禁止出现 `final.mp4`、`out_frames/`、`preview/`、`bgm.wav` 等生成物。
- **唯一清单**：`episodes/<slug>/episode.json` 记录 `slug / title / version / status / duration / fps / publishDoc / bgm / sfx（可选）/ supersedes / supersededBy`。渲染前先读清单，不靠片名猜。
- **固定子目录**：
  - `dist/` — 成片主档与 `.render.json` 渲染记录
  - `preview/` — 抽帧预览
  - `qa/` — QA 报告
  - `assets/` — 本期字体 / 图片 / `sfx.json`（音效 cue 表）/ `sfx.wav`（由 cue 表生成）等素材（BGM 默认不放入，统一用共享 MP3）
- **命名**：成片主档为 `dist/<slug>_v<version>_<片名>.mp4`；slug 已带 `_v2` / `-v2` 版本后缀时不重复追加。默认不覆盖，需覆盖才加 `--overwrite`。桌面副本只是交付副本，不是归档。
- **中间产物**：`temp/<slug>/`，成功出片后默认可删除。
- **发布文案**：`publish/douyin/<slug>.md`，由 `episode.json` 的 `publishDoc` 指向；已有旧文案保留原名并在清单中映射。
- **版本淘汰**：旧版目录保留，`status` 改为 `archived`，`supersededBy` 指向新版；不要删除旧工程。

## 渲染合成命令（第 6 步）

### 推荐：V2 Windows GPU 硬件加速流水线（RTX + NVENC）

```bash
# 方式 A：双击运行一键批处理（自动读取 episodes/CURRENT）
render_and_mix.bat

# 方式 B：Python 命令行执行（不指定 --html 时读取 episodes/CURRENT）
python scripts/gpu_master_render.py --duration 160.0 --fps 30 --workers 8

# 指定某一期或归档页面
python scripts/gpu_master_render.py --html episodes/procrastination/index.html
python scripts/gpu_master_render.py --html episodes/archive/index_drone.html

# 只检查清单/路径/时长，不渲染
python scripts/gpu_master_render.py --dry-run

# 需要覆盖同名成片，或额外复制一份到桌面
python scripts/gpu_master_render.py --overwrite
python scripts/gpu_master_render.py --copy-to-desktop

# 可选：先生成/更新语义音效轨（cue 表 → 44.1kHz 立体声 WAV）
python scripts/make_sfx.py episodes/memory/assets/sfx.json

# 混入语义音效轨（默认读 episode.json.sfx 或本期 assets/sfx.wav；--no-sfx 强制关闭）
python scripts/gpu_master_render.py --sfx episodes/memory/assets/sfx.wav
python scripts/gpu_master_render.py --no-sfx
```

成片默认写入 `episodes/<slug>/dist/<slug>_v<version>_<片名>.mp4`；归档页写入 `episodes/archive/dist/`。

### 跨平台：V1 可移植流水线（纯 CPU / Linux / macOS）

```bash
python3 scripts/render_frames.py episodes/procrastination/index.html temp/procrastination/frames --fps 30 --duration 160
python3 scripts/render_frames.py episodes/procrastination/index.html episodes/procrastination/preview --duration 160 --preview 8
# BGM 固定使用共享 MP3，不逐期合成；build_video.sh 自动做 -14 LUFS/TP -1 与 2.5s 淡出
# 可选语义音效：先 make_sfx.py 生成 WAV，再用 --sfx 混入（V1 与 V2 的混音口径一致）
bash scripts/build_video.sh temp/procrastination/frames "assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3" episodes/procrastination/dist/procrastination_v1_拖延不是懒.mp4 --sfx episodes/memory/assets/sfx.wav
python3 scripts/qa_check.py episodes/procrastination/dist/procrastination_v1_拖延不是懒.mp4
```

## 能力边界（对用户诚实）

- 若当前环境**无法安装依赖或执行 shell**（如纯对话型网页 AI）：只完成第 1–5 步（剧本/分镜/index.html 代码），并把上面渲染命令原样交给用户，请其在本地终端执行第 6–7 步。
- 所有事实（年份/人名/论文名/数字）须联网核实，没把握的不写。

## 语言

与用户交流用中文；代码注释用中文；成片字幕为中文主句 + 英文斜体对照（风格 DNA 要求）。
