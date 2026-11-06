import type { IRewardedAdProvider, Result, RewardedAdCapability, RewardedAdOutcome, UUID } from '../contracts/types';

type TapAdInstance = {
  onLoad?(callback: () => void): void; offLoad?(callback: () => void): void;
  onError?(callback: (error: unknown) => void): void; offError?(callback: (error: unknown) => void): void;
  onClose?(callback: (result?: { isEnded?: boolean }) => void): void; offClose?(callback: (result?: { isEnded?: boolean }) => void): void;
  load?(): Promise<unknown>; show?(): Promise<unknown>; destroy?(): void;
};
type TapGlobal = { createRewardedVideoAd?: (options: { adUnitId: string; multiton: true }) => TapAdInstance };
type ListenerKind = 'load' | 'error' | 'close';
type InstanceState = {
  generation: number; instance: TapAdInstance; loaded: boolean; preparing: Promise<Result<void>> | null;
  pending: { attemptId: UUID; resolve: (outcome: RewardedAdOutcome) => void } | null;
  loadFinish: ((ok: boolean, code?: string) => void) | null; loadTimer: ReturnType<typeof setTimeout> | null;
  /** Set on the first close/finish/dispose. Late native callbacks from this instance are ignored forever. */
  closed: boolean;
  /** Per-instance release runs once; destroy is attempted at most once. */
  released: boolean; destroyed: boolean;
  registered: ListenerKind[];
  onLoad: () => void; onError: (error: unknown) => void; onClose: (result?: { isEnded?: boolean }) => void;
};
const tapApi = (): TapGlobal | undefined => (globalThis as unknown as { tap?: TapGlobal }).tap;

