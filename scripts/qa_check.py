#!/usr/bin/env python3
"""
qa_check.py — Vibe知识大赏 成片自检（不过不出门）
用法:
  python3 qa_check.py episodes/<slug>/dist/<成片>.mp4
  python3 qa_check.py episodes/<slug>/dist/<成片>.mp4 --report episodes/<slug>/qa/<成片>.json

检查项（逆向自原片风格规范）:
  A. 规格: 分辨率/帧率/时长/音轨存在
  B. 画面: 深色背景占比（去默认白底）、每帧亮度中带（内容居中度）
  C. 节奏: 抽帧序列的结构变化率（每 2-4s 应有新东西 → 相邻样本帧差异）
  D. 字幕: 底部 87% 高度区域是否有高对比文字带（OCR 验证，需 tesseract+chi_sim）
  E. 音频: BGM 响度/时长与视频匹配、无爆音（削波检测）

输出六维评分建议 + 最严重问题清单（带时间点）。
默认把结构化报告写入本期 qa/ 目录（当成片位于 episodes/<slug>/dist/ 时）。
"""
import argparse, datetime, glob, json, os, re, shutil, subprocess, sys, tempfile
import numpy as np

FFMPEG = shutil.which('ffmpeg')
if not FFMPEG:
    try:
        import imageio_ffmpeg
        FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass

def probe_info(path):
    """不依赖 ffprobe：直接解析 ffmpeg -i 的输出。"""
    r = subprocess.run([FFMPEG,'-hide_banner','-i',path],
                       capture_output=True, text=True, errors='ignore')
    text = r.stderr
    result = {'duration': 0.0, 'width': 0, 'height': 0, 'fps': '', 'hasAudio': False}
    m = re.search(r'Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)', text)
    if m:
        result['duration'] = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    for line in text.splitlines():
        if 'Stream #' not in line:
            continue
        if 'Video:' in line:
            size = re.search(r'(\d{2,5})x(\d{2,5})', line)
            if size:
                result['width'], result['height'] = int(size.group(1)), int(size.group(2))
            fps = re.search(r'(\d+(?:\.\d+)?)\s*fps', line)
            if fps:
                result['fps'] = fps.group(1)
        if 'Audio:' in line:
            result['hasAudio'] = True
    return result

