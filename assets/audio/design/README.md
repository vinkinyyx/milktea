# 经典局原创作曲草稿

2026-10-28，cue=`bgm_classic`。设计见 [音乐设计](../../../docs/21-music-design.md)。

- `bgm_classic.mid`：Standard MIDI Format 1，4个编配声部+指挥轨，84 BPM，24小节；不是WAV/MP3成品，不含音源。
- `bgm_classic.music.json`：原创音符、拍位、时值、力度与状态交接；可交给制作人继续编曲。
- `validation.json`：符号结构校验与哈希，听测=false、渲染=false、运行接入=false。

复现：仓库根运行`python tools/build_music_sketch.py`。先导入DAW听乐句，再选择有商用许可音源制作；最终听感/循环/响度/手机外放需要实际验证。MIDI播放器的默认音色不能代表最终成品。

原创音符由本项目本轮设计生成，未使用上游演示曲的旋律或第三方音频采样；生成器参考上游MIT许可的通用MIDI写入方法，许可原文保存在本次tooling证据目录。后续音源许可单独登记。此目录不在client/assets内，不会自动进入游戏包；正式audio-manifest仍保留planned状态直至交付成品。
