#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""语义音效生成器：读取 cue 表，合成 44.1kHz 立体声 WAV。

cue 表时间写法:
  {"t": 14.35}                         绝对秒
  {"bar": 8, "beat": 0.6, "offset": 0} 小节 + 拍 + 偏移（对齐共享 BGM 网格）
  "align": "end"                        以时间点为声音结束点（反向 whoosh 用）

每种 type 对应一种语义动作，不按拍子机械铺满；BGM 源文件不参与处理。
"""

import argparse
import json
import os
import wave

import numpy as np

SR = 44100
DEFAULT_BPM = 112.90
DEFAULT_BAR0 = 0.228
DEFAULT_MASTER_PEAK_DB = -6.0


# ---------- 基础 DSP ----------

def _dur_samples(dur):
    return max(1, int(round(dur * SR)))


def _norm(x):
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    return x / peak if peak > 0 else x


def _stereo(x, pan=0.0, width=0.0):
    pan = float(np.clip(pan, -1.0, 1.0))
    angle = (pan + 1.0) * np.pi / 4.0
    left = x * np.cos(angle)
    right = x * np.sin(angle)
    delay = int(SR * max(0.0, width))
    if delay:
        right = np.concatenate([np.zeros(delay), right[:-delay]])
    return np.stack([left, right], axis=1)


def _sine_sweep(t, f_start, f_end, curve=1.0):
    f = f_start + (f_end - f_start) * (t / max(float(t[-1]), 1e-6)) ** curve
    return np.sin(2.0 * np.pi * np.cumsum(f) / SR)


def _band_noise(rng, dur, lo, hi):
    n = _dur_samples(dur)
    spec = np.fft.rfft(rng.standard_normal(n))
    freq = np.fft.rfftfreq(n, 1.0 / SR)
    safe = np.maximum(freq, 1e-6)
    mask = 1.0 / (1.0 + (lo / safe) ** 4)
    mask *= 1.0 / (1.0 + (freq / hi) ** 4)
    return _norm(np.fft.irfft(spec * mask, n))


def _swept_noise(rng, dur, f0, f1, width=2.0):
    n = _dur_samples(dur)
    raw = rng.standard_normal(n)
    out = np.empty(n)
    high = low = 0.0
    fc = float(f0)
    ratio = (float(f1) / float(f0)) ** (1.0 / max(1, n - 1))
    for i in range(n):
        a_hi = 1.0 - np.exp(-2.0 * np.pi * min(fc * width, SR * 0.45) / SR)
        a_lo = 1.0 - np.exp(-2.0 * np.pi * max(fc / width, 20.0) / SR)
        high += a_hi * (raw[i] - high)
        low += a_lo * (raw[i] - low)
        out[i] = high - low
        fc *= ratio
    return _norm(out)


def _space(x, wet=0.16):
    """轻量多抽头空间感，避免逐音效卷积。"""
    out = x.copy()
    for delay_s, gain in ((0.037, 0.5), (0.061, 0.34), (0.097, 0.22), (0.149, 0.14)):
        delay = int(delay_s * SR)
        if delay < len(x):
            out[delay:] += x[:-delay] * gain * wet
    return out


def _click_burst(rng, dur, lo, hi, decay):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    return _band_noise(rng, dur, lo, hi) * np.exp(-t / decay)


# ---------- 语义音色 ----------

def synth_page_turn(rng, dur=0.46, pan=-0.12, params=None):
    params = params or {}
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    body = _swept_noise(rng, dur, params.get("f0", 1600), params.get("f1", 6400), width=1.7)
    env = np.exp(-((t - 0.055) / 0.065) ** 2) + 0.55 * np.exp(-((t - 0.21) / 0.085) ** 2)
    paper = body * env
    thump = np.sin(2.0 * np.pi * 170.0 * t) * np.exp(-t / 0.045) * 0.12
    return _stereo(_norm(paper + thump), pan, width=0.003)


def synth_book_close(rng, dur=0.58, pan=0.0, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    thump = _sine_sweep(t, 118.0, 46.0, curve=0.5) * np.exp(-t / 0.11)
    slap = _click_burst(rng, dur, 700.0, 5200.0, 0.045) * 0.75
    return _stereo(_norm(_space(thump + slap, 0.12)), pan, width=0.004)


def synth_whoosh(rng, dur=0.5, pan=0.18, params=None):
    n = _dur_samples(dur)
    x = _swept_noise(rng, dur, params.get("f0", 520), params.get("f1", 4600), width=2.4)
    x *= np.sin(np.linspace(0.0, np.pi, n)) ** 2
    return _stereo(_norm(x), pan, width=0.004)


def synth_reverse_whoosh(rng, dur=0.6, pan=-0.2, params=None):
    n = _dur_samples(dur)
    x = _swept_noise(rng, dur, params.get("f0", 3800), params.get("f1", 520), width=2.2)
    ramp = np.linspace(0.0, 1.0, n) ** 2.4
    x *= ramp
    x[-int(SR * 0.012):] *= np.linspace(1.0, 0.0, int(SR * 0.012))
    return _stereo(_norm(x), pan, width=0.003)


def synth_stamp(rng, dur=0.62, pan=-0.06, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    body = _sine_sweep(t, 132.0, 62.0, curve=0.45) * np.exp(-t / 0.085)
    click = _click_burst(rng, dur, 1600.0, 6400.0, 0.018) * 0.55
    return _stereo(_norm(_space(body + click, 0.14)), pan, width=0.002)


def synth_chime(rng, dur=1.6, pan=0.16, params=None):
    freq = float(params.get("freq", 880.0))
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    partials = ((1.0, 1.0, 0.55), (2.01, 0.42, 0.34), (2.98, 0.22, 0.22), (4.17, 0.12, 0.14))
    x = np.zeros(n)
    for ratio, gain, decay in partials:
        x += gain * np.sin(2.0 * np.pi * freq * ratio * t) * np.exp(-t / decay)
    x *= 1.0 - np.exp(-t / 0.006)
    return _stereo(_norm(_space(x, 0.2)), pan, width=0.004)


def synth_descend(rng, dur=0.95, pan=0.04, params=None):
    base = float(params.get("freq", 659.25))
    notes = (1.0, 0.7937, 0.5950)
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, ratio in enumerate(notes):
        start = int((i * 0.105) * SR)
        seg_t = t[: n - start]
        tone = (np.sin(2.0 * np.pi * base * ratio * seg_t)
                + 0.24 * np.sin(4.0 * np.pi * base * ratio * seg_t))
        tone *= np.exp(-seg_t / 0.16) * (1.0 - np.exp(-seg_t / 0.004)) * (0.95 ** i)
        x[start:] += tone
    return _stereo(_norm(_space(x, 0.14)), pan, width=0.003)


def synth_grow(rng, dur=2.4, pan=0.0, params=None):
    base = float(params.get("freq", 82.5))
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for ratio, gain in ((1.0, 1.0), (1.5, 0.45), (2.0, 0.22)):
        x += gain * np.sin(2.0 * np.pi * base * ratio * t + 0.3 * ratio)
    shimmer = _swept_noise(rng, dur, 320.0, 2600.0, width=1.8) * 0.28
    env = np.minimum(t / 0.55, 1.0) * np.exp(-np.maximum(t - (dur * 0.62), 0.0) / 0.4)
    return _stereo(_norm((x + shimmer) * env), pan, width=0.006)


def synth_projector(rng, dur=1.05, pan=-0.12, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    hum = np.sin(2.0 * np.pi * 72.0 * t) * 0.18
    hum += _band_noise(rng, dur, 120.0, 900.0) * 0.12
    x = hum
    step = 1.0 / 21.0
    for k, ct in enumerate(np.arange(0.03, dur - 0.02, step)):
        idx = int(ct * SR)
        burst = _click_burst(rng, 0.018, 1800.0, 6200.0, 0.004) * (0.7 + 0.3 * np.sin(k * 1.7))
        end = min(n, idx + len(burst))
        x[idx:end] += burst[: end - idx]
    env = np.minimum(t / 0.04, 1.0) * np.minimum((dur - t) / 0.08, 1.0)
    return _stereo(_norm(x * env), pan, width=0.005)


def synth_film_roll(rng, dur=1.5, pan=0.14, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    flutter = 0.58 + 0.42 * np.sin(2.0 * np.pi * 12.5 * t + 0.7 * np.sin(2.0 * np.pi * 5.3 * t))
    x = _band_noise(rng, dur, 900.0, 5400.0) * flutter
    x *= np.sin(np.linspace(0.0, np.pi, n)) ** 0.8
    return _stereo(_norm(_space(x, 0.1)), pan, width=0.006)


def synth_engine(rng, dur=1.7, pan=0.0, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    freq = 52.0 + 7.0 * (1.0 - np.exp(-t / 0.16))
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    x = np.zeros(n)
    for k in range(1, 6):
        x += np.sin(k * phase) / k
    x += _band_noise(rng, dur, 160.0, 1400.0) * 0.18
    env = np.minimum(t / 0.25, 1.0) * np.exp(-np.maximum(t - dur * 0.58, 0.0) / 0.36)
    return _stereo(_norm(x * env), pan, width=0.004)


def synth_riser(rng, dur=2.126, pan=0.0, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    noise = _swept_noise(rng, dur, 300.0, 7200.0, width=2.6)
    tone = _sine_sweep(t, 82.0, 320.0, curve=1.4) * 0.35
    env = (t / max(float(t[-1]), 1e-6)) ** 2.3
    x = (noise + tone) * env
    fade = int(SR * 0.015)
    x[-fade:] *= np.linspace(1.0, 0.0, fade)
    return _stereo(_norm(x), pan, width=0.004)


def synth_impact(rng, dur=1.25, pan=0.0, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    sub = _sine_sweep(t, 68.0, 34.0, curve=0.55) * np.exp(-t / 0.24)
    body = _click_burst(rng, dur, 90.0, 3200.0, 0.1) * 0.6
    return _stereo(_norm(_space(sub + body, 0.18)), pan, width=0.003)


def synth_printer(rng, dur=0.62, pan=0.12, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    x = _band_noise(rng, dur, 120.0, 700.0) * 0.1
    x += np.sin(2.0 * np.pi * 118.0 * t) * 0.06
    ct = 0.035
    k = 0
    while ct < dur - 0.03:
        idx = int(ct * SR)
        burst = _click_burst(rng, 0.007, 1700.0, 4600.0, 0.0018)
        end = min(n, idx + len(burst))
        x[idx:end] += burst[: end - idx] * (0.65 + 0.35 * ((k % 3) / 2.0))
        ct += 0.021 + 0.008 * ((k * 7) % 5) / 4.0
        k += 1
    x *= np.minimum(t / 0.01, 1.0) * np.minimum((dur - t) / 0.05, 1.0)
    return _stereo(_norm(x), pan, width=0.004)


def synth_tick_run(rng, dur=0.8, pan=0.2, params=None):
    n = _dur_samples(dur)
    x = np.zeros(n)
    ct = 0.02
    interval = 0.105
    k = 0
    while ct < dur - 0.03:
        idx = int(ct * SR)
        burst = _click_burst(rng, 0.005, 2400.0, 7200.0, 0.0012)
        end = min(n, idx + len(burst))
        x[idx:end] += burst[: end - idx] * (0.6 + 0.4 * (k % 2))
        ct += interval
        interval = max(0.034, interval * 0.88)
        k += 1
    return _stereo(_norm(x), pan, width=0.003)


def synth_breath(rng, dur=1.7, pan=-0.08, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    x = _band_noise(rng, dur, 340.0, 1500.0)
    x *= np.sin(np.linspace(0.0, np.pi, n)) ** 2.2
    x += _band_noise(rng, dur, 1800.0, 5200.0) * 0.08 * np.sin(np.linspace(0.0, np.pi, n)) ** 3
    x += np.sin(2.0 * np.pi * 96.0 * t) * 0.04 * np.sin(np.linspace(0.0, np.pi, n)) ** 2
    return _stereo(_norm(_space(x, 0.12)), pan, width=0.006)


def synth_thump(rng, dur=0.42, pan=0.0, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    x = _sine_sweep(t, 88.0, 43.0, curve=0.5) * np.exp(-t / 0.1)
    x += _click_burst(rng, dur, 200.0, 2800.0, 0.02) * 0.22
    return _stereo(_norm(_space(x, 0.12)), pan, width=0.002)


def synth_click(rng, dur=0.12, pan=0.22, params=None):
    n = _dur_samples(dur)
    t = np.arange(n) / SR
    x = _click_burst(rng, dur, 2200.0, 7600.0, 0.0035)
    x += np.sin(2.0 * np.pi * 1250.0 * t) * np.exp(-t / 0.02) * 0.35
    return _stereo(_norm(x), pan, width=0.002)


SYNTHS = {
    "page_turn": synth_page_turn,
    "book_close": synth_book_close,
    "whoosh": synth_whoosh,
    "reverse_whoosh": synth_reverse_whoosh,
    "stamp": synth_stamp,
    "chime": synth_chime,
    "descend": synth_descend,
    "grow": synth_grow,
    "projector": synth_projector,
    "film_roll": synth_film_roll,
    "engine": synth_engine,
    "riser": synth_riser,
    "impact": synth_impact,
    "printer": synth_printer,
    "tick_run": synth_tick_run,
    "breath": synth_breath,
    "thump": synth_thump,
    "click": synth_click,
}


# ---------- 时间与装配 ----------

def resolve_at(at, beat_dur, bar_dur, bar0):
    if isinstance(at, (int, float)):
        return float(at)
    if isinstance(at, str):
        return float(at)
    if "t" in at:
        return float(at["t"])
    return (bar0
            + float(at.get("bar", 0)) * bar_dur
            + float(at.get("beat", 0.0)) * beat_dur
            + float(at.get("offset", 0.0)))


def build(sheet, output_path):
    duration = float(sheet.get("duration", 160.0))
    bpm = float(sheet.get("bpm", DEFAULT_BPM))
    bar0 = float(sheet.get("bar0", DEFAULT_BAR0))
    beat_dur = 60.0 / bpm
    bar_dur = beat_dur * 4.0
    master_peak_db = float(sheet.get("masterPeakDb", DEFAULT_MASTER_PEAK_DB))

    total = _dur_samples(duration)
    bus = np.zeros((total, 2), dtype=np.float64)
    rows = []

    for index, cue in enumerate(sheet.get("cues", [])):
        kind = cue.get("type")
        if kind not in SYNTHS:
            raise ValueError(f"第 {index + 1} 条 cue 的类型不存在: {kind!r}")
        params = cue.get("params") or {}
        dur = float(cue.get("dur", 0.0)) or None
        rng = np.random.default_rng(int(cue.get("seed", 20261020 + index)))
        if dur:
            audio = SYNTHS[kind](rng, dur, float(cue.get("pan", 0.0)), params)
        else:
            audio = SYNTHS[kind](rng, pan=float(cue.get("pan", 0.0)), params=params)

        start = resolve_at(cue["at"], beat_dur, bar_dur, bar0)
        if cue.get("align") == "end":
            start -= len(audio) / SR
        gain = float(cue.get("gain", -18.0))
        idx = int(round(start * SR))
        if idx >= total or idx + len(audio) <= 0:
            rows.append((start, kind, cue.get("note", ""), "越界跳过"))
            continue
        src_start = max(0, -idx)
        dst = max(0, idx)
        length = min(len(audio) - src_start, total - dst)
        bus[dst: dst + length] += audio[src_start: src_start + length] * (10.0 ** (gain / 20.0))
        rows.append((start, kind, cue.get("note", ""), f"{gain:+.1f} dB"))

    peak = float(np.max(np.abs(bus))) if bus.size else 0.0
    if peak <= 0:
        raise ValueError("cue 表没有产生任何声音")
    bus *= (10.0 ** (master_peak_db / 20.0)) / peak

    pcm = np.clip(bus, -1.0, 1.0)
    pcm = (pcm * 32767.0).astype(np.int16)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with wave.open(output_path, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(pcm.tobytes())

    print(f"SFX 总线: {len(rows)} 条 cue / {duration:.1f}s / {SR}Hz stereo / 峰值 {master_peak_db:.1f} dBFS")
    print(f"输出: {output_path}")
    print("\n时间      小节      类型            语义")
    for start, kind, note, flag in sorted(rows, key=lambda r: r[0]):
        bar_pos = (start - bar0) / bar_dur
        print(f"{start:7.3f}s  bar {bar_pos:5.2f}  {kind:<15} {note}  [{flag}]")


def main():
    parser = argparse.ArgumentParser(description="按 cue 表合成语义音效轨")
    parser.add_argument("cues", help="cue 表 JSON 路径")
    parser.add_argument("--output", default=None, help="输出 WAV；默认与 cue 表同名 .wav")
    args = parser.parse_args()

    with open(args.cues, "r", encoding="utf-8") as f:
        sheet = json.load(f)
    output = args.output or os.path.splitext(args.cues)[0] + ".wav"
    build(sheet, output)


if __name__ == "__main__":
    main()
