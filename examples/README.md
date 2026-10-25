# 示例作品

本目录只存放示例入口与参考页面，**不要在这里生成帧序列、音频或成片**。

快速验证模板（在仓库根目录执行）：

```bash
python scripts/new_episode.py example --title "《示例》"
python scripts/render_frames.py episodes/example/index.html episodes/example/preview --duration 160 --preview 8
python scripts/gpu_master_render.py --html episodes/example/index.html --duration 160 --fps 30 --workers 8
python scripts/qa_check.py episodes/example/dist/example_v1_示例.mp4
```

产物落点：抽帧预览进 `episodes/<slug>/preview/`，成片进 `episodes/<slug>/dist/`，渲染中间帧进 `temp/<slug>/`。

欢迎 PR 你的成片（附 `episodes/<slug>/index.html` 与视频链接）到本目录。
