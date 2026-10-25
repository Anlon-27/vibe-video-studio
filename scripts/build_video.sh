#!/bin/bash
# build_video.sh — 帧序列 + BGM（+ 可选语义音效）→ 成片 MP4（Vibe知识大赏规格）
# 用法: bash build_video.sh temp/<slug>/frames episodes/<slug>/assets/bgm.wav episodes/<slug>/dist/<slug>_v1_<片名>.mp4 [--fps 30] [--crf 18] [--sfx episodes/<slug>/assets/sfx.wav]
set -euo pipefail

FRAMES="${1:?用法: build_video.sh <帧目录> <bgm.wav> <输出.mp4> [--fps N] [--crf N] [--sfx <wav>]}"
AUDIO="${2:?缺少 BGM 路径}"
OUT="${3:?缺少输出路径}"
shift 3 || true

FPS=30; CRF=18; PRESET=medium; SFX=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fps) FPS="$2"; shift 2;;
    --crf) CRF="$2"; shift 2;;
    --sfx) SFX="$2"; shift 2;;
    *) echo "未知参数: $1" >&2; exit 2;;
  esac
done

# 编码器自动检测: libx264 > libopenh264（CRF 不通用时用高质量码率）
VENC=$( { ffmpeg -hide_banner -encoders 2>/dev/null || true; } | grep -o libx264 | head -1 || true)
if [[ -n "$VENC" ]]; then
  VCODEC="-c:v libx264 -preset $PRESET -crf $CRF"
else
  VCODEC="-c:v libopenh264 -b:v 12M"   # 高码率近似 CRF18 视觉质量
  echo "提示: 无 libx264，使用 libopenh264（码率模式）"
fi

[[ -d "$FRAMES" ]] || { echo "帧目录不存在: $FRAMES" >&2; exit 2; }
[[ -f "$AUDIO" ]] || { echo "BGM 不存在: $AUDIO" >&2; exit 2; }
[[ -z "$SFX" || -f "$SFX" ]] || { echo "SFX 不存在: $SFX" >&2; exit 2; }

N_FRAMES=$(ls "$FRAMES" | grep -c '\.png$' || true)
[[ "$N_FRAMES" -gt 0 ]] || { echo "帧目录里没有 PNG" >&2; exit 2; }
DUR=$(python3 -c "print(f'{$N_FRAMES/$FPS:.3f}')")
echo "帧数: $N_FRAMES  时长: ${DUR}s  FPS: $FPS"

# 1) 帧序列 → 无声视频（yuv420p 保证抖音兼容）
ffmpeg -y -v error -framerate "$FPS" -i "$FRAMES/f%06d.png" \
  -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709" \
  $VCODEC -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -movflags +faststart "$OUT"

# 2) 混入 BGM（+ 可选语义音效），响度归一 -14 LUFS（抖音标准），峰值 -1dB；-t 防止 apad 无限延长
TMP_A="$(mktemp "${TMPDIR:-/tmp}/mix_norm_XXXXXX.wav")"
trap 'rm -f "$TMP_A"' EXIT
FADE_START=$(python3 -c "print(max(0,$DUR-2.5))")
if [[ -n "$SFX" ]]; then
  # 与 V2 GPU 流水线一致：BGM 与音效 1:1 混合后再统一响度归一
  ffmpeg -y -v error -i "$AUDIO" -i "$SFX" \
    -filter_complex "[0:a]volume=1.0[bg];[1:a]volume=1.0[fx];[bg][fx]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st=${FADE_START}:d=2.5,apad[a]" \
    -map "[a]" -ar 44100 -t "$DUR" "$TMP_A"
else
  ffmpeg -y -v error -i "$AUDIO" \
    -af "loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st=${FADE_START}:d=2.5,apad" \
    -ar 44100 -t "$DUR" "$TMP_A"
fi

# 3) 合成最终片，按帧数推导的 DUR 精确截断
ffmpeg -y -v error -i "$OUT" -i "$TMP_A" \
  -c:v copy -c:a aac -b:a 192k -t "$DUR" \
  -movflags +faststart "${OUT%.mp4}_final.mp4"
mv "${OUT%.mp4}_final.mp4" "$OUT"

ffprobe -v error -show_entries format=duration -show_entries stream=codec_type,codec_name,width,height -of csv=p=0 "$OUT" | tr '\n' ' '
echo "→ 成片: $OUT"
