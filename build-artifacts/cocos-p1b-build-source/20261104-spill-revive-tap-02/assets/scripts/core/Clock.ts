export interface ClockResult { steps: number; pausedForBacklog: false; tick: number; droppedSeconds: number; overloaded: boolean }

/** The sole logical/physics tick owner. Call from one render update only. */
export class FixedClock {
  readonly stepSeconds: number;
  private accumulator = 0;
  private _tick = 0;
  private _paused = false;
  constructor(readonly hz: number, private readonly maxCatchupSteps: number, private readonly onStep: () => boolean | void) {
    if (!Number.isFinite(hz) || hz <= 0 || !Number.isInteger(maxCatchupSteps) || maxCatchupSteps < 1) throw new Error('Clock configuration invalid');
    this.stepSeconds = 1 / hz;
  }
  get tick(): number { return this._tick; }
  get paused(): boolean { return this._paused; }
  pause(): void { this._paused = true; this.accumulator = 0; }
  resume(): void { this._paused = false; this.accumulator = 0; }
  reset(): void { this.accumulator = 0; this._tick = 0; }
  update(renderDeltaSeconds: number): ClockResult {
    if (this._paused) return { steps: 0, pausedForBacklog: false, tick: this._tick, droppedSeconds: 0, overloaded: false };
    if (!Number.isFinite(renderDeltaSeconds) || renderDeltaSeconds < 0) throw new Error('render delta must be finite and non-negative');
    this.accumulator += renderDeltaSeconds;
    let steps = 0;
    let failed = false;
    while (this.accumulator + 1e-12 >= this.stepSeconds && steps < this.maxCatchupSteps) {
      const committed=this.onStep();
      this.accumulator -= this.stepSeconds;
      if(committed===false){this.pause();failed=true;break;}
      this._tick++; steps++;
      if (this._paused) break;
    }
    if (failed || this._paused) return { steps, pausedForBacklog: false, tick: this._tick, droppedSeconds: 0, overloaded: false };
    const overloaded = this.accumulator + 1e-12 >= this.stepSeconds;
    let droppedSeconds = 0;
    if (overloaded) {
      const wholeSteps = Math.floor((this.accumulator + 1e-12) / this.stepSeconds);
      droppedSeconds = wholeSteps * this.stepSeconds;
      this.accumulator -= droppedSeconds;
      if (this.accumulator < 0 && this.accumulator > -1e-10) this.accumulator = 0;
    }
    return { steps, pausedForBacklog: false, tick: this._tick, droppedSeconds, overloaded };
  }
}
