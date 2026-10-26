import asyncio
import os
import subprocess
import numpy as np
import edge_tts
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
EPISODE_DIR = r"C:\Users\Administrator\Desktop\项目\ai-video-studio\episodes\mentor_cake"
ASSETS_DIR = os.path.join(EPISODE_DIR, "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

# 1. Voice script with timestamps (start, end, speaker, text)
VOICE_SCRIPT = [
    # 开场 (0.0 - 13.5s)
    (0.8, "student", "好的老师，收到！"),
    (2.8, "narrator", "在整个研究生与职场生涯中，这句话你可能不自觉地说过上千次。"),
    (7.5, "narrator", "从行为心理学来看，秒回好的并不是敬业，而是大脑杏仁核面对权力级差时的服从防御反射。"),
    (11.2, "narrator", "因为在这四个字背后，往往紧接着一个经典的博弈陷阱——导师的远期画饼。"),
    
    # 标题卡 (13.5 - 19.5s) 静音给标题卡音乐留白

    # 第一幕：四大画饼 (19.5 - 47.0s)
    (20.0, "mentor", "小李啊，手头这个国家级重大项目我挂你的名字，好好做！"),
    (23.5, "narrator", "实际学术期权折算：排在第八作者，附赠报销票据整理工时四百小时。"),
    
    (27.0, "mentor", "你不读博也可以，去工业界我打个招呼，起码年薪二十万以上！"),
    (31.0, "narrator", "博弈现实：这只是为了以最低边际成本，将廉价劳动力扣在实验室延毕半年。"),
    
    (34.8, "mentor", "你老家省厅院所里我认识好几个核心领导，到时候直接帮你安排。"),
    (38.8, "narrator", "心理学定式：远期无抵押的人情信用，本质是沉没成本极高的无息借贷。"),
    
    (42.5, "mentor", "下半年给你推顶尖大厂实习！下周先把这几篇材料改出来。"),
    (46.5, "narrator", "著名的下周复下周：通过不断移动时间锚点，榨取当下的即时生产力。"),
    
    # 第二幕：博弈论机制 (47.0 - 63.0s)
    (50.0, "narrator", "在经济学中，这被称为典型的委托代理人困境。导师的承诺成本几乎为零，而你的代价是沉没青春。"),
    (57.0, "narrator", "心理学双曲折现让你为了渺茫的虚幻未来，主动放弃当下的理性止损权。"),
    
    # 第三幕与终局 (63.0 - 80.0s)
    (64.5, "narrator", "破解画饼的唯一法则，是建立理性的贝叶斯止损边界：只看兑现的增量，不信口头的期权。"),
    (72.0, "narrator", "所有无需抵押的远期前途，本质上都是在向你的年轻无息借贷。真正的尊重，始于对沉没成本的清醒止损。")
]

VOICE_MAP = {
    "mentor": "zh-CN-YunjianNeural",      # 稳重长者/导师画饼腔
    "student": "zh-CN-YunyangNeural",     # 年轻学生/唯唯诺诺腔
    "narrator": "zh-CN-YunxiNeural"       # 冷静敏锐的学术旁白腔
}

async def generate_speech_clips():
    temp_voice_dir = os.path.join(ASSETS_DIR, "temp_voices")
    os.makedirs(temp_voice_dir, exist_ok=True)
    clips = []
    
    for idx, (st, speaker, text) in enumerate(VOICE_SCRIPT):
        voice = VOICE_MAP[speaker]
        out_path = os.path.join(temp_voice_dir, f"v_{idx:02d}_{speaker}.mp3")
        rate = "+0%" if speaker != "student" else "+10%"
        pitch = "-5Hz" if speaker == "mentor" else "+0Hz"
        
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(out_path)
        clips.append((st, out_path))
        print(f"Generated [{speaker}]: {text}")
    
    return clips

def build_custom_ambient_bgm(duration=80.0, output_wav=None):
    """
    合成一段绝非 MidnightRush 的深邃、沉静、心理悬疑电影级 Ambient BGM
    低音大提琴/合成器长音 (Drone Pad) + 缓慢心跳 Kick + 迷离的 Rhodes 单音
    """
    n_samples = int(duration * SR)
    t = np.arange(n_samples) / SR
    audio = np.zeros(n_samples, dtype=np.float32)
    
    # 1. 深度暗调小调和弦低音 Pad (Cm - Ab - Fm - G)
    chord_times = [0, 20, 40, 60, 80]
    chord_freqs = [
        [65.41, 130.81, 155.56, 196.00],  # C2, C3, Eb3, G3
        [51.91, 103.83, 130.81, 155.56],  # Ab1, Ab2, C3, Eb3
        [43.65, 87.31, 103.83, 130.81],   # F1, F2, Ab2, C3
        [48.99, 97.99, 123.47, 146.83],   # G1, G2, B2, D3
    ]
    
    pad_audio = np.zeros(n_samples, dtype=np.float32)
    for i in range(len(chord_freqs)):
        c_start = chord_times[i]
        c_end = chord_times[i+1]
        mask = (t >= c_start) & (t < c_end)
        idx_range = np.where(mask)[0]
        if len(idx_range) == 0:
            continue
        local_t = t[idx_range] - c_start
        dur = c_end - c_start
        
        fade_len = int(1.5 * SR)
        env = np.ones(len(idx_range))
        if len(idx_range) > 2 * fade_len:
            env[:fade_len] = np.linspace(0, 1, fade_len)
            env[-fade_len:] = np.linspace(1, 0, fade_len)
            
        chord_wave = np.zeros(len(idx_range), dtype=np.float32)
        for f in chord_freqs[i]:
            # 微失谐产生厚重合唱空间感
            chord_wave += 0.25 * np.sin(2 * np.pi * f * local_t)
            chord_wave += 0.15 * np.sin(2 * np.pi * (f * 1.003) * local_t)
            chord_wave += 0.08 * np.sin(2 * np.pi * (f * 0.997) * local_t)
            chord_wave += 0.05 * np.sin(2 * np.pi * (f * 2) * local_t)
        
        pad_audio[idx_range] += (chord_wave * env * 0.25).astype(np.float32)

    # 2. 规律而低沉的心跳 Sub-Kick (模拟博弈压迫感，每 1.2 秒一次)
    kick_audio = np.zeros(n_samples, dtype=np.float32)
    interval = 1.2
    for beat_t in np.arange(2.0, duration - 3.0, interval):
        k_idx = int(beat_t * SR)
        k_len = int(0.25 * SR)
        if k_idx + k_len < n_samples:
            kt = np.arange(k_len) / SR
            f_drop = 90.0 * np.exp(-kt * 22) + 38.0
            k_wave = 0.22 * np.sin(2 * np.pi * np.cumsum(f_drop) / SR) * np.exp(-kt * 14)
            kick_audio[k_idx:k_idx+k_len] += k_wave.astype(np.float32)
            
    # 3. 晶体般的微弱迷离钟音 (每隔数秒的一记点缀)
    bell_audio = np.zeros(n_samples, dtype=np.float32)
    bell_cues = [14.0, 20.0, 27.0, 35.0, 43.0, 50.0, 64.0, 72.0]
    for b_t in bell_cues:
        b_idx = int(b_t * SR)
        b_len = int(2.5 * SR)
        if b_idx + b_len < n_samples:
            bt = np.arange(b_len) / SR
            b_wave = (0.12 * np.sin(2 * np.pi * 587.33 * bt) +
                      0.08 * np.sin(2 * np.pi * 880.00 * bt) +
                      0.04 * np.sin(2 * np.pi * 1174.66 * bt)) * np.exp(-bt * 2.2)
            bell_audio[b_idx:b_idx+b_len] += b_wave.astype(np.float32)

    audio = pad_audio + kick_audio + bell_audio
    
    # 结尾 3.0s 淡出
    fade_samples = int(3.0 * SR)
    audio[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    
    # 峰值防爆音归一化
    max_val = np.max(np.abs(audio))
    if max_val > 0.01:
        audio = audio / max_val * 0.45
        
    out_wav = output_wav or os.path.join(ASSETS_DIR, "ambient_bgm.wav")
    import wave
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        raw_int16 = (audio * 32767).astype(np.int16).tobytes()
        wf.writeframes(raw_int16)
        
    print(f"Generated Custom Ambient BGM: {out_wav}")
    return out_wav

def mix_full_soundtrack(clips, bgm_wav, duration=80.0):
    """
    将生成的各角色语音按时间戳叠入，并与定制 Ambient BGM 混缩，
    输出成 master_soundtrack.wav 与纯人声 voice_track.wav
    """
    voice_canvas = np.zeros(int(duration * SR), dtype=np.float32)
    
    import wave
    for st, mp3_path in clips:
        # 转为临时 wav
        tmp_wav = mp3_path.replace(".mp3", ".wav")
        cmd = [FFMPEG, "-y", "-i", mp3_path, "-ar", str(SR), "-ac", "1", tmp_wav]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        with wave.open(tmp_wav, "rb") as wf:
            frames = wf.readframes(wf.getnframes())
            data = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            
        start_idx = int(st * SR)
        end_idx = min(len(voice_canvas), start_idx + len(data))
        fit_len = end_idx - start_idx
        if fit_len > 0:
            voice_canvas[start_idx:end_idx] += data[:fit_len]
            
    # 写出纯人声轨
    voice_wav = os.path.join(ASSETS_DIR, "voice_track.wav")
    with wave.open(voice_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((np.clip(voice_canvas, -1.0, 1.0) * 32767).astype(np.int16).tobytes())
        
    # 读取伴奏并混音
    with wave.open(bgm_wav, "rb") as wf:
        frames = wf.readframes(wf.getnframes())
        bgm_data = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
        
    bgm_len = min(len(voice_canvas), len(bgm_data))
    # 人声突出 (0.95)，背景声衬底 (0.35)
    mixed = np.zeros(len(voice_canvas), dtype=np.float32)
    mixed[:bgm_len] += bgm_data[:bgm_len] * 0.35
    mixed += voice_canvas * 0.95
    
    # 结尾淡出
    fade_len = int(2.5 * SR)
    mixed[-fade_len:] *= np.linspace(1, 0, fade_len)
    
    mixed_wav = os.path.join(ASSETS_DIR, "master_soundtrack.wav")
    with wave.open(mixed_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((np.clip(mixed, -1.0, 1.0) * 32767).astype(np.int16).tobytes())
        
    print(f"Master soundtrack generated: {mixed_wav}")
    return mixed_wav

async def main():
    print("Step 1: Generating custom multi-speaker speech clips...")
    clips = await generate_speech_clips()
    print("Step 2: Synthesizing non-MidnightRush ambient soundtrack...")
    bgm_wav = build_custom_ambient_bgm(80.0)
    print("Step 3: Mixing vocal track and ambient background...")
    mix_full_soundtrack(clips, bgm_wav, 80.0)
    print("All audio assets ready!")

if __name__ == "__main__":
    asyncio.run(main())
