export type NineSizeQueueStatus = 'RUNNING' | 'BLOCKED_FINAL' | 'COMPLETE' | 'CANCELLED';
export interface NineSizeCandidateRecord { batchAttempt: number; candidateIndex: number; level: number; xDu: number; accepted: boolean; reason: string }
export interface NineSizeQueueState { taskId: string; state: NineSizeQueueStatus; level: number; batchAttempt: number; records: NineSizeCandidateRecord[] }
export interface NineSizeBatchResult { batchAttempt: number; acceptedX: number | null; failureRounds: number; terminal: boolean }

/** Task-owned candidate history. One fully rejected candidate set is one failure round. */
export class NineSizeQueueLedger {
  readonly state: NineSizeQueueState;
  private readonly failedRoundsByLevel = new Map<number, number>();
  constructor(taskId: string) { this.state = { taskId, state: 'RUNNING', level: 0, batchAttempt: 0, records: [] }; }
  get canSchedule(): boolean { return this.state.state === 'RUNNING'; }

  tryCandidates(level: number, candidates: readonly number[], rejectionReason: (xDu: number) => string | null): NineSizeBatchResult {
    if (!this.canSchedule) return { batchAttempt: this.state.batchAttempt, acceptedX: null,
      failureRounds: this.failedRoundsByLevel.get(level) ?? 0, terminal: true };
    if (!Number.isInteger(level) || level < 1 || !candidates.length || candidates.some(x => !Number.isFinite(x))) throw new Error('Invalid nine-size candidate batch');
    const batchAttempt = ++this.state.batchAttempt; this.state.level = level;
    let acceptedX: number | null = null;
    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
      const xDu = candidates[candidateIndex]; const reason = rejectionReason(xDu);
      this.state.records.push({ batchAttempt, candidateIndex, level, xDu, accepted: reason === null, reason: reason ?? 'accepted' });
      if (reason === null) { acceptedX = xDu; break; }
    }
    if (acceptedX !== null) return { batchAttempt, acceptedX, failureRounds: this.failedRoundsByLevel.get(level) ?? 0, terminal: false };
    const failureRounds = (this.failedRoundsByLevel.get(level) ?? 0) + 1;
    this.failedRoundsByLevel.set(level, failureRounds);
    const terminal = failureRounds >= 120;
    if (terminal) this.state.state = 'BLOCKED_FINAL';
    return { batchAttempt, acceptedX: null, failureRounds, terminal };
  }

  complete(): void { if (this.canSchedule) this.state.state = 'COMPLETE'; }
  cancel(): boolean { if (!this.canSchedule) return false; this.state.state = 'CANCELLED'; return true; }
}
