import { CupSegment } from '../physics/CupGeometry';
import { CUP_PROBE_BOX, CUP_PROBE_ENDPOINT, CUP_PROBE_ESCAPE, CUP_PROBE_FACE, CUP_PROBE_SWEPT, sampleCupSegmentSweep } from '../physics/CupSweepProbe';

export type LabProbeMode = 'OFF' | 'TIMING' | 'SUMMARY' | 'LEGACY_COMPARE';
export type LabProbePhase = 'SETUP' | 'WARMUP' | 'OBSERVE' | 'FAILURE' | 'PAUSED' | 'COMPLETE';
export interface LabProbeIdentity { buildId: string; attemptId: string; probeVersion: string; worldId: number; cupScale: number }
export interface ProbeBodySource {
  visitBodySamples(visitor: (id: number, radiusDu: number, xDu: number, yDu: number, vxDu: number, vyDu: number, awake: boolean) => void): void;
  readonly cupSegments: readonly CupSegment[];
  readonly entityCount: number;
  readonly lastStepTimings: Readonly<{ syncToPhysics: number; physicsStep: number; syncFromPhysics: number; velocityClamp: number }>;
}
interface LegacyBodyRecord { id: number; radiusDu: number; xDu: number; yDu: number; vxDu: number; vyDu: number; sleeping: boolean }
interface LegacyStepRecord { tick: number; phase: LabProbePhase; bodies: LegacyBodyRecord[]; probeStepMs: number }
interface LegacyFrameRecord { wallGapMs: number; engineDtMs: number; steps: number; tickBefore: number; tickAfter: number; adapterMs: number; viewMs: number; labUpdateMs: number; visible: boolean; hasFocus: boolean }

/** Bounded, read-only frame and per-physics-step geometry recorder. It never advances or modifies physics. */
export class LabProbe {
  private static readonly FRAME_CAPACITY = 14400;
  private static readonly FRAME_WIDTH = 15;
  private static readonly STEP_CAPACITY = 256;
  private static readonly STEP_WIDTH = 21;
  private readonly frames = new Float64Array(LabProbe.FRAME_CAPACITY * LabProbe.FRAME_WIDTH);
  private readonly steps = new Float64Array(LabProbe.STEP_CAPACITY * LabProbe.STEP_WIDTH);
  private readonly previousX = new Float64Array(65536);
  private readonly previousY = new Float64Array(65536);
  private readonly previousValid = new Uint8Array(65536);
  private readonly currentBodies = new Float64Array(65536 * 6);
  private readonly sample = new Float64Array(5);
  private activeSource: ProbeBodySource | null = null;
  private minFaceLeft = 0; private minFaceRight = 0; private minFaceBottom = 0;
  private minBoxLeft = 0; private minBoxRight = 0; private minBoxBottom = 0;
  private minEndLeft = 0; private minEndRight = 0; private minEndBottom = 0;
  private escapeMask = 0; private badCount = 0;
  private readonly bodyVisitor = (id: number, radius: number, x: number, y: number, vx: number, vy: number, awake: boolean): void => this.sampleBody(id, radius, x, y, vx, vy, awake);
  private frameCount = 0;
  private frameCursor = 0;
  private frameOverflow = false;
  private stepCount = 0;
  private stepCursor = 0;
  private stepTotal = 0;
  private stepGaps = 0;
  private frameStart = 0;
  private frameWallGap = 0;
  private frameTickBefore = 0;
  private frameStepCount = 0;
  private frameObserveSteps = 0;
  private frameAdapterMs = 0;
  private lastFrameStart = 0;
  private lastStepTick = 0;
  private bodySampleCount = 0;
  private warmupTarget = 0;
  private observeTarget = 0;
  private minObserveMs = 0;
  private warmupSteps = 0;
  private observeSteps = 0;
  private observeStartMs = 0;
  private observeEndMs = 0;
  private activeObserveMs = 0;
  private expectedBodyCount = 0;
  private escapingCount = 0;
  private nonFiniteCount = 0;
  private negativeMarginTicks = new Uint32Array(9);
  private readonly minMargins = new Float64Array(9);
  private readonly legacySteps: LegacyStepRecord[] = [];
  private readonly legacyFrames: LegacyFrameRecord[] = [];
  private legacySummaryCache: Record<string, unknown> | null = null;
  private anomaly: Record<string, unknown> | null = null;
  private _phase: LabProbePhase = 'SETUP';
  mode: LabProbeMode = 'OFF';
  identity: LabProbeIdentity = { buildId: 'unassigned', attemptId: 'unassigned', probeVersion: 'lab-probe-v2', worldId: 0, cupScale: 1 };

