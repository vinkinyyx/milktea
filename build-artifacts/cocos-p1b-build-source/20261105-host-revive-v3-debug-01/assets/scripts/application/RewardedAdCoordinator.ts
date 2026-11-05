/** App-wide mutual exclusion for rewarded placements: only one SDK show may be in flight per app launch. */
export class RewardedAdCoordinator {
  private static active: 'extra-shake' | 'spill-revive' | null = null;
  static claim(kind: 'extra-shake' | 'spill-revive'): boolean {
    if (this.active) return false;
    this.active = kind;
    return true;
  }
  static release(kind: 'extra-shake' | 'spill-revive'): void { if (this.active === kind) this.active = null; }
  static busy(): boolean { return this.active !== null; }
  static current(): 'extra-shake' | 'spill-revive' | null { return this.active; }
}
