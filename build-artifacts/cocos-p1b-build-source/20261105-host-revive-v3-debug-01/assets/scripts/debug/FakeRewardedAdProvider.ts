import type { IRewardedAdProvider, Result, RewardedAdCapability, RewardedAdOutcome, UUID } from '../contracts/types';

/** Debug-only outcomes. This module is deleted from Release/Tap packages by strip_p1c_release_debug.cjs. */
export type FakeRewardedMode = 'ok' | 'cancel' | 'fail' | 'unavailable';
export class FakeRewardedAdProvider implements IRewardedAdProvider {
  readonly providerName = 'debug-mock' as const;
  private shown = false;
  constructor(private readonly mode: FakeRewardedMode, private readonly policy: {policyVersion:string}) {}

  /** `?rewardedMock=ok|cancel|fail|unavailable` only exists in Debug builds. */
  static modeFromQuery(): FakeRewardedMode | null {
    try {
      const location = (globalThis as unknown as { location?: { search?: string } }).location;
      if (!location?.search) return null;
      const value = new URLSearchParams(location.search).get('rewardedMock');
      if (value === 'ok' || value === 'cancel' || value === 'fail' || value === 'unavailable') return value;
      return null;
    } catch { return null; }
  }
  capability(): RewardedAdCapability { return 'SUPPORTED'; }
  prepare(): Promise<Result<void>> {
    console.info('[debug-mock] simulated rewarded video prepare', { mode: this.mode, policy: this.policy.policyVersion });
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, data: undefined }), 120));
  }
  show(attemptId: UUID): Promise<RewardedAdOutcome> {
    console.info('[debug-mock] simulated rewarded video show', { attemptId, mode: this.mode });
    this.shown = true;
    return new Promise((resolve) => setTimeout(() => {
      if (this.mode === 'ok') resolve({ kind: 'COMPLETED', attemptId });
      else if (this.mode === 'cancel') resolve({ kind: 'CANCELLED', attemptId, errorCode: 'MOCK_CLOSED_EARLY' });
      else if (this.mode === 'unavailable') resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'MOCK_NO_FILL' });
      else resolve({ kind: 'FAILED', attemptId, errorCode: 'MOCK_FAILED' });
    }, 900));
  }
  dispose(): void { if (this.shown) console.info('[debug-mock] simulated rewarded video disposed'); }
}