def sample_frames(path, n, outdir):
    subprocess.run([FFMPEG,'-y','-v','error','-i',path,'-vf',f'fps=1/1,scale=480:-1',
                    '-frames:v', str(n*3), os.path.join(outdir,'s_%03d.png')], timeout=600)
    files = sorted(glob.glob(os.path.join(outdir,'s_*.png')))
    if not files: return []
    step = max(1, len(files)//n)
    return files[::step][:n]

def frame_metrics(png):
    from PIL import Image
    im = np.array(Image.open(png).convert('RGB')).astype(float)
    h, w, _ = im.shape
    lum = im.mean(axis=2)
    dark_ratio = (lum < 60).mean()                     # 深色背景占比
    bands = {'top': lum[:h//5], 'mid': lum[2*h//5:3*h//5], 'sub': lum[int(h*0.82):]}
    band_means = {k: v.mean() for k, v in bands.items()}
    # 底部字幕带: 亮像素行的存在（480 宽下字幕仍约 11px，阈值放宽到 140）
    sub_rows = (lum[int(h*0.80):] > 140).sum(axis=1)
    has_subtitle_band = (sub_rows > w*0.05).any()
    return dark_ratio, band_means, has_subtitle_band, lum

def ocr_subtitle(png_full):
    """对原尺寸帧的底部区域 OCR（需 chi_sim）"""
    try:
        r = subprocess.run(['tesseract', png_full, 'stdout', '-l', 'chi_sim+eng', '--psm', '6'],
                           capture_output=True, text=True, timeout=60)
        return r.stdout.strip()
    except Exception:
        return ''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('--sample', type=int, default=16)
    ap.add_argument('--report', default=None, help='QA 报告 JSON 路径；成片位于 dist/ 时默认写入同级 qa/')
    args = ap.parse_args()

    if not FFMPEG:
        sys.exit('未找到 ffmpeg。请安装系统 ffmpeg，或执行 pip install imageio-ffmpeg。')

    report = {
        'video': os.path.abspath(args.video),
        'checkedAt': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
        'spec': {},
        'visual': {},
        'subtitle': {},
        'audio': {},
        'issues': [],
        'passed': False,
    }
    issues = []
    info = probe_info(args.video)
    if not info['width'] or not info['height']:
        sys.exit('无视频流')
    dur = info['duration']
    w, h = info['width'], info['height']
    fps = info['fps'] or 'unknown'
    has_audio = info['hasAudio']

    report['spec'] = {'width': w, 'height': h, 'fps': fps, 'duration': dur, 'hasAudio': has_audio}
    print(f"规格: {w}x{h} @ {fps}fps  时长 {dur:.1f}s  音轨 {'有' if has_audio else '无!'}")
    if (w,h) != (1920,1080): issues.append(f"[规格] 画幅 {w}x{h} 非 1920x1080")
    if not (150 <= dur <= 170): issues.append(f"[规格] 时长 {dur:.0f}s 超出 2:30-2:50 区间")
    if not has_audio: issues.append("[音频] 没有音轨！BGM 缺失")

    # 抽帧分析
    with tempfile.TemporaryDirectory() as td:
        # 小尺寸连续采样（用于变化率）
        subprocess.run([FFMPEG,'-y','-v','error','-i',args.video,'-vf','fps=1/2,scale=480:-1',
                        os.path.join(td,'c_%04d.png')], timeout=900)
        seq = sorted(glob.glob(os.path.join(td,'c_*.png')))
        # 静帧原尺寸（字幕 OCR）
        sample_step = max(1, int(dur))
        subprocess.run([FFMPEG,'-y','-v','error','-i',args.video,'-vf',
                        f"select='not(mod(n\\,{sample_step}))',scale=1920:-1",
                        os.path.join(td,'f_%04d.png')], timeout=900)
        fulls = sorted(glob.glob(os.path.join(td,'f_*.png')))

        metrics = []
        prev_lum = None
        changes = []
        for png in seq:
            dark, bands, has_sub, lum = frame_metrics(png)
            metrics.append((dark, bands, has_sub))
            if prev_lum is not None:
                # 相邻样本帧差异（2 秒间隔）
                d = np.abs(lum - prev_lum).mean()
                changes.append(d)
            prev_lum = lum

        if metrics:
            dark_ratios = [m[0] for m in metrics]
            sub_presence = [m[2] for m in metrics]
            avg_dark = float(np.mean(dark_ratios))
            sub_rate = float(np.mean(sub_presence))
        else:
            avg_dark = 0.0
            sub_rate = 0.0
            issues.append("[画面] 无法抽取分析帧")

        change_mean = float(np.mean(changes)) if changes else 0.0
        report['visual'] = {
            'darkRatio': avg_dark,
            'subtitleBandRate': sub_rate,
            'changeMean': change_mean,
            'samples': len(metrics),
        }
        print(f"画面: 深色占比均值 {avg_dark:.0%} | 字幕带出现率 {sub_rate:.0%} | 2秒间隔变化率均值 {change_mean:.1f}")

        if metrics:
            if avg_dark < 0.5: issues.append(f"[画面] 深色背景占比仅 {avg_dark:.0%}，偏离深蓝黑风格")
            if sub_rate < 0.5: issues.append(f"[字幕] 仅 {sub_rate:.0%} 抽帧检测到底部字幕带——旁白字幕可能缺失或过小")
        if changes and change_mean < 3:
            issues.append("[节奏] 相邻 2 秒帧差异过低——存在长时间静止画面（规范: 每 2-4 秒必须有新元素）")

        # 底部字幕 OCR 抽查（tesseract 为可选依赖，缺失时跳过而非误报）
        got = []
        if fulls and shutil.which('tesseract'):
            try:
                texts = [ocr_subtitle(f) for f in fulls[:3]]
                got = [t for t in texts if len(t) >= 4]
                report['subtitle'] = {
                    'ocrChecked': min(3, len(fulls)),
                    'ocrRead': len(got),
                    'ocrSample': got[0][:200] if got else '',
                }
                print(f"字幕OCR抽查: {len(got)}/{min(3,len(fulls))} 帧读到文字" + (f" 例: {got[0][:40] if got else ''}" ))
                if not got and sub_rate > 0.5:
                    issues.append("[字幕] 底部有亮带但 OCR 读不出字——字号可能过小（手机端不可读）")
            except Exception:
                pass
        elif fulls:
            report['subtitle'] = {'ocrChecked': 0, 'ocrRead': 0, 'skipped': True,
                                  'reason': 'tesseract 未安装，OCR 项跳过'}
            print("字幕OCR抽查: 跳过（未安装 tesseract；底部字幕带检测仍有效）")

        # 静止段检测
        if changes:
            still = [i*2 for i, d in enumerate(changes) if d < 1.0]
            if len(still) > len(changes)*0.3:
                issues.append(f"[节奏] 静止段过多: {still[:8]}...（时间点/秒）")

    # 音频检查
    if has_audio:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf:
            wav = tf.name
        subprocess.run([FFMPEG,'-y','-v','error','-i',args.video,'-vn','-ar','44100','-ac','1','-f','f32le',wav],
                       timeout=600)
        raw = np.fromfile(wav, dtype=np.float32)
        os.unlink(wav)
        peak = float(np.abs(raw).max())
        rms = float(np.sqrt((raw**2).mean()))
        clip = float((np.abs(raw) > 0.995).mean())
        report['audio'] = {'peak': peak, 'rms': rms, 'clipRatio': clip}
        print(f"音频: 峰值 {peak:.3f} RMS {rms:.3f} 削波占比 {clip:.2%}")
        if peak > 0.999: issues.append("[音频] 存在削波（爆音）——降低合成音量或加软限幅")
        if rms < 0.02: issues.append("[音频] BGM 过轻，几乎听不见")

    report['issues'] = issues
    report['passed'] = not issues

    report_path = args.report
    if not report_path:
        video_dir = os.path.dirname(os.path.abspath(args.video))
        if os.path.basename(video_dir) == 'dist':
            episode_dir = os.path.dirname(video_dir)
            report_path = os.path.join(
                episode_dir, 'qa',
                os.path.splitext(os.path.basename(args.video))[0] + '.json',
            )
    if report_path:
        report_path = os.path.abspath(report_path)
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f"QA 报告: {report_path}")
    else:
        print("提示: 未写 QA 报告；可用 --report <路径> 指定落盘位置。")

    print()
    if issues:
        print("="*56)
        print("最严重问题（按顺序修复后重新渲染）:")
        for i, msg in enumerate(issues[:8], 1):
            print(f"  {i}. {msg}")
        print("="*56)
        print("六维评分建议: 逐项人工复核下方维度后打分（目标全部 ≥ 8）")
    else:
        print("自动检查全部通过。请人工复核六维评分（前2秒抓人/缩放可读/动作自然/画面新鲜度/构图/声画对位）")

if __name__ == '__main__':
    main()
