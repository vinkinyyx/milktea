import { _decorator, BlockInputEvents, Canvas, Color, Component, game, Graphics, Input, input, KeyCode, Label, Node, PhysicsSystem2D, UITransform, Vec2, Vec3, view } from 'cc';
import { Level } from '../contracts/types';
import { FixedClock } from '../core/Clock';
import { HostLifecycleCoordinator, HostLifecycleSnapshot } from '../core/HostLifecycleCoordinator';
import { AppRuntime } from '../bootstrap/AppRoot';
import { CocosPhysicsAdapter } from '../physics/CocosPhysicsAdapter';
import { CupGeometry } from '../physics/CupGeometry';
import { sampleCupSegmentSweep } from '../physics/CupSweepProbe';
import { ArtAssets } from '../presentation/ArtAssets';
import { ArtCatalog } from '../presentation/ArtCatalog';
import { ArtGallery } from './ArtGallery';
import { LabPauseGate } from './LabPauseGate';
import { NineSizeQueueLedger } from './NineSizeQueueLedger';
import { LabProbe, LabProbeMode } from './LabProbe';
import { configureViewport } from '../bootstrap/Viewport';
const { ccclass } = _decorator;

interface ContactRebuildRound { round: number; entityIds: [number, number]; worldId: number; contactBeginTick: number; canonicalContacts: string[]; beginCount: number; contactsAfterBegin: number; bodiesBefore: number; listenersBefore: number; oldDestroyed: boolean; emptyBaseline: boolean; stableFrames: number; nextWorldId: number; bodiesAfter: number; contactsAfter: number; listenersAfter: number }
interface ContactRebuildTask { attemptId: string; token: number; interruptAt: number; round: number; phase: 'WAIT_CONTACT' | 'WAIT_CLEAR' | 'WAIT_RESUME'; deadlineTick: number; settleFrames: number; oldWorld: Node | null; oldAdapter: CocosPhysicsAdapter | null; records: ContactRebuildRound[]; status: 'RUNNING' | 'PASS' | 'CANCELLED' | 'FAIL'; failure: string | null; failureDiagnostics?: Record<string, unknown> }
interface ContactMatrixTask { token: number; phase: 'PAIR_BEGIN' | 'PAIR_END' | 'CORNER_END_WAIT' | 'CORNER_RELEASE_WAIT' | 'OTHER_BEGIN' | 'STALE' | 'DONE'; deadlineTick: number; pairA: number; pairB: number; corner: number; pairEndStart: number; result: Record<string, unknown>; oldAdapter: CocosPhysicsAdapter | null; oldWorld: Node | null }
interface WallMatrixCase { id: number; level: number; kind: 'left' | 'right' | 'bottom' | 'left-corner' | 'right-corner'; radius: number; position: { x: number; y: number }; velocity: { x: number; y: number }; expected: number[] }
interface WallMatrixTask { cases: WallMatrixCase[]; index: number; phase: 'COLLIDE' | 'NEXT' | 'DONE'; deadlineTick: number; nextTick: number; contactsSeen: Set<number>; lastPosition: { x: number; y: number }; sample: Float64Array; records: Array<Record<string, unknown>>; status: 'RUNNING' | 'PASS' | 'FAIL'; failure: string | null }

@ccclass('PhysicsLab')
export class PhysicsLab extends Component {
  private adapter!: CocosPhysicsAdapter;
  private clock!: FixedClock;
  private world!: Node;
  private visuals = new Map<number, Node>();
  private visualRadii = new Map<number, number>();
  private graphics!: Graphics;
  private diagnostics!: Label;
  private touchControls: Node | null = null;
  private nextEntityId = 1;
  private renderHz = 60;
  private message = '已就绪';
  private gravityProbe: { entityId: number; initialY: number; samples: Set<number> } | null = null;
  private inputBound = false;
  private rebuildGeneration = 0;
  private worldSerial = 0;
  private contactTaskToken = 0;
  private contactRebuildTask: ContactRebuildTask | null = null;
  private readonly contactRebuildHistory: Array<{ attemptId: string; status: string; failure: string | null; records: ContactRebuildRound[] }> = [];
  private contactMatrixTask: ContactMatrixTask | null = null;
  private wallMatrixTask: WallMatrixTask | null = null;
  private rebuildCallback: (() => void) | null = null;
  private art = new ArtAssets();
  private rearArt!: Node;
  private frontArt!: Node;
  private cupSprites: Node[] = [];
  private cupWidthScale = 1;
  private artGeneration = 0;
  private loading = false;
  private ready = false;
  private showBounds = false;
  private gallery: ArtGallery | null = null;
  private resumeAfterGallery = false;
  private galleryPauseSerial = 0;
  private pauseGeneration = 0;
  private readonly pauseGate = new LabPauseGate();
  private lifecycleUnsubscribe: (() => void) | null = null;
  private queueGeneration = 0;
  private queueCallback: (() => void) | null = null;
  private queueLedger: NineSizeQueueLedger | null = null;
  private get queueState() { return this.queueLedger?.state ?? null; }
  private lastHudText = '';
  private hudRefreshMs = 0;
  private readonly probe = new LabProbe();
  private cadenceProbe: { entityId: number; renderHz: number; frames: number; renderSeconds: number } | null = null;
  onLoad(): void {
    const browserGlobal = globalThis as any;
    const search = new URLSearchParams(browserGlobal.location?.search ?? '');
    const requestedProbe = search.get('p1aProbe');
    const probeMode: LabProbeMode = requestedProbe === 'summary' ? 'SUMMARY' : requestedProbe === 'light' ? 'TIMING'
      : requestedProbe === 'legacy' ? 'LEGACY_COMPARE' : 'OFF';
    this.probe.configure(probeMode, { buildId: AppRuntime.buildId,
      attemptId: search.get('attemptId') ?? `runtime-${Date.now()}`,
      probeVersion: search.get('probeVersion') ?? 'lab-probe-v2', worldId: 0, cupScale: 1 });
    browserGlobal.__p1aProbe = { phase: () => this.probe.phase, export: () => this.probe.export() };
    browserGlobal.__p1aLifecycle = { snapshot: () => HostLifecycleCoordinator.snapshot() };
    browserGlobal.__p1aLab = { snapshot: () => this.debugSnapshot(), status: () => this.runtimeStatus(), cancelQueue: () => this.cancelQueue('test-cancel'),
      startQueue: () => this.spawnNineSizes(),
      cancelContactRebuild: () => this.cancelContactRebuildTask(),
      startContactRebuild: (interruptAt = 0) => this.startContactRebuildTest(interruptAt), startContactMatrix: () => this.startContactMatrixTest(),
      startWallMatrix: () => this.startWallCollisionMatrix(),
      startPressure: (layout = 'original') => this.startPressureTest(layout as 'original' | 'strict' | 'mixed'),
      startLevelDrop: (level: number) => this.startLevelDropForTest(level), startNarrowestCup: () => this.runNarrowestCup() };
    this.lifecycleUnsubscribe = HostLifecycleCoordinator.subscribe(state => this.onLifecycleState(state));
    if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(750, 1334);
    if (AppRuntime.rules) configureViewport(this.node, AppRuntime.rules.viewport);
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    window.addEventListener('keydown', this.onWindowKeyDown);
    input.on(Input.EventType.TOUCH_END, this.onRetryTouch, this);
    this.inputBound = true;
    console.info(JSON.stringify({ test: 'p1a-runtime-identity', buildId: AppRuntime.buildId,
      creator: '3.8.8', box2d: '1.0.2', ptm: AppRuntime.mapper?.cocosPtmRatio ?? 32,
      autoSimulation: PhysicsSystem2D.instance.autoSimulation, probeMode, probeVersion: this.probe.identity.probeVersion,
      attemptId: this.probe.identity.attemptId }));
  }
  start(): void {
    this.createOverlay();
    void this.initializeLab();
  }
  private async initializeLab(): Promise<void> {
    if (this.loading || this.ready) return;
    const rules = AppRuntime.rules;
    if (!rules) { this.message = '配置未加载：请从 Boot 启动'; return; }
    if (!(PhysicsSystem2D.PHYSICS_BOX2D || PhysicsSystem2D.PHYSICS_BOX2D_WASM)) { this.message = '需在 Creator 项目设置启用 2D Box2D 后端，重载后按 T 重试'; return; }
    const generation = ++this.artGeneration;
    this.loading = true; this.message = '加载已交付的P1美术…';
    this.art.dispose(); this.art = new ArtAssets();
    const owner = this.art;
    try {
      await owner.initialize();
      const requests = rules.ingredients.map(item => owner.load(ArtCatalog.ingredientId(item.id), ArtCatalog.ingredientEdgeDu(item.radius_du) * 2));
      requests.push(owner.load('bg_shop_base', 1334), owner.load('spr_cup_shadow', 512));
      for (const layer of ['back', 'tea', 'rim_back', 'front', 'rim_front', 'base', 'label']) requests.push(owner.load(`spr_cup_classic_${layer}`, 1000));
      await Promise.all(requests);
      if (!this.isValid || generation !== this.artGeneration || this.art !== owner) { owner.dispose(); return; }
      this.createSceneArt();
      this.world = new Node('PhysicsWorld'); this.node.addChild(this.world); this.world.setSiblingIndex(1);
      this.adapter = new CocosPhysicsAdapter(this.world, rules, AppRuntime.mapper!); this.adapter.createCup('classic');
      this.adapter.setTimingDiagnostics(this.probe.mode !== 'OFF');
      this.probe.setWorld(++this.worldSerial, this.cupWidthScale);
      this.clock = new FixedClock(rules.physics.fixed_hz, rules.physics.max_catchup_steps, () => {
        const stepStarted = this.probe.mode === 'OFF' ? 0 : performance.now();
        this.adapter.stepFixed();
        const nextTick = (this.clock?.tick ?? 0) + 1;
        if (this.probe.mode !== 'OFF') {
          const probeFailure = this.probe.afterStep(this.adapter, nextTick, performance.now() - stepStarted);
          if (probeFailure) { this.pauseGate.hold('ERROR'); this.clock?.pause(); this.message = `物理诊断首次异常：${probeFailure}，现场已冻结`; return; }
        }
        this.advanceContactTests(nextTick);
        this.advanceContactMatrix(nextTick);
        this.advanceWallCollisionMatrix(nextTick);
        this.sampleGravity(nextTick); this.sampleCadence(nextTick);
      });
      // A hide can arrive while the asynchronous asset requests are in flight.
      if (AppRuntime.backgrounded) this.pauseGate.hold('BACKGROUND');
      if (!this.pauseGate.canAdvance) this.clock.pause();
      this.ready = true; this.drawCup(); this.spawnThree();
    } catch (error) {
      if (this.isValid && generation === this.artGeneration) {
        this.ready = false; this.clock?.pause(); this.adapter?.dispose(); this.disposeViews();
        this.world?.destroy(); this.rearArt?.destroy(); this.frontArt?.destroy(); this.art.dispose();
        console.error('美术/场景初始化失败', error);
        this.message = '美术加载失败：点击画面或按 T 重试';
      } else owner.dispose();
    } finally { if (generation === this.artGeneration) this.loading = false; }
  }
  update(dt: number): void {
    const updateStart = this.probe.mode === 'OFF' ? 0 : performance.now();
    if (this.probe.mode !== 'OFF') this.probe.beginFrame(dt, this.clock?.tick ?? 0);
    let viewMs = 0;
    try {
      if (this.clock && this.pauseGate.canAdvance && !this.clock.paused) {
        if (this.cadenceProbe) { this.cadenceProbe.frames++; this.cadenceProbe.renderSeconds += dt; }
        const result = this.clock.update(dt);
        if (result.pausedForBacklog) {
          this.pauseGate.hold('BACKLOG'); this.probe.freezeForBacklog(result.tick); this.cadenceProbe = null;
          this.message = '物理落后超过配置补步上限，已暂停；本attempt已冻结，请另开attempt重测';
        }
        const viewStarted = this.probe.mode === 'OFF' ? 0 : performance.now();
        this.syncViews();
        if (this.probe.mode !== 'OFF') viewMs = performance.now() - viewStarted;
      }
      this.refreshDiagnostics();
    } finally {
      if (this.probe.mode !== 'OFF') this.probe.endFrame(this.clock?.tick ?? 0, viewMs, performance.now() - updateStart, this.pauseReasonMask());
    }
  }
  onDestroy(): void {
    this.cancelQueue('destroy');
    this.cancelContactRebuildTask();
    this.artGeneration++; this.gallery?.close();
    this.rebuildGeneration++;
    if (this.inputBound) input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    window.removeEventListener('keydown', this.onWindowKeyDown);
    input.off(Input.EventType.TOUCH_END, this.onRetryTouch, this);
    this.lifecycleUnsubscribe?.(); this.lifecycleUnsubscribe = null;
    if (this.adapter) this.adapter.dispose();
    this.art.dispose();
  }