  constructor() { this.resetAggregates(); }
  get phase(): LabProbePhase { return this._phase; }
  get isFrozen(): boolean { return this.anomaly !== null; }

  configure(mode: LabProbeMode, identity: LabProbeIdentity): void {
    this.mode = mode; this.identity = { ...identity };
  }
  setWorld(worldId: number, cupScale: number): void {
    this.identity.worldId = worldId; this.identity.cupScale = cupScale;
    this.previousValid.fill(0); this.lastStepTick = 0;
  }
  beginContinuousTest(expectedBodyCount: number, warmupSteps = 600, observeSteps = 3600, minObserveMs = 60000): void {
    this.resetAttempt(); this.expectedBodyCount = expectedBodyCount;
    this.warmupTarget = warmupSteps; this.observeTarget = observeSteps; this.minObserveMs = minObserveMs;
    this._phase = 'WARMUP'; this.lastFrameStart = 0; this.lastStepTick = 0;
  }
  setPhase(phase: LabProbePhase): void { if (!this.anomaly) this._phase = phase; }
  freezeForBacklog(tick: number): void { this.freezeAnomaly('CLOCK_BACKLOG', tick, 0, 0, 0); }

  beginFrame(engineDtSeconds: number, tick: number): void {
    this.frameStart = performance.now(); this.frameWallGap = this.lastFrameStart ? this.frameStart - this.lastFrameStart : 0;
    this.lastFrameStart = this.frameStart; this.frameTickBefore = tick; this.frameStepCount = 0; this.frameObserveSteps = 0; this.frameAdapterMs = 0;
    this.currentEngineDtMs = engineDtSeconds * 1000;
  }
  private currentEngineDtMs = 0;

  /** Called after the existing adapter.stepFixed() in FixedClock's sole onStep callback. */
  afterStep(source: ProbeBodySource, tick: number, adapterMs: number): string | null {
    this.frameStepCount++; this.frameAdapterMs += adapterMs; this.stepTotal++;
    if (this.mode === 'OFF' || this.anomaly || !['WARMUP', 'OBSERVE', 'SETUP'].includes(this._phase)) return null;
    const started = performance.now();
    if (this.lastStepTick && tick !== this.lastStepTick + 1) this.stepGaps++;
    this.lastStepTick = tick;
    this.minFaceLeft = this.minFaceRight = this.minFaceBottom = Number.POSITIVE_INFINITY;
    this.minBoxLeft = this.minBoxRight = this.minBoxBottom = Number.POSITIVE_INFINITY;
    this.minEndLeft = this.minEndRight = this.minEndBottom = Number.POSITIVE_INFINITY;
    this.escapeMask = 0; this.badCount = 0; this.bodySampleCount = 0;
    if (this.mode === 'SUMMARY') { this.activeSource = source; source.visitBodySamples(this.bodyVisitor); this.activeSource = null; }
    else if (this.mode === 'LEGACY_COMPARE') {
      const bodies: LegacyBodyRecord[] = [];
      source.visitBodySamples((id, radiusDu, xDu, yDu, vxDu, vyDu, sleeping) => {
        bodies.push({ id, radiusDu, xDu, yDu, vxDu, vyDu, sleeping });
      });
      this.bodySampleCount = bodies.length;
      this.legacySteps.push({ tick, phase: this._phase, bodies, probeStepMs: 0 });
    } else this.bodySampleCount = source.entityCount;
    this.nonFiniteCount += this.badCount; if (this.escapeMask) this.escapingCount++;
    const stepSlot = this.stepCursor;
    this.pushStep(tick, this.minFaceLeft, this.minFaceRight, this.minFaceBottom, this.minBoxLeft, this.minBoxRight, this.minBoxBottom,
      this.minEndLeft, this.minEndRight, this.minEndBottom, this.escapeMask, this.badCount, this.bodySampleCount, adapterMs, 0, source.lastStepTimings);
    let failureReason: string | null = null;
    if (this._phase === 'OBSERVE') this.frameObserveSteps++;
    if (this.expectedBodyCount > 0 && this.bodySampleCount !== this.expectedBodyCount) {
      failureReason = 'BODY_COUNT_CHANGED';
    } else if (this.badCount || this.escapeMask) {
      failureReason = this.badCount ? 'NON_FINITE_BODY' : 'FINITE_WALL_SWEEP_ESCAPE';
    }
    if (failureReason) this.freezeAnomaly(failureReason, tick, this.escapeMask, this.badCount, 0);
    else if (this._phase === 'WARMUP') {
      this.warmupSteps++;
      if (this.warmupSteps === this.warmupTarget) { this.resetAggregates(); this._phase = 'OBSERVE'; this.observeStartMs = performance.now(); }
    } else if (this._phase === 'OBSERVE') {
      this.observeSteps++; this.observeEndMs = performance.now();
      if (this.observeSteps >= this.observeTarget && this.activeObserveMs >= this.minObserveMs) this._phase = 'COMPLETE';
    }
    const probeStepMs = performance.now() - started;
    this.steps[stepSlot * LabProbe.STEP_WIDTH + 14] = probeStepMs;
    const anomaly = this.anomaly as Record<string, unknown> | null;
    if (anomaly) {
      anomaly.probeStepMs = probeStepMs;
      const recentSteps = anomaly.recentSteps as number[][] | undefined;
      if (recentSteps?.length) recentSteps[recentSteps.length - 1][14] = probeStepMs;
    }
    if (this.mode === 'LEGACY_COMPARE' && this.legacySteps.length) this.legacySteps[this.legacySteps.length - 1].probeStepMs = probeStepMs;
    return failureReason;
  }

