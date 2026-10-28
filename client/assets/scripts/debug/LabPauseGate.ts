/** Owns PhysicsLab pause causes without pausing the Cocos host game loop. */
export class LabPauseGate {
  private readonly reasons = new Set<string>();
  private _revision = 0;
  private _interruptionSerial = 0;

  get canAdvance(): boolean { return this.reasons.size === 0; }
  get revision(): number { return this._revision; }
  get interruptionSerial(): number { return this._interruptionSerial; }
  has(reason: string): boolean { return this.reasons.has(reason); }
  mask(): number {
    let mask = 0;
    if (this.reasons.has('MANUAL')) mask |= 1; if (this.reasons.has('BACKGROUND')) mask |= 2;
    if (this.reasons.has('BACKLOG')) mask |= 4; if (this.reasons.has('GALLERY')) mask |= 8;
    if (this.reasons.has('REBUILD')) mask |= 16; if (this.reasons.has('INITIALIZING')) mask |= 32;
    if (this.reasons.has('ERROR')) mask |= 64; if (this.reasons.has('RESUME_REQUIRED')) mask |= 128;
    return mask;
  }
  snapshot(): string[] { return Array.from(this.reasons).sort(); }

  hold(reason: string): number {
    if (!reason) throw new Error('Pause reason is required');
    if (!this.reasons.has(reason)) {
      this.reasons.add(reason); this._revision++;
      if (reason === 'MANUAL' || reason === 'BACKGROUND' || reason === 'BACKLOG' || reason === 'RESUME_REQUIRED') this._interruptionSerial++;
    }
    return this._revision;
  }

  release(reason: string): number {
    if (this.reasons.delete(reason)) this._revision++;
    return this._revision;
  }

  clear(...reasons: string[]): number {
    for (const reason of reasons) this.release(reason);
    return this._revision;
  }

  requestUserResume(ready: boolean, visible: boolean): { ok: boolean; reason: string | null } {
    if (!ready) return { ok: false, reason: 'INITIALIZING' };
    if (!visible || this.reasons.has('BACKGROUND')) return { ok: false, reason: 'BACKGROUND' };
    for (const reason of ['GALLERY', 'REBUILD', 'ERROR', 'INITIALIZING']) if (this.reasons.has(reason)) return { ok: false, reason };
    this.clear('MANUAL', 'BACKLOG', 'RESUME_REQUIRED', 'SAMPLE_COMPLETE');
    return { ok: true, reason: null };
  }
}
