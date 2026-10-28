import { Game, game } from 'cc';

export interface HostLifecycleSnapshot {
  domHidden: boolean;
  engineHidden: boolean;
  backgrounded: boolean;
  revision: number;
  eventCount: number;
  events: ReadonlyArray<{ source: string; hidden: boolean; backgrounded: boolean; trusted: boolean | null; atMs: number; revision: number }>;
}
type Listener = (state: HostLifecycleSnapshot) => void;

/** Process-wide host visibility ownership survives Boot -> PhysicsLab scene replacement. */
export class HostLifecycleCoordinator {
  private static domHidden = false;
  private static engineHidden = false;
  private static revision = 0;
  private static totalEvents = 0;
  private static installed = false;
  private static readonly listeners = new Set<Listener>();
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
      revision: this.revision, eventCount: this.totalEvents, events: this.events.slice() };
  }

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
    if (previousBackgrounded !== this.backgrounded) this.revision++;
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