  endFrame(tickAfter: number, viewMs: number, labUpdateMs: number, pauseReasonMask = 0): void {
    const start = performance.now(); const slot = this.frameCursor * LabProbe.FRAME_WIDTH;
    this.frames[slot] = this.frameStart; this.frames[slot + 1] = this.frameWallGap; this.frames[slot + 2] = this.currentEngineDtMs;
    this.frames[slot + 3] = this.frameStepCount; this.frames[slot + 4] = this.frameTickBefore; this.frames[slot + 5] = tickAfter;
    this.frames[slot + 6] = this.frameAdapterMs; this.frames[slot + 7] = viewMs; this.frames[slot + 8] = labUpdateMs;
    this.frames[slot + 9] = typeof document !== 'undefined' && document.visibilityState === 'visible' ? 1 : 0;
    this.frames[slot + 10] = typeof document !== 'undefined' && document.hasFocus() ? 1 : 0;
    this.frames[slot + 11] = performance.now() - start; this.frames[slot + 12] = this.phaseCode(); this.frames[slot + 13] = this.identity.worldId;
    this.frames[slot + 14] = pauseReasonMask;
    if (this.mode === 'LEGACY_COMPARE' && ['WARMUP', 'OBSERVE'].includes(this._phase) && this.legacyFrames.length < LabProbe.FRAME_CAPACITY)
      this.legacyFrames.push({ wallGapMs: this.frameWallGap, engineDtMs: this.currentEngineDtMs,
      steps: this.frameStepCount, tickBefore: this.frameTickBefore, tickAfter, adapterMs: this.frameAdapterMs, viewMs, labUpdateMs,
      visible: typeof document !== 'undefined' && document.visibilityState === 'visible',
      hasFocus: typeof document !== 'undefined' && document.hasFocus() });
    this.frameCursor = (this.frameCursor + 1) % LabProbe.FRAME_CAPACITY;
    if (this.frameCount < LabProbe.FRAME_CAPACITY) this.frameCount++; else this.frameOverflow = true;
    if (this._phase === 'OBSERVE' && pauseReasonMask === 0 && this.frameObserveSteps > 0
      && this.frames[slot + 9] === 1) this.activeObserveMs += Math.max(0, this.frameWallGap);
  }

