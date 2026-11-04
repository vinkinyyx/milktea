import { AudioClip, AudioSource, Node } from 'cc';

export type GameAudioCue = 'ui_tap' | 'drop' | 'collision_soft' | 'merge_small' | 'merge_large' | 'shake_start' | 'danger_tick' | 'result';
export type GameAudioClips = Partial<Record<GameAudioCue | 'bgm_classic', AudioClip>>;

const PRIORITY: Readonly<Record<GameAudioCue, number>> = {
  collision_soft: 1, ui_tap: 2, drop: 2, shake_start: 2,
  merge_small: 3, merge_large: 3, danger_tick: 4, result: 5,
};

/** One scene-owned BGM source and three reusable SFX sources. Clips come from the licensed runtime manifest. */
export class GameAudio {
  private readonly music: AudioSource;
  private readonly voices: [AudioSource, AudioSource, AudioSource];
  private readonly voiceCues: Array<GameAudioCue | null> = [null, null, null];
  private unlocked = false;
  private disposed = false;

  private readonly clips: GameAudioClips;
  constructor(owner: Node, clips: GameAudioClips, musicGain: number, sfxGain: number) {
    this.clips = { ...clips };
    const musicNode = new Node('P1CAudioBGM'); owner.addChild(musicNode);
    this.music = musicNode.addComponent(AudioSource); this.music.clip = clips.bgm_classic ?? null; this.music.loop = true; this.music.playOnAwake = false;
    for (const clip of Object.values(clips)) clip?.addRef();
    this.voices = [0, 1, 2].map(index => {
      const node = new Node(`P1CAudioSFX-${index + 1}`); owner.addChild(node);
      const source = node.addComponent(AudioSource); source.playOnAwake = false; return source;
    }) as [AudioSource, AudioSource, AudioSource];
    this.setVolumes(musicGain, sfxGain);
  }

  addClip(cue: GameAudioCue | 'bgm_classic', clip: AudioClip): void {
    if (this.disposed || this.clips[cue]) return;
    clip.addRef(); this.clips[cue] = clip;
    if (cue === 'bgm_classic') this.music.clip = clip;
  }

  setVolumes(musicGain: number, sfxGain: number): void {
    this.music.volume = Math.max(0, Math.min(1, musicGain));
    for (const source of this.voices) source.volume = Math.max(0, Math.min(1, sfxGain));
  }

  /** Call only from a real player gesture; play() is void and this reports a request, not audible output. */
  requestMusicFromGesture(): boolean {
    if (this.disposed || !this.clips.bgm_classic) return false;
    this.unlocked = true;
    if (!this.music.playing) this.music.play();
    return true;
  }

  play(cue: GameAudioCue): boolean {
    if (this.disposed || !this.unlocked || !this.clips[cue]) return false;
    let slot = this.voices.findIndex(source => !source.playing);
    if (slot < 0) {
      slot = this.voiceCues.reduce((lowest, activeCue, index) =>
        activeCue !== null && (this.voiceCues[lowest] === null || PRIORITY[activeCue] < PRIORITY[this.voiceCues[lowest]!]) ? index : lowest, 0);
      const active = this.voiceCues[slot];
      if (active !== null && PRIORITY[active] >= PRIORITY[cue]) return false;
    }
    const source = this.voices[slot];
    source.stop(); source.clip = this.clips[cue]!; source.play(); this.voiceCues[slot] = cue;
    return true;
  }

  pauseForHidden(): void {
    this.music.pause(); for (const source of this.voices) source.stop(); this.voiceCues.fill(null);
  }

  resumeAfterUserGesture(): boolean { return this.requestMusicFromGesture(); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.music.stop(); for (const source of this.voices) source.stop();
    for (const clip of Object.values(this.clips)) clip?.decRef();
    this.voiceCues.fill(null);
  }
}
