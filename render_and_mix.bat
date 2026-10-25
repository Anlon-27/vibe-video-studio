@echo off
chcp 65001 >nul
echo ========================================================
echo  Vibe知识大赏 · 一键全自动 GPU 硬件加速视频渲染流水线 (V2.1)
echo ========================================================
echo.
cd /d "%~dp0"
python scripts\gpu_master_render.py %*
echo.
echo 渲染已结束，请检查成片输出。
pause
