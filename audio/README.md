# 《奶茶挤挤》经典轻量版音频 · 渲染交付包

制作依据：`assets/audio/production-requirements.md`（2026-11-01）；对接项目：`vinkinyyx/milktea`。

## 交付内容（运行资产恰好9个）

| cue | 内容 | 运行格式 | 声音行为 |
| --- | --- | --- | --- |
| bgm_classic | 《杯里的一小会儿》 | MP3 44.1kHz 立体声 96kbps | 84 BPM / 4/4 / 24小节 / 循环 |
| ui_tap | 柔和按钮反馈 | PCM16 WAV 单声道 | 有效点击 |
| drop | 小料成功投放 | PCM16 WAV 单声道 | 成功投放 |
| collision_soft | 小料软碰撞 | PCM16 WAV 单声道 | 合格新接触 |
| merge_small | 2～4级小合成 | PCM16 WAV 单声道 | 小合成 |
| merge_large | 5～9级合成 | PCM16 WAV 单声道 | 大合成 |
| shake_start | 柔和晃杯 | PCM16 WAV 单声道 | 只播一次 |
| danger_tick | 克制危险提醒 | PCM16 WAV 单声道 | 节流播放 |
| result | G4/E4/C4柔和结束 | PCM16 WAV 单声道 | 结果收束 |

`assets/audio/runtime/` 内仅有上述9个文件，总计 **1,004,216 字节**（1.004 MB），其中 BGM **823,484 字节**，其余八个 SFX **180,732 字节**。全部低于 1,200,000 字节预算。

`assets/audio/masters/` 对应 9 个 **48 kHz / 24-bit PCM WAV** 无损母版。BGM 立体声，SFX 单声道。

## 原 MIDI / 可编辑设计

- `assets/audio/design/bgm_classic.mid`：从 GitHub 仓库提取并按 Git blob SHA 核验的**原 MIDI**。
- `assets/audio/design/bgm_classic.transcribed-notes.json`：从上述 MIDI 生成的**音符转录**，仅供音序核验和移植。
- 原仓库 `assets/audio/design/bgm_classic.music.json` **未修改**，不在包内另造“原件”。合并到现有仓库时保留原文件即可。
- `tools/render_audio.py`：完整可重复渲染/编配脚本，包含合成器、声音设计参数、响度处理与各 cue 音量。
- `tools/qa_audio.py`：对9个运行文件的解码、时长、规格、响度、静音、峰值、循环边界和预算进行批量检查，输出唯一 `assets/audio-manifest.csv` 与 QA JSON。
- `assets/audio/licenses/PROVENANCE.md`：曲谱和合成来源、无第三方采样说明、制作工具信息与授权待核项。

## Cocos / Codex 的接线原则

1. 将本包 `assets/audio/` 合入现有仓库 `assets/audio/`，**保留仓库中现有 `.music.json`**，本包只增加真实 `runtime/`、`masters/`、`licenses/` 和 QA 内容。
2. 将 `assets/audio/runtime/` 中的 9 个音频素材通过 Cocos Creator 导入项目的 **classic 音频 bundle**，不在 `resources` 和其他 bundle 放重复音频副本。
3. 运行时始终保持 **1首BGM+最多3个并发SFX**，优先级5>4>3>2>1。SFX默认音量70%，BGM默认35%，独立静音/持久化。
4. `drop` 只在成功投放后触发，碰撞按每秒最多6次及同 body 120ms 节流；`merge_large` 复用9级、`result`复用新纪录、`collision_soft`复用珍珠碰撞。
5. BGM 在有效手势开始或显式继续时播放；暂停/隐藏/弹窗不得自动重播音效；重开不得叠加 BGM，不改变掉落随机数状态。
6. 在 Cocos 真机播放器**实际循环至少两次**、耳机和手机外放、以及1BGM+3SFX压力场景听测后，再把 `audio-manifest.csv` 的9项由 `rendered` 更新成 `accepted`（前提还包括项目方权利确认）；游戏接入另行验收。

## 技术验证与剩余工作

- 技术报告：`assets/audio/qa/technical-report.json`；详见 `assets/audio/qa/验收记录.md`。
- `assets/audio/qa/试听样片.mp3` 是非运行资产，供用户听辨各 cue 与背景音乐的搭配；它不是正式游戏听测替代。
- 已按原 MIDI 渲染，不是 GM 默认 MIDI 回放。全部采用原创程序合成（非采样乐器/真人录制），音色是否满足最终审美需以用户实听为准。
- 当前未执行：真人耳机听测、手机外放听测、Cocos 引擎内循环与后台行为验收、权利负责人签核；不得将“数值检测通过”冒充“全部正式验收完成”。

## 本地再生（示例）

需要 Python 环境与 `ffmpeg`、`ffprobe`。Python 依赖：`numpy scipy soundfile mido pyloudnorm`。

```bash
python tools/render_audio.py
python tools/qa_audio.py
```

两条命令可从本包的 MIDI 重新生成当前运行音频及技术台账；外部下载采样库不是必要步骤。