  export(): Record<string, unknown> {
    const exportStart = performance.now();
    const legacyStepTimes = this.legacySteps.map(record => record.probeStepMs).sort((a, b) => a - b);
    let legacySummary = this.legacySummaryCache;
    if (this.mode === 'LEGACY_COMPARE' && !legacySummary) legacySummary = { stepRecords: this.legacySteps.length,
      warmupRecords: this.legacySteps.filter(record => record.phase === 'WARMUP').length,
      observeRecords: this.legacySteps.filter(record => record.phase === 'OBSERVE').length,
      bodyRecords: this.legacySteps.reduce((sum, record) => sum + record.bodies.length, 0),
      frameObjects: this.legacyFrames.length, probeStepMs: { p50: percentile(legacyStepTimes, 0.5),
        p95: percentile(legacyStepTimes, 0.95), p99: percentile(legacyStepTimes, 0.99), max: legacyStepTimes[legacyStepTimes.length - 1] ?? 0 },
      measurementScope: 'one object per body per fixed step, per-step body array push, per-step record push, plus per-frame object push; no geometry assertion' };
    if (this.mode !== 'LEGACY_COMPARE') legacySummary = null;
    const frames = new Array<Record<string, number>>(this.frameCount); const firstFrame = (this.frameCursor - this.frameCount + LabProbe.FRAME_CAPACITY) % LabProbe.FRAME_CAPACITY;
    for (let i = 0; i < this.frameCount; i++) { const o = ((firstFrame + i) % LabProbe.FRAME_CAPACITY) * LabProbe.FRAME_WIDTH;
      frames[i] = { wallMs: this.frames[o], wallGapMs: this.frames[o + 1], engineDtMs: this.frames[o + 2], steps: this.frames[o + 3],
        tickBefore: this.frames[o + 4], tickAfter: this.frames[o + 5], adapterMs: this.frames[o + 6], viewMs: this.frames[o + 7],
        labUpdateMs: this.frames[o + 8], visible: this.frames[o + 9], hasFocus: this.frames[o + 10], probeFrameMs: this.frames[o + 11],
        phase: this.frames[o + 12], worldId: this.frames[o + 13], pauseReasonMask: this.frames[o + 14] }; }
    const steps = new Array<number[]>(this.stepCount); const firstStep = (this.stepCursor - this.stepCount + LabProbe.STEP_CAPACITY) % LabProbe.STEP_CAPACITY;
    for (let i = 0; i < this.stepCount; i++) { const o = ((firstStep + i) % LabProbe.STEP_CAPACITY) * LabProbe.STEP_WIDTH; const row = new Array<number>(LabProbe.STEP_WIDTH);
      for (let j = 0; j < LabProbe.STEP_WIDTH; j++) row[j] = this.steps[o + j]; steps[i] = row; }
    const result: Record<string, unknown> = { metadata: { ...this.identity, mode: this.mode, phase: this._phase }, coverage: { frameCount: this.frameCount, frameOverflow: this.frameOverflow,
      totalSteps: this.stepTotal, warmupSteps: this.warmupSteps, observeSteps: this.observeSteps, stepGaps: this.stepGaps,
      observeDurationMs: this.observeEndMs - this.observeStartMs, activeObserveMs: this.activeObserveMs,
      expectedBodyCount: this.expectedBodyCount, lastBodyCount: this.bodySampleCount },
      summary: { escapingSteps: this.escapingCount, nonFiniteBodies: this.nonFiniteCount, minMargins: Array.from(this.minMargins), negativeMarginTicks: Array.from(this.negativeMarginTicks) },
      anomaly: this.anomaly, recentSteps: steps, frames, legacySummary };
    result.measurementScopes = { probeStepMs: this.mode === 'LEGACY_COMPARE'
        ? 'legacy per-body object creation + body array push + per-step record push + fixed-size aggregate/ring writes'
        : this.mode === 'TIMING' ? 'body-count read + fixed-size per-step aggregate/ring writes'
          : 'adapter body visitor + finite-wall/endpoint/swept geometry + aggregate/ring write',
      probeFrameMs: this.mode === 'LEGACY_COMPARE' ? 'fixed-size frame ring write + legacy per-frame object push'
        : 'fixed-size render-frame ring write', labUpdateMs: 'whole PhysicsLab.update including HUD refresh and view sync',
      adapterMs: 'whole adapter.stepFixed', adapterSubtimings: ['syncToPhysics', 'physicsStep', 'syncFromPhysics', 'velocityClamp'],
      adapterSubtimingsAreNested: true, probeExportMs: performance.now() - exportStart };
    if (this.mode === 'LEGACY_COMPARE' && ['COMPLETE', 'FAILURE'].includes(this._phase) && !this.legacySummaryCache) {
      this.legacySummaryCache = legacySummary; this.legacySteps.length = 0; this.legacyFrames.length = 0;
    }
    return result;
  }

