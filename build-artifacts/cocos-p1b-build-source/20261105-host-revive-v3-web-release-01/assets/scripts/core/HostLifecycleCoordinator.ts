import { Game, game } from 'cc';

export interface HostLifecycleSnapshot {
  domHidden: boolean;
  engineHidden: boolean;
  backgrounded: boolean;
  resumeRequired: boolean;
  hideEpoch: number;
  confirmedHideEpoch: number;
  revision: number;
  eventCount: number;
  events: ReadonlyArray<{ source: string; hidden: boolean; backgrounded: boolean; trusted: boolean | null; atMs: number; revision: number }>;
}
type Listener = (state: HostLifecycleSnapshot) => void;

/** Sticky foreground acknowledgement state. Scene lifetime is deliberately not represented here. */
export class HostResumeLatch {
  private _backgrounded = false;
  private _resumeRequired = false;
  private _hideEpoch = 0;
  private _confirmedHideEpoch = 0;

  get backgrounded(): boolean { return this._backgrounded; }
  get resumeRequired(): boolean { return this._resumeRequired; }
  get hideEpoch(): number { return this._hideEpoch; }
  get confirmedHideEpoch(): number { return this._confirmedHideEpoch; }

  setBackgrounded(backgrounded: boolean): boolean {
    if (backgrounded === this._backgrounded) return false;
    this._backgrounded = backgrounded;
    if (backgrounded) { this._hideEpoch++; this._resumeRequired = true; }
    return true;
  }

  confirmResume(expectedHideEpoch: number, ready: boolean, visible: boolean, guardsClear: boolean):
    { ok: boolean; reason: string | null; confirmed: boolean } {
    if (!ready) return { ok: false, reason: 'INITIALIZING', confirmed: false };
    if (!visible || this._backgrounded) return { ok: false, reason: 'BACKGROUND', confirmed: false };
    if (!guardsClear) return { ok: false, reason: 'PAUSE_GUARD', confirmed: false };
    if (!this._resumeRequired) return { ok: true, reason: null, confirmed: false };
    if (expectedHideEpoch !== this._hideEpoch) return { ok: false, reason: 'STALE_HIDE_EPOCH', confirmed: false };
    this._resumeRequired = false;
    this._confirmedHideEpoch = expectedHideEpoch;
    return { ok: true, reason: null, confirmed: true };
  }

  static verifyTransitions(): Record<string, boolean> {
    const state = new HostResumeLatch();
    const checks: Record<string, boolean> = {};
    checks.normalStartupStaysOpen = !state.resumeRequired && state.hideEpoch === 0;
    state.setBackgrounded(true); const firstHideEpoch = state.hideEpoch;
    state.setBackgrounded(false);
    checks.showDoesNotAcknowledge = state.resumeRequired && state.hideEpoch === firstHideEpoch;
    checks.notReadyCannotAcknowledge = !state.confirmResume(firstHideEpoch, false, true, true).ok && state.resumeRequired;
    checks.galleryGuardCannotAcknowledge = !state.confirmResume(firstHideEpoch, true, true, false).ok && state.resumeRequired;
    checks.validResumeConfirmsCurrentHide = state.confirmResume(firstHideEpoch, true, true, true).confirmed
      && !state.resumeRequired && state.confirmedHideEpoch === firstHideEpoch;
    state.setBackgrounded(true); const secondHideEpoch = state.hideEpoch;
    state.setBackgrounded(false);
    checks.oldResumeCannotClearNewHide = secondHideEpoch > firstHideEpoch
      && !state.confirmResume(firstHideEpoch, true, true, true).ok && state.resumeRequired;
    checks.hiddenCannotAcknowledge = !state.confirmResume(secondHideEpoch, true, false, true).ok && state.resumeRequired;
    checks.newValidResumeConfirmsNewHide = state.confirmResume(secondHideEpoch, true, true, true).confirmed
      && !state.resumeRequired && state.confirmedHideEpoch === secondHideEpoch;
    return checks;
  }
}