  pause(reason = '手动暂停'): void {
    this.pauseGate.hold('MANUAL');
    if (this.clock) { this.pauseGeneration++; this.clock.pause(); this.message = `已暂停：${reason}`; }
  }
  resume(): void {
    const result = this.pauseGate.requestUserResume(this.ready, !AppRuntime.backgrounded);
    if (!result.ok) { this.message = `当前不能恢复：${result.reason}`; return; }
    if (this.contactRebuildTask?.status === 'RUNNING' && this.contactRebuildTask.phase === 'WAIT_RESUME') {
      const task = this.contactRebuildTask; task.round++; task.phase = 'WAIT_CONTACT'; task.deadlineTick = this.clock.tick + 120;
      this.spawnContactPair(task.round);
    }
    if (this.clock?.paused && this.pauseGate.canAdvance && !AppRuntime.backgrounded) { this.clock.resume(); this.message = '已恢复（后台时间未补算）'; }
  }
  clearAndRebuild(): void {
    if (!this.adapter) return;
    this.cancelQueue('rebuild');
    this.cancelContactRebuildTask();
    const shouldResume = this.pauseGate.canAdvance && !AppRuntime.backgrounded && !this.gallery;
    const pauseGeneration = this.pauseGeneration;
    const generation = ++this.rebuildGeneration;
    this.pauseGate.hold('REBUILD');
    this.gravityProbe = null;
    this.cadenceProbe = null;
    this.clock.pause(); this.disposeViews(); this.adapter.dispose();
    this.world.destroy(); this.world = new Node('PhysicsWorld'); this.node.addChild(this.world); this.world.setSiblingIndex(1);
    this.adapter = new CocosPhysicsAdapter(this.world, AppRuntime.rules!, AppRuntime.mapper!);
    this.probe.setWorld(++this.worldSerial, this.cupWidthScale);
    this.adapter.createCup('classic'); this.clock.reset(); this.nextEntityId = 1;
    this.applyCupWidthScale(1);
    this.drawCup(); this.message = '物理世界已重建';
    if (shouldResume) this.scheduleOnce(() => {
      if (!this.isValid || generation !== this.rebuildGeneration) return;
      this.pauseGate.release('REBUILD');
      if (pauseGeneration !== this.pauseGeneration) return;
      if (this.pauseGate.canAdvance && !AppRuntime.backgrounded && !this.gallery) this.clock.resume();
    }, 1 / AppRuntime.rules!.physics.fixed_hz);
    else this.scheduleOnce(() => {
      if (this.isValid && generation === this.rebuildGeneration) this.pauseGate.release('REBUILD');
    }, 1 / AppRuntime.rules!.physics.fixed_hz);
  }
  rebuildTwentyTimes(): void {
    this.startContactRebuildTest(0);
  }