  private pushStep(tick: number, fL: number, fR: number, fB: number, bL: number, bR: number, bB: number,
    eL: number, eR: number, eB: number, escapeMask: number, badCount: number, bodyCount: number, adapterMs: number, probeMs: number,
    adapterParts: ProbeBodySource['lastStepTimings']): void {
    const slot = this.stepCursor * LabProbe.STEP_WIDTH;
    this.steps[slot] = tick; this.steps[slot + 1] = fL; this.steps[slot + 2] = fR; this.steps[slot + 3] = fB;
    this.steps[slot + 4] = bL; this.steps[slot + 5] = bR; this.steps[slot + 6] = bB;
    this.steps[slot + 7] = eL; this.steps[slot + 8] = eR; this.steps[slot + 9] = eB;
    this.steps[slot + 10] = escapeMask; this.steps[slot + 11] = badCount; this.steps[slot + 12] = bodyCount;
    this.steps[slot + 13] = adapterMs; this.steps[slot + 14] = probeMs; this.steps[slot + 15] = this.phaseCode(); this.steps[slot + 16] = this.identity.worldId;
    this.steps[slot + 17] = adapterParts.syncToPhysics; this.steps[slot + 18] = adapterParts.physicsStep;
    this.steps[slot + 19] = adapterParts.syncFromPhysics; this.steps[slot + 20] = adapterParts.velocityClamp;
    this.stepCursor = (this.stepCursor + 1) % LabProbe.STEP_CAPACITY; if (this.stepCount < LabProbe.STEP_CAPACITY) this.stepCount++;
  }
  private sampleBody(id: number, radius: number, x: number, y: number, vx: number, vy: number, awake: boolean): void {
    const source = this.activeSource; this.bodySampleCount++;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(radius)) { this.badCount++; return; }
    const base = id * 6; const validId = id >= 0 && id < this.previousValid.length;
    const prev = validId && this.previousValid[id] === 1;
    const px = prev ? this.previousX[id] : x; const py = prev ? this.previousY[id] : y;
    if (validId) { this.previousX[id] = x; this.previousY[id] = y; this.previousValid[id] = 1; }
    if (validId && base + 5 < this.currentBodies.length) {
      this.currentBodies[base] = x; this.currentBodies[base + 1] = y; this.currentBodies[base + 2] = vx;
      this.currentBodies[base + 3] = vy; this.currentBodies[base + 4] = radius; this.currentBodies[base + 5] = awake ? 1 : 0;
    } else { this.badCount++; return; }
    if (!source) { this.badCount++; return; }
    for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
      const segment = source.cupSegments[segmentIndex]; if (!segment) continue;
      sampleCupSegmentSweep(segment, x, y, px, py, radius, prev, this.sample);
      const side = segmentIndex; const face = this.sample[CUP_PROBE_FACE]; const box = this.sample[CUP_PROBE_BOX]; const end = this.sample[CUP_PROBE_ENDPOINT];
      if (segment.kind === 'left') { this.minFaceLeft = Math.min(this.minFaceLeft, face); this.minBoxLeft = Math.min(this.minBoxLeft, box); this.minEndLeft = Math.min(this.minEndLeft, end); }
      else if (segment.kind === 'right') { this.minFaceRight = Math.min(this.minFaceRight, face); this.minBoxRight = Math.min(this.minBoxRight, box); this.minEndRight = Math.min(this.minEndRight, end); }
      else { this.minFaceBottom = Math.min(this.minFaceBottom, face); this.minBoxBottom = Math.min(this.minBoxBottom, box); this.minEndBottom = Math.min(this.minEndBottom, end); }
      this.minMargins[side * 3] = Math.min(this.minMargins[side * 3], face);
      this.minMargins[side * 3 + 1] = Math.min(this.minMargins[side * 3 + 1], box);
      this.minMargins[side * 3 + 2] = Math.min(this.minMargins[side * 3 + 2], end);
      if (Number.isFinite(face) && face < 0) this.negativeMarginTicks[side * 3]++;
      if (Number.isFinite(box) && box < 0) this.negativeMarginTicks[side * 3 + 1]++;
      if (Number.isFinite(end) && end < 0) this.negativeMarginTicks[side * 3 + 2]++;
      if (this.sample[CUP_PROBE_ESCAPE] === 1) this.escapeMask |= 1 << segmentIndex;
    }
  }
  private freezeAnomaly(reason: string, tick: number, escapeMask: number, badCount: number, probeStepMs: number): void {
    if (this.anomaly) return;
    this._phase = 'FAILURE';
    const bodies: number[][] = [];
    for (let id = 0; id < this.previousValid.length; id++) if (this.previousValid[id]) {
      const o = id * 6; bodies.push([id, this.currentBodies[o], this.currentBodies[o + 1], this.currentBodies[o + 2], this.currentBodies[o + 3], this.currentBodies[o + 4], this.currentBodies[o + 5]]);
    }
    this.anomaly = { reason, tick, escapeMask, badCount, probeStepMs, worldId: this.identity.worldId, bodies,
      triggerFrame: { wallGapMs: this.frameWallGap, engineDtMs: this.currentEngineDtMs, tickBefore: this.frameTickBefore,
        tickAfter: tick, stepsInFrame: this.frameStepCount, adapterMs: this.frameAdapterMs,
        visibility: typeof document !== 'undefined' ? document.visibilityState : 'unavailable',
        hasFocus: typeof document !== 'undefined' ? document.hasFocus() : false },
      recentFrames: this.copyRecentFrames(), recentSteps: this.copyRecentSteps() };
  }
  private copyRecentFrames(): Array<Record<string, number>> {
    const out: Array<Record<string, number>> = []; const first = (this.frameCursor - this.frameCount + LabProbe.FRAME_CAPACITY) % LabProbe.FRAME_CAPACITY;
    for (let i = 0; i < this.frameCount; i++) { const o = ((first + i) % LabProbe.FRAME_CAPACITY) * LabProbe.FRAME_WIDTH;
      out.push({ wallMs: this.frames[o], wallGapMs: this.frames[o + 1], engineDtMs: this.frames[o + 2], steps: this.frames[o + 3],
        tickBefore: this.frames[o + 4], tickAfter: this.frames[o + 5], adapterMs: this.frames[o + 6], viewMs: this.frames[o + 7],
        labUpdateMs: this.frames[o + 8], visible: this.frames[o + 9], hasFocus: this.frames[o + 10],
        probeFrameMs: this.frames[o + 11], phase: this.frames[o + 12], worldId: this.frames[o + 13], pauseReasonMask: this.frames[o + 14] }); }
    return out;
  }
  private copyRecentSteps(): number[][] {
    const out: number[][] = []; const first = (this.stepCursor - this.stepCount + LabProbe.STEP_CAPACITY) % LabProbe.STEP_CAPACITY;
    for (let i = 0; i < this.stepCount; i++) { const offset = ((first + i) % LabProbe.STEP_CAPACITY) * LabProbe.STEP_WIDTH; const row: number[] = [];
      for (let j = 0; j < LabProbe.STEP_WIDTH; j++) row.push(this.steps[offset + j]); out.push(row); }
    return out;
  }
  private phaseCode(): number { return this._phase === 'SETUP' ? 0 : this._phase === 'WARMUP' ? 1 : this._phase === 'OBSERVE' ? 2 : this._phase === 'FAILURE' ? 3 : this._phase === 'PAUSED' ? 4 : 5; }
  private resetAttempt(): void {
    this.frameCount = 0; this.frameCursor = 0; this.frameOverflow = false; this.stepCount = 0; this.stepCursor = 0; this.stepTotal = 0;
    this.stepGaps = 0; this.warmupSteps = 0; this.observeSteps = 0; this.observeStartMs = 0; this.observeEndMs = 0; this.activeObserveMs = 0;
    this.escapingCount = 0; this.nonFiniteCount = 0; this.anomaly = null; this.previousValid.fill(0); this.resetAggregates();
    this.legacySteps.length = 0; this.legacyFrames.length = 0; this.legacySummaryCache = null;
  }
  private resetAggregates(): void { this.minMargins.fill(Number.POSITIVE_INFINITY); this.negativeMarginTicks.fill(0); }
}

function percentile(sorted: readonly number[], fraction: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}