/** Process-wide host visibility ownership survives Boot -> PhysicsLab scene replacement. */
export class HostLifecycleCoordinator {
  private static domHidden = false;
  private static engineHidden = false;
  private static revision = 0;
  private static totalEvents = 0;
  private static installed = false;
  private static readonly listeners = new Set<Listener>();
  private static readonly resumeLatch = new HostResumeLatch();
  private static readonly events: Array<{ source: string; hidden: boolean; backgrounded: boolean; trusted: boolean | null; atMs: number; revision: number }> = [];
  private static visibilityListener: ((event: Event) => void) | null = null;
  static get backgrounded(): boolean { return this.domHidden || this.engineHidden; }

  static install(): void {
    if (this.installed) return;
    this.installed = true;
    game.on(Game.EVENT_HIDE, this.onEngineHide, this);
    game.on(Game.EVENT_SHOW, this.onEngineShow, this);
    if (typeof document !== 'undefined') {
      this.visibilityListener = (event: Event) => this.setDomHidden(document.visibilityState === 'hidden', event.isTrusted);
      document.addEventListener('visibilitychange', this.visibilityListener);
      this.setDomHidden(document.visibilityState === 'hidden', null);
    }
    this.record('install', this.backgrounded, null);
  }

  static subscribe(listener: Listener): () => void {
    this.listeners.add(listener); listener(this.snapshot());
    return () => { this.listeners.delete(listener); };
  }

  static snapshot(): HostLifecycleSnapshot {
    return { domHidden: this.domHidden, engineHidden: this.engineHidden, backgrounded: this.backgrounded,
      resumeRequired: this.resumeLatch.resumeRequired, hideEpoch: this.resumeLatch.hideEpoch,
      confirmedHideEpoch: this.resumeLatch.confirmedHideEpoch,
      revision: this.revision, eventCount: this.totalEvents, events: this.events.slice() };
  }

  /** Called only by a validated user resume action after LabPauseGate has accepted R. */
  static confirmUserResume(hideEpoch: number, ready: boolean, visible: boolean, guardsClear: boolean) {
    const result = this.resumeLatch.confirmResume(hideEpoch, ready, visible, guardsClear);
    if (result.confirmed) {
      this.revision++; this.record('resume-confirm', false, null);
      const snapshot = this.snapshot(); for (const listener of this.listeners) listener(snapshot);
    }
    return result;
  }

  static verifyResumeTransitionsForTests(): Record<string, boolean> { return HostResumeLatch.verifyTransitions(); }

  static disposeForTests(): void {
    if (!this.installed) return;
    game.off(Game.EVENT_HIDE, this.onEngineHide, this); game.off(Game.EVENT_SHOW, this.onEngineShow, this);
    if (this.visibilityListener && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibilityListener);
    this.visibilityListener = null; this.installed = false; this.listeners.clear();
  }

  private static readonly onEngineHide = (): void => this.setEngineHidden(true);
  private static readonly onEngineShow = (): void => this.setEngineHidden(false);
  private static setDomHidden(hidden: boolean, trusted: boolean | null): void {
    if (this.domHidden === hidden) { this.record('dom', hidden, trusted); return; }
    const previousBackgrounded = this.backgrounded; this.domHidden = hidden; this.publish('dom', hidden, trusted, previousBackgrounded);
  }
  private static setEngineHidden(hidden: boolean): void {
    if (this.engineHidden === hidden) { this.record('engine', hidden, null); return; }
    const previousBackgrounded = this.backgrounded; this.engineHidden = hidden; this.publish('engine', hidden, null, previousBackgrounded);
  }
  private static publish(source: string, hidden: boolean, trusted: boolean | null, previousBackgrounded: boolean): void {
    if (previousBackgrounded !== this.backgrounded) {
      this.revision++;
      this.resumeLatch.setBackgrounded(this.backgrounded);
    }
    this.record(source, hidden, trusted);
    const snapshot = this.snapshot(); for (const listener of this.listeners) listener(snapshot);
  }
  private static record(source: string, hidden: boolean, trusted: boolean | null): void {
    this.totalEvents++;
    this.events.push({ source, hidden, backgrounded: this.backgrounded, trusted,
      atMs: typeof performance !== 'undefined' ? performance.now() : Date.now(), revision: this.revision });
    if (this.events.length > 128) this.events.shift();
  }
}