  startContactRebuildTest(interruptAt = 0): string {
    if (!this.ready || !this.adapter || !this.clock) throw new Error('PhysicsLab not ready');
    if (interruptAt !== 0 && interruptAt !== 5 && interruptAt !== 10) throw new Error('interruptAt must be 0, 5, or 10');
      if (AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Contact rebuild requires a visible lab without another pause owner');
    this.pauseGate.release('SAMPLE_COMPLETE');
    this.cancelQueue('contact-rebuild'); this.cancelContactRebuildTask();
    this.pauseGate.hold('REBUILD'); this.clock.pause(); this.gravityProbe = null; this.cadenceProbe = null;
    this.replacePhysicsWorld(); this.clock.reset();
    const task: ContactRebuildTask = { attemptId: `${this.probe.identity.attemptId}-REB20-${Date.now()}`, token: ++this.contactTaskToken,
      interruptAt, round: 1, phase: 'WAIT_CONTACT', deadlineTick: 120, settleFrames: 0, oldWorld: null, oldAdapter: null,
      records: [], status: 'RUNNING', failure: null };
    this.contactRebuildTask = task; this.spawnContactPair(task.round); this.drawCup();
    this.pauseGate.release('REBUILD'); this.clock.resume();
    console.info(JSON.stringify({ test: 'contact-rebuild-start', attemptId: task.attemptId, buildId: this.probe.identity.buildId,
      interruptAt, targetRounds: 20, contactFixture: 'two actual overlapping level-1 Cocos CircleCollider2D bodies; FixedClock drives physics' }));
    return task.attemptId;
  }

  private contactPairIds(round: number): [number, number] { const first = 9001 + (round - 1) * 2; return [first, first + 1]; }
  private spawnContactPair(round: number): void {
    const radius = AppRuntime.rules!.ingredients[0].radius_du; const center = AppRuntime.rules!.cup.center_x_du;
    const y = 620; const offset = radius - 0.5; const [first, second] = this.contactPairIds(round);
    this.adapter.createBody({ entityId: first, level: 1, radiusDu: radius, positionDu: { x: center - offset, y }, velocityDuPerSecond: { x: 0, y: 0 } });
    this.adapter.createBody({ entityId: second, level: 1, radiusDu: radius, positionDu: { x: center + offset, y }, velocityDuPerSecond: { x: 0, y: 0 } });
  }

  private advanceContactTests(tick: number): void {
    const task = this.contactRebuildTask;
    if (!task || task.status !== 'RUNNING' || task.phase !== 'WAIT_CONTACT') return;
    const contacts = this.adapter.getContacts();
    const entityIds = this.contactPairIds(task.round);
    if (contacts.some(contact => contact.firstId === entityIds[0] && contact.secondId === entityIds[1])
      && this.adapter.contactBeginEvents > 0) {
      task.records.push({ round: task.round, entityIds, worldId: this.worldSerial, contactBeginTick: tick,
        canonicalContacts: contacts.map(contact => contact.contactId).sort(), beginCount: this.adapter.contactBeginEvents,
        contactsAfterBegin: this.adapter.contactCount, bodiesBefore: this.adapter.entityCount, listenersBefore: this.adapter.listenerCount,
        oldDestroyed: false, emptyBaseline: false, stableFrames: 0, nextWorldId: 0, bodiesAfter: -1, contactsAfter: -1, listenersAfter: -1 });
      task.oldAdapter = this.adapter; task.oldWorld = this.world; task.phase = 'WAIT_CLEAR'; task.settleFrames = 0;
      this.pauseGate.hold('REBUILD'); this.clock.pause(); this.scheduleRebuildSettle(task.token, 0);
      return;
    }
    if (tick > task.deadlineTick) {
      const [first, second] = entityIds;
      task.failureDiagnostics = { expectedEntityIds: entityIds, contacts: this.adapter.getContacts(),
        firstBody: this.adapter.getBody(first) ?? null, secondBody: this.adapter.getBody(second) ?? null,
        entityCount: this.adapter.entityCount, listenerCount: this.adapter.listenerCount, stepCount: this.adapter.stepCount,
        worldId: this.worldSerial, lifecycle: HostLifecycleCoordinator.snapshot() };
      this.finishContactRebuildTask('FAIL', 'CONTACT_BEGIN_TIMEOUT');
    }
  }

  private scheduleRebuildSettle(token: number, frame: number): void {
    if (this.rebuildCallback) this.unschedule(this.rebuildCallback);
    const callback = () => {
      if (this.rebuildCallback === callback) this.rebuildCallback = null;
      const task = this.contactRebuildTask;
      if (!task || task.token !== token || task.status !== 'RUNNING' || !this.isValid) return;
      if (frame === 0) {
        task.oldAdapter?.dispose(); task.oldWorld?.destroy(); this.disposeViews(); this.createEmptyWorldForTest(); this.clock.reset();
      }
      const oldDestroyed = !task.oldWorld || !task.oldWorld.isValid;
      const empty = this.adapter.entityCount === 0 && this.adapter.contactCount === 0 && this.adapter.listenerCount === 3;
      task.settleFrames = oldDestroyed && empty ? task.settleFrames + 1 : 0;
      if (task.settleFrames < 2 && frame < 8) { this.scheduleRebuildSettle(token, frame + 1); return; }
      const last = task.records[task.records.length - 1]; last.oldDestroyed = oldDestroyed; last.emptyBaseline = empty;
      last.stableFrames = task.settleFrames; last.nextWorldId = this.worldSerial; last.bodiesAfter = this.adapter.entityCount;
      last.contactsAfter = this.adapter.contactCount; last.listenersAfter = this.adapter.listenerCount;
      const stale = task.oldAdapter?.replayStaleContactCallbacksForTest();
      if (!oldDestroyed || !empty || !stale || stale.contactCount !== 0 || stale.colliderOwners !== 0) {
        this.finishContactRebuildTask('FAIL', `WORLD_CLEANUP_FAILED_round_${task.round}`); return;
      }
      if (task.interruptAt === task.round) { this.finishContactRebuildTask('CANCELLED', `INTERRUPTED_AFTER_CONTACT_ROUND_${task.round}`); return; }
      if (task.round >= 20) { this.finishContactRebuildTask('PASS', null); return; }
      this.pauseGate.release('REBUILD');
      if (!this.pauseGate.canAdvance || AppRuntime.backgrounded) { task.phase = 'WAIT_RESUME'; this.clock.pause(); return; }
      task.round++; task.phase = 'WAIT_CONTACT'; task.deadlineTick = this.clock.tick + 120;
      this.spawnContactPair(task.round); this.clock.resume();
    };
    this.rebuildCallback = callback; this.scheduleOnce(callback, 1 / AppRuntime.rules!.physics.fixed_hz);
  }

  private finishContactRebuildTask(status: 'PASS' | 'CANCELLED' | 'FAIL', failure: string | null): void {
    const task = this.contactRebuildTask; if (!task || task.status !== 'RUNNING') return;
    task.status = status; task.failure = failure;
    if (this.rebuildCallback) { this.unschedule(this.rebuildCallback); this.rebuildCallback = null; }
    this.pauseGate.release('REBUILD'); this.pauseGate.hold('SAMPLE_COMPLETE'); this.clock.pause();
    this.message = `接触重建${status}: ${task.records.length}/20轮${failure ? ` · ${failure}` : ''}`;
    console.info(JSON.stringify({ test: 'contact-rebuild-result', attemptId: task.attemptId, buildId: this.probe.identity.buildId,
      status, failure, rounds: task.records, final: { entityCount: this.adapter.entityCount, contactCount: this.adapter.contactCount, listenerCount: this.adapter.listenerCount } }));
    this.contactRebuildHistory.push({ attemptId: task.attemptId, status, failure, records: task.records.map(record => ({ ...record })) });
  }

  private cancelContactRebuildTask(): void {
    if (this.rebuildCallback) { this.unschedule(this.rebuildCallback); this.rebuildCallback = null; }
    if (this.contactRebuildTask?.status === 'RUNNING') {
      this.contactRebuildTask.status = 'CANCELLED'; this.contactRebuildTask.failure = 'REPLACED';
      console.info(JSON.stringify({ test: 'contact-rebuild-result', attemptId: this.contactRebuildTask.attemptId,
        status: 'CANCELLED', failure: 'REPLACED', completedRounds: this.contactRebuildTask.records }));
      this.contactRebuildHistory.push({ attemptId: this.contactRebuildTask.attemptId, status: 'CANCELLED', failure: 'REPLACED',
        records: this.contactRebuildTask.records.map(record => ({ ...record })) });
    }
    this.pauseGate.release('REBUILD');
    this.contactTaskToken++;
  }

  private createEmptyWorldForTest(): void {
    this.world = new Node('PhysicsWorld'); this.node.addChild(this.world); this.world.setSiblingIndex(1);
    this.adapter = new CocosPhysicsAdapter(this.world, AppRuntime.rules!, AppRuntime.mapper!);
    this.adapter.setTimingDiagnostics(this.probe.mode !== 'OFF'); this.adapter.createCup('classic');
    this.probe.setWorld(++this.worldSerial, this.cupWidthScale);
  }

  private replacePhysicsWorld(): void {
    if (this.adapter) this.adapter.dispose(); this.disposeViews();
    if (this.world?.isValid) this.world.destroy(); this.createEmptyWorldForTest();
    this.applyCupWidthScale(1);
  }

  startContactMatrixTest(): string {
    if (!this.ready || !this.adapter || !this.clock) throw new Error('PhysicsLab not ready');
      if (AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Contact matrix requires a visible lab without another pause owner');
    this.pauseGate.release('SAMPLE_COMPLETE');
    this.cancelContactRebuildTask(); this.cancelQueue('contact-matrix');
    this.pauseGate.hold('REBUILD'); this.clock.pause(); this.replacePhysicsWorld(); this.clock.reset();
    const radius = AppRuntime.rules!.ingredients[0].radius_du; const center = AppRuntime.rules!.cup.center_x_du;
    const attemptId = `${this.probe.identity.attemptId}-CONTACT-${Date.now()}`;
    const task: ContactMatrixTask = { token: ++this.contactTaskToken, phase: 'PAIR_BEGIN', deadlineTick: 300,
      pairA: 9101, pairB: 9102, corner: 9103, pairEndStart: 0, result: { attemptId, buildId: this.probe.identity.buildId }, oldAdapter: null, oldWorld: null };
    this.contactMatrixTask = task;
    this.adapter.createBody({ entityId: task.pairA, level: 1, radiusDu: radius, positionDu: { x: center - radius + 0.5, y: 620 }, velocityDuPerSecond: { x: 0, y: 0 } });
    this.adapter.createBody({ entityId: task.pairB, level: 1, radiusDu: radius, positionDu: { x: center + radius - 0.5, y: 620 }, velocityDuPerSecond: { x: 0, y: 0 } });
    this.pauseGate.release('REBUILD'); this.clock.resume();
    console.info(JSON.stringify({ test: 'contact-matrix-start', attemptId, buildId: this.probe.identity.buildId, bodyPair: [task.pairA, task.pairB] }));
    return attemptId;
  }

  startWallCollisionMatrix(): number {
    if (!this.ready || !this.adapter || !this.clock || AppRuntime.backgrounded || this.gallery
      || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE')) throw new Error('Wall collision matrix requires a visible lab');
    this.pauseGate.release('SAMPLE_COMPLETE'); this.cancelContactRebuildTask(); this.cancelQueue('wall-matrix');
    this.pauseGate.hold('REBUILD'); this.clock.pause(); this.replacePhysicsWorld(); this.clock.reset();
    const rules = AppRuntime.rules!; const maxSpeed = rules.physics.max_linear_speed * rules.viewport.du_per_spec_physics_unit;
    const cases: WallMatrixCase[] = []; let id = 9400;
    for (const item of rules.ingredients.slice().sort((a, b) => a.level - b.level)) {
      for (const kind of ['left', 'right', 'bottom', 'left-corner', 'right-corner'] as const) {
        const radius = item.radius_du; let position: { x: number; y: number }; let velocity: { x: number; y: number };
        const expected = kind === 'left' ? [1] : kind === 'right' ? [2] : kind === 'bottom' ? [0] : kind === 'left-corner' ? [0, 1] : [0, 2];
        if (kind === 'left' || kind === 'right') {
          const segment = this.adapter.cupSegments.find(value => value.kind === kind)!;
          const face = { x: (segment.innerStart.x + segment.innerEnd.x) / 2, y: (segment.innerStart.y + segment.innerEnd.y) / 2 };
          const inward = { x: -segment.outward.x, y: -segment.outward.y };
          position = { x: face.x + inward.x * (radius + 40), y: face.y + inward.y * (radius + 40) };
          velocity = { x: segment.outward.x * maxSpeed, y: segment.outward.y * maxSpeed };
        } else if (kind === 'bottom') {
          const bottom = this.adapter.cupSegments.find(value => value.kind === 'bottom')!;
          position = { x: rules.cup.center_x_du, y: bottom.innerStart.y + radius + 40 }; velocity = { x: 0, y: -maxSpeed };
        } else {
          const side = this.adapter.cupSegments.find(value => value.kind === (kind === 'left-corner' ? 'left' : 'right'))!;
          const bottom = this.adapter.cupSegments.find(value => value.kind === 'bottom')!;
          const inwardSide = { x: -side.outward.x, y: -side.outward.y }; const inwardBottom = { x: 0, y: 1 };
          const corner = kind === 'left-corner' ? bottom.innerStart : bottom.innerEnd;
          const denom = inwardSide.x;
          if (Math.abs(denom) < 1e-6) throw new Error(`Corner normal is degenerate: ${kind}`);
          const inside = { x: (radius + 40 - inwardSide.y * (radius + 40)) / denom, y: radius + 40 };
          position = { x: corner.x + inside.x, y: corner.y + inside.y };
          const direction = { x: inwardSide.x + inwardBottom.x, y: inwardSide.y + inwardBottom.y };
          const magnitude = Math.hypot(direction.x, direction.y);
          velocity = { x: -direction.x / magnitude * maxSpeed, y: -direction.y / magnitude * maxSpeed };
        }
        cases.push({ id: id++, level: item.level, kind, radius, position, velocity, expected });
      }
    }
    const task: WallMatrixTask = { cases, index: 0, phase: 'COLLIDE', deadlineTick: 180, nextTick: 0,
      contactsSeen: new Set(), lastPosition: { ...cases[0].position }, sample: new Float64Array(5), records: [], status: 'RUNNING', failure: null };
    this.wallMatrixTask = task; this.spawnWallMatrixBody(task);
    this.pauseGate.release('REBUILD'); this.clock.resume();
    console.info(JSON.stringify({ test: 'wall-matrix-start', buildId: this.probe.identity.buildId,
      caseCount: cases.length, maxConfiguredSpeedDuPerSecond: maxSpeed, cases }));
    return cases.length;
  }

  private spawnWallMatrixBody(task: WallMatrixTask): void {
    const test = task.cases[task.index]; task.contactsSeen.clear(); task.lastPosition = { ...test.position };
    this.adapter.createBody({ entityId: test.id, level: test.level as Level, radiusDu: test.radius, positionDu: test.position, velocityDuPerSecond: test.velocity });
  }

  private advanceWallCollisionMatrix(tick: number): void {
    const task = this.wallMatrixTask; if (!task || task.status !== 'RUNNING') return;
    if (task.phase === 'NEXT') {
      if (tick < task.nextTick) return;
      if (task.index >= task.cases.length) { this.finishWallCollisionMatrix(); return; }
      task.phase = 'COLLIDE'; task.deadlineTick = tick + 180; this.spawnWallMatrixBody(task); return;
    }
    const test = task.cases[task.index]; const body = this.adapter.getBody(test.id);
    if (!body) { task.status = 'FAIL'; task.failure = `BODY_MISSING_${test.id}`; this.finishWallCollisionMatrix(); return; }
    let sweptEscape = false;
    for (let i = 0; i < this.adapter.cupSegments.length; i++) {
      sampleCupSegmentSweep(this.adapter.cupSegments[i], body.positionDu.x, body.positionDu.y,
        task.lastPosition.x, task.lastPosition.y, test.radius, true, task.sample);
      if (task.sample[4] === 1) sweptEscape = true;
    }
    task.lastPosition = { ...body.positionDu };
    const bodyContacts = this.adapter.getContacts().filter(contact => contact.firstId === test.id && contact.secondId === null);
    for (const contact of bodyContacts) { const boundary = Number(contact.contactId.split('cup:')[1]); if (Number.isInteger(boundary)) task.contactsSeen.add(boundary); }
    const allContacts = test.expected.every(boundary => task.contactsSeen.has(boundary));
    if (sweptEscape || allContacts || tick > task.deadlineTick) {
      const record = { level: test.level, caseId: test.id, path: test.kind, radiusDu: test.radius,
        configuredSpeedDuPerSecond: Math.hypot(test.velocity.x, test.velocity.y), expectedBoundaries: test.expected,
        observedBoundaries: Array.from(task.contactsSeen).sort(), contactsAtEnd: bodyContacts.map(contact => contact.contactId),
        contactBeginEvents: this.adapter.contactBeginEvents, contactEndEvents: this.adapter.contactEndEvents,
        tick, positionDu: body.positionDu, velocityDuPerSecond: body.velocityDuPerSecond, sweptEscape,
        status: allContacts && !sweptEscape ? 'PASS' : 'FAIL', failure: sweptEscape ? 'SWEPT_WALL_ESCAPE' : !allContacts ? 'EXPECTED_CONTACT_TIMEOUT' : null };
      task.records.push(record); this.adapter.destroyBody(test.id); task.index++;
      if (record.status === 'FAIL') { task.status = 'FAIL'; task.failure = `${test.level}_${test.kind}_${record.failure}`; this.finishWallCollisionMatrix(); return; }
      task.phase = 'NEXT'; task.nextTick = tick + 2;
    }
  }

  private finishWallCollisionMatrix(): void {
    const task = this.wallMatrixTask; if (!task || task.phase === 'DONE') return;
    if (task.status === 'RUNNING') task.status = task.records.length === task.cases.length ? 'PASS' : 'FAIL';
    task.phase = 'DONE'; this.pauseGate.hold('SAMPLE_COMPLETE'); this.clock.pause();
    this.message = `墙壁碰撞矩阵${task.status}: ${task.records.length}/${task.cases.length}${task.failure ? ` · ${task.failure}` : ''}`;
    console.info(JSON.stringify({ test: 'wall-matrix-result', buildId: this.probe.identity.buildId, status: task.status,
      failure: task.failure, records: task.records }));
  }

  private advanceContactMatrix(tick: number): void {
    const task = this.contactMatrixTask; if (!task || task.phase === 'DONE') return;
    if (tick > task.deadlineTick) {
      task.result.timeoutDiagnostics = { phase: task.phase, tick, contacts: this.adapter.getContacts(),
        entityIds: [task.pairA, task.pairB, task.corner, 9201, 9202],
        bodies: [task.pairA, task.pairB, task.corner, 9201, 9202].map(id => this.adapter.getBody(id) ?? null),
        entityCount: this.adapter.entityCount, contactCount: this.adapter.contactCount,
        contactBeginEvents: this.adapter.contactBeginEvents, contactEndEvents: this.adapter.contactEndEvents,
        listenerCount: this.adapter.listenerCount, stepCount: this.adapter.stepCount };
      task.result.status = 'FAIL'; task.result.failure = `TIMEOUT_${task.phase}`; this.finishContactMatrix(); return;
    }
    const contacts = this.adapter.getContacts();
    const radius = AppRuntime.rules!.ingredients[0].radius_du;
    const bottom = this.adapter.cupSegments.find(s => s.kind === 'bottom')!;
    if (task.phase === 'PAIR_BEGIN' && contacts.some(c => c.firstId === task.pairA && c.secondId === task.pairB)) {
      task.result.pairBegin = { contactCount: this.adapter.contactCount, beginEvents: this.adapter.contactBeginEvents };
      task.pairEndStart = this.adapter.contactEndEvents;
      const maxSpeed = AppRuntime.rules!.physics.max_linear_speed * AppRuntime.rules!.viewport.du_per_spec_physics_unit;
      this.adapter.setBodyVelocityForTest(task.pairB, { x: maxSpeed, y: 0 });
      task.phase = 'PAIR_END'; task.deadlineTick = tick + 120; return;
    }
    if (task.phase === 'PAIR_END' && !contacts.some(c => c.firstId === task.pairA && c.secondId === task.pairB) && this.adapter.contactEndEvents > task.pairEndStart) {
      task.result.pairEnd = { endEvents: this.adapter.contactEndEvents - task.pairEndStart, contactCount: this.adapter.contactCount };
      const left = this.adapter.cupSegments.find(s => s.kind === 'left')!; const radius = AppRuntime.rules!.ingredients[0].radius_du;
      const bottom = this.adapter.cupSegments.find(s => s.kind === 'bottom')!;
      const slope = (left.innerEnd.x - left.innerStart.x) / (left.innerEnd.y - left.innerStart.y);
      const cornerY = bottom.innerStart.y + radius - 0.2;
      const leftFaceX = left.innerStart.x + slope * (cornerY - left.innerStart.y);
      const cornerX = leftFaceX + (radius - 0.2) * Math.sqrt(1 + slope * slope);
      this.adapter.createBody({ entityId: task.corner, level: 1, radiusDu: radius,
        positionDu: { x: cornerX, y: cornerY },
        velocityDuPerSecond: { x: 0, y: 0 } });
      task.phase = 'CORNER_END_WAIT'; task.deadlineTick = tick + 120; return;
    }
    if (task.phase === 'CORNER_END_WAIT') {
      const cornerContacts = contacts.filter(c => c.firstId === task.corner && c.secondId === null).map(c => c.contactId);
      const bySegment = new Set(cornerContacts.map(x => x.split('cup:')[1]));
      if (bySegment.has('0') && bySegment.has('1')) {
        task.result.cornerContacts = { contactIds: cornerContacts, distinctCupSegments: Array.from(bySegment), contactCount: this.adapter.contactCount };
        task.pairEndStart = this.adapter.contactEndEvents;
        const maxSpeed = AppRuntime.rules!.physics.max_linear_speed * AppRuntime.rules!.viewport.du_per_spec_physics_unit;
        this.adapter.setBodyVelocityForTest(task.corner, { x: maxSpeed, y: 0 });
        task.phase = 'CORNER_RELEASE_WAIT'; task.deadlineTick = tick + 120; return;
      }
    }
    if (task.phase === 'CORNER_RELEASE_WAIT') {
      const current = this.adapter.getContacts().filter(c => c.firstId === task.corner && c.secondId === null);
      const hasLeft = current.some(c => c.contactId.endsWith('cup:1'));
      const hasBottom = current.some(c => c.contactId.endsWith('cup:0'));
      if (!hasLeft && hasBottom && this.adapter.contactEndEvents > task.pairEndStart) {
        task.result.cornerEnd = { ended: 'left', retained: 'bottom', contactIds: current.map(c => c.contactId),
          endEvents: this.adapter.contactEndEvents - task.pairEndStart };
        task.pairEndStart = this.adapter.contactBeginEvents;
        this.adapter.createBody({ entityId: 9201, level: 1, radiusDu: AppRuntime.rules!.ingredients[0].radius_du,
          positionDu: { x: AppRuntime.rules!.cup.center_x_du - radius + 0.5, y: 850 }, velocityDuPerSecond: { x: 0, y: 0 } });
        this.adapter.createBody({ entityId: 9202, level: 1, radiusDu: AppRuntime.rules!.ingredients[0].radius_du,
          positionDu: { x: AppRuntime.rules!.cup.center_x_du + radius - 0.5, y: 850 }, velocityDuPerSecond: { x: 0, y: 0 } });
        task.phase = 'OTHER_BEGIN'; task.deadlineTick = tick + 120; return;
      }
    }
    if (task.phase === 'OTHER_BEGIN' && contacts.some(c => c.firstId === 9201 && c.secondId === 9202)) {
      task.result.otherPairBeforeDestroy = { contactIds: this.adapter.getContacts().map(c => c.contactId), beginEvents: this.adapter.contactBeginEvents };
      task.oldAdapter = this.adapter; task.oldWorld = this.world; this.adapter.destroyBody(task.corner);
      const afterDestroyContacts = this.adapter.getContacts().map(c => c.contactId);
      task.result.destroyCleanup = { bodyCount: this.adapter.entityCount, contactCount: this.adapter.contactCount,
        listenerCount: this.adapter.listenerCount, otherPairSurvives: afterDestroyContacts.includes('9201|9202'), contactIds: afterDestroyContacts };
      task.phase = 'STALE'; task.deadlineTick = tick + 1; return;
    }
    if (task.phase === 'STALE') {
      const old = task.oldAdapter!; const oldBefore = { begins: old.contactBeginEvents, ends: old.contactEndEvents };
      old.dispose(); task.oldWorld!.destroy(); const stale = old.replayStaleContactCallbacksForTest();
      this.createEmptyWorldForTest();
      this.adapter.createBody({ entityId: task.pairA, level: 1, radiusDu: AppRuntime.rules!.ingredients[0].radius_du,
        positionDu: { x: AppRuntime.rules!.cup.center_x_du - 50, y: 600 }, velocityDuPerSecond: { x: 0, y: 0 } });
      const current = { contacts: this.adapter.contactCount, owners: this.adapter.listenerCount };
      const replayAgain = old.replayStaleContactCallbacksForTest();
      task.result.destroyCleanup = { ...(task.result.destroyCleanup as object), staleCallbackReplay: stale, oldEventCountsUnchanged: stale.beginEvents === oldBefore.begins && stale.endEvents === oldBefore.ends,
        replayAfterIdReuse: replayAgain, newWorldUnaffected: current.contacts === this.adapter.contactCount && current.owners === this.adapter.listenerCount };
      const cornerEnd = task.result.cornerEnd as { ended?: string; retained?: string } | undefined;
      const cleanup = task.result.destroyCleanup as any;
      task.result.status = (task.result.pairBegin && task.result.pairEnd && task.result.cornerContacts &&
        cornerEnd?.ended === 'left' && cornerEnd.retained === 'bottom' && task.result.otherPairBeforeDestroy &&
        cleanup.bodyCount === 4 && cleanup.contactCount === 1 && cleanup.otherPairSurvives === true && cleanup.listenerCount === 7 &&
        cleanup.oldEventCountsUnchanged === true && cleanup.newWorldUnaffected === true &&
        stale.colliderOwners === 0 && replayAgain.colliderOwners === 0) ? 'PASS' : 'FAIL';
      task.phase = 'DONE'; this.finishContactMatrix();
    }
  }

  private finishContactMatrix(): void {
    const task = this.contactMatrixTask; if (!task || task.phase === 'DONE' && task.result.emitted) return;
    task.phase = 'DONE'; task.result.emitted = true;
    this.pauseGate.hold('SAMPLE_COMPLETE'); this.clock.pause();
    console.info(JSON.stringify({ test: 'contact-matrix-result', ...task.result }));
  }
  runSingleFall(): void {
    this.clearAndRebuild(); this.message = '自由落体：1级圆从 y=1130DU 释放，无接触区';
    const entityId = this.spawn(1, 375, 1130); this.adapter.setLinearDampingForTest(entityId, 0);
    this.gravityProbe = { entityId, initialY: 1130, samples: new Set() };
  }
  spawnThree(): void {
    this.clearAndRebuild();
    [1100, 1170, 1240].forEach(y => this.spawn(3, AppRuntime.rules!.cup.center_x_du, y));
    this.message = '三圆堆积试验：同级圆从杯口上方无重叠释放';
  }
  startLevelDropForTest(level: number): number {
    if (!Number.isInteger(level) || !AppRuntime.rules!.ingredients.some(item => item.level === level)) throw new Error(`Unknown level: ${level}`);
    if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE'))
      throw new Error('Independent level drop requires a visible lab without another pause owner');
    this.pauseGate.release('SAMPLE_COMPLETE'); this.clearAndRebuild();
    const id = this.spawn(level, AppRuntime.rules!.cup.center_x_du, AppRuntime.rules!.cup.spawn_y_du);
    this.message = `独立尺寸试验：第${level}级，实际半径${AppRuntime.rules!.ingredients.find(item => item.level === level)!.radius_du}DU`;
    return id;
  }
  spawnNineSizes(): void {
    if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE'))
      throw new Error('Nine-size queue requires a visible lab without another pause owner');
    this.pauseGate.release('SAMPLE_COMPLETE');
    this.clearAndRebuild();
    if (this.pauseGate.canAdvance && this.clock.paused) this.clock.resume();
    const generation = this.rebuildGeneration;
    const queueGeneration = ++this.queueGeneration;
    const taskId = `nine-${Date.now()}-${queueGeneration}`;
    this.queueLedger = new NineSizeQueueLedger(taskId);
    const items = AppRuntime.rules!.ingredients.slice().sort((a, b) => a.level - b.level);
    let index = 0; let levelFailureRound = 0; let pendingSpawn: { level: number; x: number } | null = null;
    const dropNext = () => {
      if (!this.isValid || generation !== this.rebuildGeneration || queueGeneration !== this.queueGeneration || this.queueState?.state !== 'RUNNING') return;
      if (pendingSpawn) {
        if (this.clock.paused || AppRuntime.backgrounded) { this.scheduleQueueCallback(() => dropNext(), 0.25); return; }
        this.spawn(pendingSpawn.level, pendingSpawn.x, AppRuntime.rules!.cup.spawn_y_du); pendingSpawn = null; index++; levelFailureRound = 0;
        this.message = `九种尺寸试验：已生成${index}/9级`;
        this.scheduleQueueCallback(() => dropNext(), 1); return;
      }
      if (index >= items.length) {
        this.queueLedger!.complete(); this.message = '九种尺寸试验：九级对象均已依次生成';
        console.log(JSON.stringify({ test: 'nine-size-queue', taskId, state: this.queueState.state, batches: this.queueState.records })); return;
      }
      const item = items[index];
      this.queueState!.level = item.level;
      const minX = AppRuntime.rules!.cup.center_x_du - AppRuntime.rules!.cup.top_width_du / 2;
      const maxX = AppRuntime.rules!.cup.center_x_du + AppRuntime.rules!.cup.top_width_du / 2;
      const candidates = [AppRuntime.rules!.cup.center_x_du, minX + item.radius_du + 4,
        maxX - item.radius_du - 4, AppRuntime.rules!.cup.center_x_du - 70, AppRuntime.rules!.cup.center_x_du + 70];
      const batch = this.queueLedger!.tryCandidates(item.level, candidates, value => this.adapter.spawnRejectionReason(item.level, value));
      const x = batch.acceptedX;
      if (x === null) {
        levelFailureRound = batch.failureRounds;
        if (batch.terminal) {
          const result = { test: 'nine-size-queue', taskId, state: this.queueState.state, level: item.level,
            levelFailureRounds: levelFailureRound, totalBatches: this.queueState.batchAttempt, candidatesPerRound: candidates.length, records: this.queueState.records };
          this.message = `九种尺寸任务终止：第${item.level}级120轮候选均拒绝`;
          console.log(JSON.stringify(result));
        } else {
          this.message = `九种尺寸试验：等待投放空间（第${item.level}级，失败轮${levelFailureRound}/120）`;
          this.scheduleQueueCallback(() => dropNext(), 0.25);
        }
        return;
      }
      if (this.clock.paused || AppRuntime.backgrounded) { pendingSpawn = { level: item.level, x }; this.scheduleQueueCallback(() => dropNext(), 0.25); return; }
      this.spawn(item.level, x, AppRuntime.rules!.cup.spawn_y_du);
      index++; levelFailureRound = 0;
      this.message = `九种尺寸试验：已生成${index}/9级`;
      this.scheduleQueueCallback(() => dropNext(), 1);
    };
    dropNext();
  }
  pressureTest(): void {
    this.startPressureTest('original');
  }

  startPressureTest(layout: 'original' | 'strict' | 'mixed' = 'original'): void {
    if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE'))
      throw new Error('Pressure test requires a visible lab without another pause owner');
    this.pauseGate.release('SAMPLE_COMPLETE');
    this.clearAndRebuild();
    if (this.pauseGate.canAdvance && this.clock.paused) this.clock.resume();
    const rules = AppRuntime.rules!; const radius = rules.ingredients[0].radius_du; let count = 0;
    if (layout === 'mixed') {
      // Fixed 24-body level-1..4 layout used by the 2026-10-28 historical mixed-stack run.
      for (let row = 0; row < 6; row++) for (let col = 0; col < 4; col++) {
        this.spawn((row + col) % 4 + 1, 240 + 90 * col, 350 + 90 * row); count++;
      }
    } else {
      const spacing = radius * 2 + 1; const slope = (rules.cup.top_width_du - rules.cup.bottom_width_du)
        / (2 * (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du));
      const strictOffset = layout === 'strict' ? radius * (Math.sqrt(1 + slope * slope) - 1) : 0;
      for (let row = 0; row < 20; row++) {
        const y = rules.cup.inner_bottom_y_du + radius + row * spacing;
        const t = (y - rules.cup.inner_bottom_y_du) / (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du);
        const width = rules.cup.bottom_width_du + (rules.cup.top_width_du - rules.cup.bottom_width_du) * t;
        const stagger = row % 2 ? spacing / 2 : 0;
        const columns = Math.floor((width - radius * 2 - stagger) / spacing) + 1;
        const firstX = rules.cup.center_x_du - width / 2 + radius + stagger + strictOffset;
        for (let col = 0; col < columns; col++) {
          let x = firstX + col * spacing;
          if (strictOffset > 0) x += x < rules.cup.center_x_du ? strictOffset : x > rules.cup.center_x_du ? -strictOffset : 0;
          this.spawn(1, x, y); count++;
        }
      }
    }
    const preflight = this.runLayoutPreflight(`${layout}-${count}`);
    (globalThis as any).__p1aLabPreflight = preflight;
    console.info(JSON.stringify({ test: 'pressure-layout-preflight', buildId: this.probe.identity.buildId,
      attemptId: this.probe.identity.attemptId, layout, ...preflight }));
    if (layout !== 'mixed' && count !== 220) { this.message = `压力布局生成失败：预期220体，实际${count}`; return; }
    if (layout === 'mixed' && count !== 24) { this.message = `混合布局生成失败：预期24体，实际${count}`; return; }
    this.probe.beginContinuousTest(count, 600, 3600, 60000);
    this.message = layout === 'mixed' ? `混合压力堆：${count}个1～4级圆，固定历史坐标布局` : `压力堆积：${count}个一级圆，布局=${layout}`;
  }

  private runLayoutPreflight(layoutId: string): Record<string, unknown> {
    const bodies: Array<{ id: number; r: number; x: number; y: number }> = [];
    this.adapter.visitBodySamples((id, r, x, y) => bodies.push({ id, r, x, y }));
    bodies.sort((a, b) => a.id - b.id);
    const sample = new Float64Array(5); const minima = { leftFace: Infinity, rightFace: Infinity, bottomFace: Infinity,
      leftBox: Infinity, rightBox: Infinity, bottomBox: Infinity, leftEndpoint: Infinity, rightEndpoint: Infinity, bottomEndpoint: Infinity };
    const witnesses: Record<string, { id: number; x: number; y: number; segment: string; marginDu: number }> = {};
    let nonFinite = 0; let pairsOverlapping = 0; let minPairGap = Infinity;
    const segments = this.adapter.cupSegments;
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i]; if (![body.id, body.r, body.x, body.y].every(Number.isFinite)) { nonFinite++; continue; }
      for (let s = 0; s < segments.length; s++) {
        const segment = segments[s]; sampleCupSegmentSweep(segment, body.x, body.y, body.x, body.y, body.r, false, sample);
        const prefix = segment.kind === 'left' ? 'left' : segment.kind === 'right' ? 'right' : 'bottom';
        const faceKey = `${prefix}Face`; const boxKey = `${prefix}Box`; const endpointKey = `${prefix}Endpoint`;
        if (sample[0] < minima[faceKey as keyof typeof minima]) { minima[faceKey as keyof typeof minima] = sample[0]; witnesses[faceKey] = { id: body.id, x: body.x, y: body.y, segment: segment.kind, marginDu: sample[0] }; }
        if (sample[1] < minima[boxKey as keyof typeof minima]) { minima[boxKey as keyof typeof minima] = sample[1]; witnesses[boxKey] = { id: body.id, x: body.x, y: body.y, segment: segment.kind, marginDu: sample[1] }; }
        if (sample[2] < minima[endpointKey as keyof typeof minima]) { minima[endpointKey as keyof typeof minima] = sample[2]; witnesses[endpointKey] = { id: body.id, x: body.x, y: body.y, segment: segment.kind, marginDu: sample[2] }; }
      }
      for (let j = 0; j < i; j++) {
        const other = bodies[j]; const gap = Math.hypot(body.x - other.x, body.y - other.y) - body.r - other.r;
        minPairGap = Math.min(minPairGap, gap); if (gap < 0) pairsOverlapping++;
      }
    }
    let hash = 2166136261;
    for (const b of bodies) for (const char of `${b.id},${b.r.toFixed(6)},${b.x.toFixed(6)},${b.y.toFixed(6)};`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return { layoutId, entityCount: bodies.length, layoutHashFNV1a: (hash >>> 0).toString(16).padStart(8, '0'),
      minimumMarginsDu: minima, minimumMarginWitnesses: witnesses, negativeMarginInterpretation: {
        face: 'negative means the circle center is closer to the finite inner face than its radius; indicates initial penetration of that face',
        wallBox: 'negative means circle intersects the finite wall box, including its half-thickness',
        endpoint: 'negative means circle intersects a finite collider endpoint cap',
        pairGap: 'negative means two initial circle centers overlap by the absolute gap' },
      nonFinite, overlappingPairs: pairsOverlapping, minimumPairGapDu: minPairGap,
      coordinates: bodies.map(b => [b.id, b.r, b.x, b.y]) };
  }
  compareRenderRate(hz: 30 | 60): void { this.renderHz = hz; game.setFrameRate(hz); this.message = `渲染帧率设为${hz}fps；物理仍为${AppRuntime.rules!.physics.fixed_hz}Hz`; }
  runFixedStepSample(): void {
    if (!this.ready || AppRuntime.backgrounded || this.gallery || this.pauseGate.has('REBUILD') || this.pauseGate.has('ERROR')) {
      this.message = '当前不能启动固定步采样'; return;
    }
    // V is an explicit new sample attempt; it may clear only prior user/sample/backlog boundaries.
    this.pauseGate.clear('MANUAL', 'BACKLOG', 'RESUME_REQUIRED', 'SAMPLE_COMPLETE');
    this.runSingleFall(); this.clock.pause();
    const generation = this.rebuildGeneration;
    const pauseGeneration = this.pauseGeneration;
    this.cadenceProbe = { entityId: this.gravityProbe!.entityId, renderHz: this.renderHz, frames: 0, renderSeconds: 0 };
    this.message = `${this.renderHz}fps 对照：运行120个物理tick后自动暂停，结果写入控制台`;
    this.scheduleOnce(() => {
      if (this.isValid && generation === this.rebuildGeneration && pauseGeneration === this.pauseGeneration
        && !AppRuntime.backgrounded && !this.gallery && this.pauseGate.canAdvance) this.clock.resume();
    }, 1 / AppRuntime.rules!.physics.fixed_hz);
  }
  runNarrowestCup(): void {
    if (!this.ready || AppRuntime.backgrounded || this.gallery || !this.pauseGate.canAdvance && !this.pauseGate.has('SAMPLE_COMPLETE'))
      throw new Error('Narrow-cup test requires a visible lab without another pause owner');
    this.pauseGate.release('SAMPLE_COMPLETE');
    this.clearAndRebuild();
    const rules = AppRuntime.rules!;
    const narrowest = rules.stages.reduce((best, stage) => stage.cup_width_scale < best.cup_width_scale ? stage : best);
    const largest = rules.ingredients.reduce((best, item) => item.radius_du > best.radius_du ? item : best);
    this.adapter.createCup(narrowest.id); this.applyCupWidthScale(narrowest.cup_width_scale);
    this.spawn(largest.level, rules.cup.center_x_du, rules.cup.spawn_y_du); this.drawCup();
    this.message = `最窄杯物理试验：宽度倍率${narrowest.cup_width_scale}，最高级半径${largest.radius_du}DU`;
  }
  private sampleCadence(tick: number): void {
    if (!this.cadenceProbe || tick !== 120) return;
    console.log(JSON.stringify({ test: 'fixed-step-120', requestedRenderHz: this.cadenceProbe.renderHz,
      measuredRenderHz: this.cadenceProbe.frames / this.cadenceProbe.renderSeconds,
      renderFrames: this.cadenceProbe.frames, renderSeconds: this.cadenceProbe.renderSeconds,
      tick, physicsStepCalls: this.adapter.stepCount, state: this.adapter.getBody(this.cadenceProbe.entityId),
      configVersion: AppRuntime.rules!.design_rules_version, ptmRatio: AppRuntime.mapper!.cocosPtmRatio }));
    this.cadenceProbe = null; this.pauseGate.hold('SAMPLE_COMPLETE'); this.clock.pause(); this.message = '120个物理tick采样完成，已暂停；控制台有实际刚体状态';
  }
  private spawn(level: number, xDu: number, yDu: number): number {
    const item = AppRuntime.rules!.ingredients.find(value => value.level === level);
    if (!item) throw new Error(`Unknown level ${level}`);
    const id = this.nextEntityId++;
    this.adapter.createBody({ entityId: id, level: item.level as Level, radiusDu: item.radius_du, positionDu: { x: xDu, y: yDu }, velocityDuPerSecond: { x: 0, y: 0 } });
    const edge = ArtCatalog.ingredientEdgeDu(item.radius_du);
    const visual = this.art.createSprite(this.world, ArtCatalog.ingredientId(item.id), edge, edge);
    visual.name = `IngredientVisual-${id}`;
    visual.setPosition(xDu - AppRuntime.rules!.viewport.width_du / 2, yDu - AppRuntime.rules!.viewport.height_du / 2, 0);
    this.visuals.set(id, visual);
    this.visualRadii.set(id, item.radius_du);
    return id;
  }
  private scheduleQueueCallback(callback: () => void, delaySeconds: number): void {
    if (this.queueCallback) this.unschedule(this.queueCallback);
    const owned = () => { if (this.queueCallback === owned) this.queueCallback = null; callback(); };
    this.queueCallback = owned; this.scheduleOnce(owned, delaySeconds);
  }
  private cancelQueue(reason: string): void {
    const current = this.queueState;
    if (this.queueCallback) { this.unschedule(this.queueCallback); this.queueCallback = null; }
    if (current?.state !== 'RUNNING') return;
    this.queueLedger?.cancel(); this.queueGeneration++;
    console.log(JSON.stringify({ test: 'nine-size-queue', taskId: current.taskId, state: 'CANCELLED', reason,
      level: current.level, batchAttempt: current.batchAttempt, records: current.records }));
  }
  private sampleGravity(tick: number): void {
    const probe = this.gravityProbe;
    if (!probe || (tick !== 30 && tick !== 60) || probe.samples.has(tick)) return;
    const state = this.adapter.getBody(probe.entityId); if (!state) return;
    probe.samples.add(tick);
    const seconds = tick / AppRuntime.rules!.physics.fixed_hz;
    console.log(JSON.stringify({ test: 'gravity-free-fall', tick, seconds, initialYDu: probe.initialY,
      actualYDu: state.positionDu.y, actualDisplacementDu: probe.initialY - state.positionDu.y,
      actualVelocityDuPerSecond: state.velocityDuPerSecond.y,
      theoreticalDisplacementDu: 0.5 * Math.abs(AppRuntime.rules!.physics.gravity.y) * AppRuntime.rules!.viewport.du_per_spec_physics_unit * seconds * seconds,
      enginePtmRatio: AppRuntime.mapper!.cocosPtmRatio }));
  }
  private syncViews(): void {
    for (const [id, view] of this.visuals) {
      const state = this.adapter.getBody(id);
      if (!state) { view.destroy(); this.visuals.delete(id); this.visualRadii.delete(id); continue; }
      view.setPosition(state.positionDu.x - AppRuntime.rules!.viewport.width_du / 2, state.positionDu.y - AppRuntime.rules!.viewport.height_du / 2, 0);
      view.angle = state.angleRadians * 180 / Math.PI;
    }
    if (this.showBounds) this.drawCup();
  }
  private drawCup(): void {
    const rules = AppRuntime.rules!; const cup = rules.cup;
    const shape = CupGeometry.build({ centerXDu: cup.center_x_du, bottomYDu: cup.inner_bottom_y_du, topYDu: cup.inner_top_y_du,
      bottomWidthDu: cup.bottom_width_du, topWidthDu: cup.top_width_du, widthScale: this.cupWidthScale });
    const g = this.graphics; g.clear(); g.lineWidth = 5; g.strokeColor = new Color(70, 46, 35, 255);
    const toLocal = (x: number, y: number) => new Vec2(x - rules.viewport.width_du / 2, y - rules.viewport.height_du / 2);
    if (this.showBounds) {
    g.moveTo(toLocal(shape.leftBottom.x, shape.leftBottom.y).x, toLocal(shape.leftBottom.x, shape.leftBottom.y).y);
    g.lineTo(toLocal(shape.leftTop.x, shape.leftTop.y).x, toLocal(shape.leftTop.x, shape.leftTop.y).y);
    g.moveTo(toLocal(shape.rightBottom.x, shape.rightBottom.y).x, toLocal(shape.rightBottom.x, shape.rightBottom.y).y);
    g.lineTo(toLocal(shape.rightTop.x, shape.rightTop.y).x, toLocal(shape.rightTop.x, shape.rightTop.y).y);
    g.moveTo(toLocal(shape.leftBottom.x, shape.leftBottom.y).x, toLocal(shape.leftBottom.x, shape.leftBottom.y).y);
    g.lineTo(toLocal(shape.rightBottom.x, shape.rightBottom.y).x, toLocal(shape.rightBottom.x, shape.rightBottom.y).y); g.stroke();
      for (const [id] of this.visuals) {
        const state = this.adapter.getBody(id); if (!state) continue;
        const bodyRadius = this.visualRadii.get(id); if (!bodyRadius) continue;
        const p = toLocal(state.positionDu.x, state.positionDu.y); g.circle(p.x, p.y, bodyRadius); g.stroke();
      }
    }
    const dangerY = cup.danger_line_y_du - rules.viewport.height_du / 2;
    g.lineWidth = 1; g.strokeColor = new Color(220, 75, 70, 180);
    g.moveTo(-rules.viewport.width_du / 2, dangerY); g.lineTo(rules.viewport.width_du / 2, dangerY); g.stroke();
  }
  private createOverlay(): void {
    if (!this.node.isValid || this.diagnostics?.node.isValid) return;
    const overlay = new Node('PhysicsLabDiagnostics'); this.node.addChild(overlay);
    const ui = overlay.addComponent(UITransform); ui.setContentSize(720, 260);
    this.diagnostics = overlay.addComponent(Label); this.diagnostics.fontSize = 18; this.diagnostics.lineHeight = 23;
    this.diagnostics.overflow = Label.Overflow.CLAMP; this.diagnostics.enableWrapText = true;
    overlay.setPosition(new Vec3(-8, 535, 0));
    this.createTouchControls();
  }
  private createTouchControls(): void {
    this.touchControls?.destroy();
    const root = this.touchControls = new Node('P1TouchControls'); this.node.addChild(root);
    const viewportScale = Math.min(view.getScaleX(), view.getScaleY());
    const compactScale = viewportScale < 0.35 ? 44 / (96 * viewportScale) : 1;
    root.setScale(compactScale, compactScale, 1);
    const actions: Array<[string, number, number, () => void]> = [
      ['P', -180, viewportScale < 0.35 ? -205 / compactScale : -500, () => this.pause()],
      ['R', -60, viewportScale < 0.35 ? -205 / compactScale : -500, () => this.resume()],
      ['3', 60, viewportScale < 0.35 ? -205 / compactScale : -500, () => this.spawnNineSizes()],
      ['4', 180, viewportScale < 0.35 ? -205 / compactScale : -500, () => this.startPressureTest('original')],
      ['N', -180, viewportScale < 0.35 ? -300 / compactScale : -610, () => this.runNarrowestCup()],
      ['G', -60, viewportScale < 0.35 ? -300 / compactScale : -610, () => this.toggleGallery()],
      ['‹', 60, viewportScale < 0.35 ? -300 / compactScale : -610, () => this.gallery?.turn(-1)],
      ['›', 180, viewportScale < 0.35 ? -300 / compactScale : -610, () => this.gallery?.turn(1)]
    ];
    actions.forEach(([text, x, y, activate]) => {
      const button = new Node(`Touch-${text}`); root.addChild(button); button.setPosition(x, y, 0);
      button.addComponent(UITransform).setContentSize(100, 96); button.addComponent(BlockInputEvents);
      const background = button.addComponent(Graphics); background.fillColor = new Color(253, 246, 230, 242);
      background.roundRect(-48, -46, 96, 92, 12); background.fill();
      const labelNode = new Node('TouchLabel'); button.addChild(labelNode);
      labelNode.addComponent(UITransform).setContentSize(100, 96);
      const label = labelNode.addComponent(Label); label.string = text; label.fontSize = 30; label.lineHeight = 36;
      label.color = new Color(61, 42, 35); label.overflow = Label.Overflow.CLAMP;
      button.on(Node.EventType.TOUCH_END, (event: any) => { event.propagationStopped = true; activate(); }, this);
    });
  }
  private refreshDiagnostics(): void {
    if (!this.diagnostics?.isValid) return;
    this.hudRefreshMs += Math.max(0, this.clock?.stepSeconds ?? 1 / 60) * 1000;
    if (this.diagnostics.string === this.lastHudText && this.hudRefreshMs < 100) return;
    this.hudRefreshMs = 0;
    const tick = this.clock?.tick ?? 0; const entities = this.adapter?.entityCount ?? 0;
    this.diagnostics.color = this.ready ? new Color(61, 42, 35) : new Color(255, 255, 255);
    this.lastHudText = `PhysicsLab · ${this.message}\nTick ${tick} | 实体 ${entities} | 接触 ${this.adapter?.contactCount ?? 0} | 监听 ${this.adapter?.listenerCount ?? 0} | 贴图 ${this.art.loadedCount} | 渲染 ${this.renderHz}fps / 物理 60Hz\n[1]单圆 [2]三圆 [3]九尺寸 [4]压力 [5]30fps [6]60fps [V]120tick [N]最窄杯 [P]暂停 [R]恢复 [C]重建 [X]20次 [B]碰撞线 [G]素材 [T]重试`;
    this.diagnostics.string = this.lastHudText;
  }
  private disposeViews(): void { for (const node of this.visuals.values()) if (node.isValid) node.destroy(); this.visuals.clear(); this.visualRadii.clear(); }
  private createSceneArt(): void {
    const rules = AppRuntime.rules!;
    this.cupSprites = [];
    this.rearArt = new Node('BackgroundAndCupRear'); this.node.addChild(this.rearArt); this.rearArt.setSiblingIndex(0);
    this.frontArt = new Node('CupFrontAndDiagnostics'); this.node.addChild(this.frontArt); this.frontArt.setSiblingIndex(1);
    this.art.createSprite(this.rearArt, 'bg_shop_base', rules.viewport.width_du, rules.viewport.height_du);
    const shadow = this.art.createSprite(this.rearArt, 'spr_cup_shadow', 512, 128);
    shadow.setPosition(rules.cup.center_x_du - rules.viewport.width_du / 2, rules.cup.inner_bottom_y_du - 30 - rules.viewport.height_du / 2, 0);
    const layer = (parent: Node, suffix: string) => {
      const assetId = `spr_cup_classic_${suffix}`;
      const size = this.art.catalog.select(assetId, 1000).size;
      const sprite = this.art.createSprite(parent, assetId, size[0], size[1]);
      this.cupSprites.push(sprite);
      sprite.setPosition(-rules.viewport.width_du / 2, 200 - rules.viewport.height_du / 2, 0);
    };
    ['back', 'tea', 'rim_back'].forEach(suffix => layer(this.rearArt, suffix));
    ['front', 'rim_front', 'base', 'label'].forEach(suffix => layer(this.frontArt, suffix));
    const bounds = new Node('PhysicsDebugBounds'); this.frontArt.addChild(bounds); this.graphics = bounds.addComponent(Graphics);
  }
  private applyCupWidthScale(scale: number): void {
    this.cupWidthScale = scale;
    for (const sprite of this.cupSprites) {
      sprite.setScale(scale, 1, 1);
      sprite.setPosition(-AppRuntime.rules!.viewport.width_du / 2 * scale, 200 - AppRuntime.rules!.viewport.height_du / 2, 0);
    }
  }
  private toggleGallery(): void {
    if (this.gallery) {
      this.gallery.close(); this.gallery = null;
      if (this.touchControls?.isValid) this.touchControls.active = true;
      if (this.diagnostics?.isValid) this.diagnostics.node.active = true;
      this.pauseGate.release('GALLERY');
      if (this.resumeAfterGallery && this.galleryPauseSerial === this.pauseGate.interruptionSerial
        && this.clock?.paused && this.pauseGate.canAdvance && !AppRuntime.backgrounded) this.clock.resume();
      this.resumeAfterGallery = false;
      return;
    }
    this.resumeAfterGallery = !this.clock.paused && this.pauseGate.canAdvance;
    this.pauseGate.hold('GALLERY'); this.galleryPauseSerial = this.pauseGate.interruptionSerial; this.clock.pause();
    if (this.touchControls?.isValid) this.touchControls.active = false;
    if (this.diagnostics?.isValid) this.diagnostics.node.active = false;
    this.gallery = new ArtGallery(this.node, this.art, () => this.toggleGallery());
  }
  private onLifecycleState(state: HostLifecycleSnapshot): void {
    if (state.backgrounded) {
      this.resumeAfterGallery = false;
      this.pauseGate.hold('BACKGROUND'); this.pauseGate.hold('RESUME_REQUIRED'); this.clock?.pause();
      this.message = '已暂停：宿主隐藏；返回后按 R 显式恢复';
    } else {
      this.pauseGate.release('BACKGROUND');
      if (this.ready && this.clock?.paused) this.message = '宿主已显示；物理保持暂停，请按 R 恢复';
    }
  }
  private pauseReasonMask(): number { return this.pauseGate.mask(); }

  private debugSnapshot(): Record<string, unknown> {
    const bodies: number[][] = [];
    if (this.adapter) this.adapter.visitBodySamples((id, r, x, y, vx, vy, awake) => bodies.push([id, r, x, y, vx, vy, awake ? 1 : 0]));
    return { buildId: this.probe.identity.buildId, attemptId: this.probe.identity.attemptId, ready: this.ready,
      tick: this.clock?.tick ?? -1, stepCount: this.adapter?.stepCount ?? -1, paused: this.clock?.paused ?? true,
      worldId: this.probe.identity.worldId,
      pauseReasons: this.pauseGate.snapshot(), interruptionSerial: this.pauseGate.interruptionSerial,
      entityCount: this.adapter?.entityCount ?? 0, contactCount: this.adapter?.contactCount ?? 0,
      contactBeginEvents: this.adapter?.contactBeginEvents ?? 0, contactEndEvents: this.adapter?.contactEndEvents ?? 0,
      listenerCount: this.adapter?.listenerCount ?? 0, bodies, contacts: this.adapter?.getContacts() ?? [],
      config: AppRuntime.rules ? { levelRadii: AppRuntime.rules.ingredients.map(item => ({ level: item.level, radiusDu: item.radius_du })),
        cupWidthScales: AppRuntime.rules.stages.map(stage => ({ id: stage.id, scale: stage.cup_width_scale })),
        cupSegments: this.adapter?.cupSegments.map(segment => ({ kind: segment.kind, innerStart: segment.innerStart, innerEnd: segment.innerEnd,
          outward: segment.outward, thicknessDu: segment.thicknessDu })) ?? [] } : null,
      queue: this.queueState ? { ...this.queueState, records: this.queueState.records.slice() } : null,
      contactRebuild: this.contactRebuildTask ? { attemptId: this.contactRebuildTask.attemptId, token: this.contactRebuildTask.token,
        interruptAt: this.contactRebuildTask.interruptAt, round: this.contactRebuildTask.round, phase: this.contactRebuildTask.phase,
        status: this.contactRebuildTask.status, failure: this.contactRebuildTask.failure,
        failureDiagnostics: this.contactRebuildTask.failureDiagnostics ?? null,
        records: this.contactRebuildTask.records.map(record => ({ ...record })) } : null,
      contactRebuildHistory: this.contactRebuildHistory.map(entry => ({ ...entry, records: entry.records.map(record => ({ ...record })) })),
      contactMatrix: this.contactMatrixTask ? { phase: this.contactMatrixTask.phase,
        result: JSON.parse(JSON.stringify(this.contactMatrixTask.result)) } : null,
      wallMatrix: this.wallMatrixTask ? { status: this.wallMatrixTask.status, phase: this.wallMatrixTask.phase,
        index: this.wallMatrixTask.index, caseCount: this.wallMatrixTask.cases.length, failure: this.wallMatrixTask.failure,
        records: this.wallMatrixTask.records.map(record => ({ ...record })) } : null,
      loadedArtVariants: this.art.loadedVariantSnapshot(), lifecycle: HostLifecycleCoordinator.snapshot(), probe: this.probe.export(), message: this.message };
  }
  private runtimeStatus(): Record<string, unknown> {
    return { buildId: this.probe.identity.buildId, attemptId: this.probe.identity.attemptId, ready: this.ready, loading: this.loading,
      tick: this.clock?.tick ?? -1, stepCount: this.adapter?.stepCount ?? -1, paused: this.clock?.paused ?? true,
      pauseReasons: this.pauseGate.snapshot(), interruptionSerial: this.pauseGate.interruptionSerial,
      entityCount: this.adapter?.entityCount ?? 0, contactCount: this.adapter?.contactCount ?? 0,
      contactBeginEvents: this.adapter?.contactBeginEvents ?? 0, contactEndEvents: this.adapter?.contactEndEvents ?? 0,
      listenerCount: this.adapter?.listenerCount ?? 0,
      engine: { cocos: (globalThis as any).cc?.ENGINE_VERSION ?? 'not-exposed',
        physicsBackend: PhysicsSystem2D.PHYSICS_BOX2D ? 'BOX2D' : PhysicsSystem2D.PHYSICS_BOX2D_WASM ? 'BOX2D_WASM' : 'OTHER',
        autoSimulation: PhysicsSystem2D.instance.autoSimulation, fixedTimeStep: PhysicsSystem2D.instance.fixedTimeStep,
        ptmRatio: AppRuntime.mapper?.cocosPtmRatio ?? null },
      levelRadii: AppRuntime.rules?.ingredients.map(item => ({ level: item.level, radiusDu: item.radius_du })) ?? [],
      cupWidthScale: this.cupWidthScale,
      queue: this.queueState ? { taskId: this.queueState.taskId, state: this.queueState.state, level: this.queueState.level,
        batchAttempt: this.queueState.batchAttempt, recordCount: this.queueState.records.length } : null,
      contactRebuild: this.contactRebuildTask ? { attemptId: this.contactRebuildTask.attemptId, round: this.contactRebuildTask.round,
        phase: this.contactRebuildTask.phase, status: this.contactRebuildTask.status, failure: this.contactRebuildTask.failure,
        failureDiagnostics: this.contactRebuildTask.failureDiagnostics ?? null,
        records: this.contactRebuildTask.records.map(record => ({ ...record })) } : null,
      contactRebuildHistory: this.contactRebuildHistory.map(entry => ({ attemptId: entry.attemptId, status: entry.status,
        failure: entry.failure, recordCount: entry.records.length })),
      contactMatrix: this.contactMatrixTask ? { phase: this.contactMatrixTask.phase, result: this.contactMatrixTask.result } : null,
      wallMatrix: this.wallMatrixTask ? { status: this.wallMatrixTask.status, phase: this.wallMatrixTask.phase,
        index: this.wallMatrixTask.index, caseCount: this.wallMatrixTask.cases.length, failure: this.wallMatrixTask.failure } : null,
      lifecycle: HostLifecycleCoordinator.snapshot(), message: this.message };
  }
  private onRetryTouch(): void { if (!this.ready && !this.loading) void this.initializeLab(); }
  private onKeyDown(event: any): void {
    if (!this.ready) { if (event.keyCode === KeyCode.KEY_T) void this.initializeLab(); return; }
    if (event.keyCode === KeyCode.KEY_G) { this.toggleGallery(); return; }
    if (this.gallery) {
      if (event.keyCode === KeyCode.ARROW_LEFT) this.gallery.turn(-1);
      if (event.keyCode === KeyCode.ARROW_RIGHT) this.gallery.turn(1);
      return;
    }
    switch (event.keyCode) {
      case KeyCode.KEY_B: this.showBounds = !this.showBounds; this.drawCup(); break;
      case KeyCode.KEY_V: this.runFixedStepSample(); break;
      case KeyCode.KEY_N: this.runNarrowestCup(); break;
      case KeyCode.DIGIT_1: this.runSingleFall(); break; case KeyCode.DIGIT_2: this.spawnThree(); break;
      case KeyCode.DIGIT_3: this.spawnNineSizes(); break; case KeyCode.DIGIT_4: this.pressureTest(); break;
      case KeyCode.DIGIT_5: this.compareRenderRate(30); break; case KeyCode.DIGIT_6: this.compareRenderRate(60); break;
      case KeyCode.KEY_P: this.pause(); break; case KeyCode.KEY_R: this.resume(); break;
      case KeyCode.KEY_C: this.clearAndRebuild(); break; case KeyCode.KEY_X: this.rebuildTwentyTimes(); break;
    }
  }
  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.ready && !this.loading && event.key.toLowerCase() === 't') {
      event.preventDefault();
      void this.initializeLab();
    }
  };
}