/** Attempt-scoped Tap mini-game adapter. SDK listeners are owned and removed per multiton instance. */
export class TapRewardedAdProvider implements IRewardedAdProvider {
  readonly providerName = 'tap' as const;
  private active: InstanceState | null = null;
  private generation = 0;
  private disposed = false;
  constructor(private readonly policy: { enabled: boolean; adUnitId: string | null }) { }
  capability(): RewardedAdCapability {
    if (!this.policy.enabled) return 'DISABLED'; if (!this.policy.adUnitId) return 'UNCONFIGURED';
    return typeof tapApi()?.createRewardedVideoAd === 'function' ? 'SUPPORTED' : 'UNSUPPORTED';
  }
  async prepare(): Promise<Result<void>> {
    if (this.disposed) return this.fail('REWARD_AD_DISPOSED');
    const state = this.getInstance(); if (!state) return this.fail('REWARD_AD_UNSUPPORTED');
    if (state.loaded) return { ok: true, data: undefined }; if (state.preparing) return state.preparing;
    if (typeof state.instance.load !== 'function') { this.release(state); return this.fail('REWARD_AD_LOAD_UNSUPPORTED'); }
    state.preparing = new Promise<Result<void>>(resolve => {
      let done = false;
      const finish = (ok: boolean, code = 'REWARD_AD_LOAD_FAILED') => {
        if (done || state.closed) return; done = true; this.clearLoadTimer(state);
        state.preparing = null; state.loaded = ok; state.loadFinish = null;
        resolve(ok ? { ok: true, data: undefined } : this.fail(code));
        if (!ok) { this.release(state); if (this.active === state) this.active = null; }
      };
      state.loadFinish = (ok, code) => finish(ok, code);
      state.loadTimer = setTimeout(() => finish(false, 'REWARD_AD_LOAD_TIMEOUT'), 10000);
      try {
        const p = state.instance.load!();
        if (!p || typeof p.then !== 'function') { finish(false, 'REWARD_AD_LOAD_CONTRACT'); return; }
        p.then(() => finish(true), () => finish(false, 'REWARD_AD_LOAD_REJECTED'));
      } catch { finish(false, 'REWARD_AD_LOAD_THROW'); }
    });
    return state.preparing;
  }
  show(attemptId: UUID): Promise<RewardedAdOutcome> {
    if (this.disposed) return Promise.resolve({ kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_DISPOSED' });
    const state = this.active;
    if (!state || state.closed || !state.loaded || typeof state.instance.show !== 'function') {
      return Promise.resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'REWARD_AD_NOT_PREPARED' });
    }
    if (state.pending) return Promise.resolve({ kind: 'UNAVAILABLE', attemptId, errorCode: 'REWARD_AD_BUSY' });
    return new Promise(resolve => {
      state.pending = { attemptId, resolve };
      try {
        const p = state.instance.show!();
        if (!p || typeof p.then !== 'function') this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_CONTRACT' });
        // show() resolving only means the call was accepted: the reward still waits for the top-level onClose.
        else p.catch(() => this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_REJECTED' }));
      } catch { this.finish(state, { kind: 'FAILED', attemptId, errorCode: 'REWARD_AD_SHOW_THROW' }); }
    });
  }
  private getInstance(): InstanceState | null {
    if (this.active && !this.active.closed) return this.active;
    const api = tapApi(); if (!api?.createRewardedVideoAd || !this.policy.adUnitId) return null;
    let instance: TapAdInstance;
    try { instance = api.createRewardedVideoAd({ adUnitId: this.policy.adUnitId, multiton: true }); } catch { return null; }
    const state: InstanceState = {
      generation: ++this.generation, instance, loaded: false, preparing: null, pending: null, loadFinish: null, loadTimer: null,
      closed: false, released: false, destroyed: false, registered: [], onLoad: () => { }, onError: () => { }, onClose: () => { },
    };
    // A partially created instance must still be destroyed; validate before claiming ownership.
    if (!instance.onLoad || !instance.offLoad || !instance.onError || !instance.offError || !instance.onClose || !instance.offClose
      || !instance.load || !instance.show) { this.release(state); return null; }
    state.onLoad = () => { if (state.closed) return; state.loaded = true; state.loadFinish?.(true); };
    state.onError = () => {
      if (state.closed) return; state.loaded = false;
      if (state.pending) this.finish(state, { kind: 'FAILED', attemptId: state.pending.attemptId, errorCode: 'REWARD_AD_NATIVE_ERROR' });
      else state.loadFinish?.(false, 'REWARD_AD_LOAD_ERROR');
    };
    state.onClose = result => {
      if (state.closed) return; const pending = state.pending; if (!pending) return;
      this.finish(state, result?.isEnded === true ? { kind: 'COMPLETED', attemptId: pending.attemptId }
        : { kind: 'CANCELLED', attemptId: pending.attemptId, errorCode: 'REWARD_AD_CLOSED_EARLY' });
    };
    // Register one listener per try: if the middle one throws, release already-unregistered listeners plus the instance.
    const register = (kind: ListenerKind, attach: () => void): boolean => {
      try { attach(); state.registered.push(kind); return true; } catch { return false; }
    };
    if (!register('load', () => instance.onLoad!(state.onLoad))
      || !register('error', () => instance.onError!(state.onError))
      || !register('close', () => instance.onClose!(state.onClose))) { this.release(state); return null; }
    this.active = state; return state;
  }
  /** Settle the owning attempt exactly once, then release native resources. Idempotent for duplicate/late closes. */
  private finish(state: InstanceState, outcome: RewardedAdOutcome): void {
    const pending = state.pending;
    if (state.closed || !pending || pending.attemptId !== outcome.attemptId) return;
    state.closed = true; state.pending = null; state.loaded = false; state.loadFinish = null;
    pending.resolve(outcome);
    this.release(state);
  }
  /** Unregister every registered listener independently, then destroy at most once and drop references. */
  private release(state: InstanceState): void {
    if (state.released) return;
    state.released = true; state.closed = true;
    this.clearLoadTimer(state);
    state.loadFinish = null; state.preparing = null;
    for (const kind of state.registered) {
      try {
        if (kind === 'load') state.instance.offLoad?.(state.onLoad);
        else if (kind === 'error') state.instance.offError?.(state.onError);
        else state.instance.offClose?.(state.onClose);
      } catch { /* an off failure must never block the remaining listeners or destroy */ }
    }
    state.registered = [];
    if (!state.destroyed) {
      state.destroyed = true;
      try { state.instance.destroy?.(); } catch { /* native destroy is best effort and must not throw out */ }
    }
    if (this.active === state) this.active = null;
  }
  private clearLoadTimer(state: InstanceState): void {
    if (state.loadTimer !== null) { clearTimeout(state.loadTimer); state.loadTimer = null; }
  }
  private fail(code: string): Result<never> { return { ok: false, error: { code, message: code, retryable: true } }; }
  dispose(): void {
    if (this.disposed) return; this.disposed = true;
    const state = this.active; this.active = null;
    if (!state) return;
    if (state.pending) this.finish(state, { kind: 'FAILED', attemptId: state.pending.attemptId, errorCode: 'REWARD_AD_DISPOSED' });
    else state.loadFinish?.(false, 'REWARD_AD_DISPOSED');
    this.release(state);
  }
}
