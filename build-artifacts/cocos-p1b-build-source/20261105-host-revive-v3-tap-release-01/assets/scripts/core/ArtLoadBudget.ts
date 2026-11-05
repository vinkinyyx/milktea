export type ArtLoadBudgetState = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SETTLED';

/** Shared foreground-time budget for one startup art batch. Background time never counts toward the deadline. */
export class ArtLoadBudget {
  private usedMs = 0;
  private state: ArtLoadBudgetState = 'ACTIVE';
  private cancelHandles: Array<(error: Error) => void> = [];

  constructor(readonly ownerEpoch: number, readonly traceId: number, readonly budgetMs = 15_000, initialForegroundMs = 0) {
    this.usedMs = Math.max(0, initialForegroundMs);
    if (this.usedMs >= this.budgetMs) this.state = 'EXPIRED';
  }

  get foregroundMs(): number { return Math.round(this.usedMs); }
  get remainingMs(): number { return Math.max(0, this.budgetMs - this.usedMs); }
  get expired(): boolean { return this.state === 'EXPIRED'; }
  get active(): boolean { return this.state === 'ACTIVE'; }
  get status(): ArtLoadBudgetState { return this.state; }

  /** Advance only while the host is in the foreground. Returns true when this call exhausted the budget. */
  advance(deltaMs: number, foreground: boolean): boolean {
    if (this.state !== 'ACTIVE' || !foreground || !Number.isFinite(deltaMs) || deltaMs <= 0) return false;
    this.usedMs += deltaMs;
    if (this.usedMs < this.budgetMs) return false;
    this.state = 'EXPIRED';
    this.rejectAll('START_ART_TIMEOUT');
    return true;
  }

  cancel(code = 'START_ART_CANCELLED'): void {
    if (this.state !== 'ACTIVE') return;
    this.state = 'CANCELLED';
    this.rejectAll(code);
  }

  settle(): void {
    if (this.state !== 'ACTIVE') return;
    this.state = 'SETTLED';
    this.resolvePending();
  }

  assertActive(): void {
    if (this.state === 'EXPIRED') throw makeBudgetError('START_ART_TIMEOUT');
    if (this.state === 'CANCELLED') throw makeBudgetError('START_ART_CANCELLED');
  }

  /** Rejects when this budget expires or is cancelled, so a never-calling engine callback cannot hang the wait. */
  cancelled(): Promise<never> {
    if (this.state === 'EXPIRED') return Promise.reject(makeBudgetError('START_ART_TIMEOUT'));
    if (this.state === 'CANCELLED') return Promise.reject(makeBudgetError('START_ART_CANCELLED'));
    if (this.state === 'SETTLED') return new Promise<never>(() => undefined);
    return new Promise<never>((_, reject) => { this.cancelHandles.push(reject); });
  }

  private rejectAll(code: string): void {
    const handles = this.cancelHandles; this.cancelHandles = [];
    for (const reject of handles) { try { reject(makeBudgetError(code)); } catch { /* listener teardown */ } }
  }
  private resolvePending(): void { this.cancelHandles = []; }
}

export function makeBudgetError(code: string): Error {
  const error = new Error(code);
  error.name = 'ArtLoadBudgetError';
  return error;
}
