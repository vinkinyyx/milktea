const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '../../temp/p1a-core');
const output = base;
const { ConfigLoader } = require(path.join(output, 'core/ConfigLoader.js'));
const { FixedClock } = require(path.join(output, 'core/Clock.js'));
const { CoordinateMapper } = require(path.join(output, 'physics/CoordinateMapper.js'));
const { CupGeometry } = require(path.join(output, 'physics/CupGeometry.js'));
const { LabPauseGate } = require(path.join(output, 'debug/LabPauseGate.js'));
const { LabProbe } = require(path.join(output, 'debug/LabProbe.js'));
const { NineSizeQueueLedger } = require(path.join(output, 'debug/NineSizeQueueLedger.js'));
const { sampleCupSegmentSweep, CUP_PROBE_ESCAPE, CUP_PROBE_ENDPOINT, CUP_PROBE_SWEPT } = require(path.join(output, 'physics/CupSweepProbe.js'));

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config/design-baseline.json'), 'utf8'));
const good = ConfigLoader.validate(config);
assert.equal(good.ok, true, good.ok ? '' : good.error.message);
const duplicate = structuredClone(config); duplicate.ingredients[1].id = duplicate.ingredients[0].id;
assert.equal(ConfigLoader.validate(duplicate).ok, false, 'duplicate ingredient id must fail');
const duplicateLevel = structuredClone(config); duplicateLevel.ingredients[1].level = duplicateLevel.ingredients[0].level;
assert.equal(ConfigLoader.validate(duplicateLevel).ok, false, 'duplicate ingredient level must fail');
const badWeights = structuredClone(config); badWeights.drop.spawn_levels[0].weight++;
assert.equal(ConfigLoader.validate(badWeights).ok, false, 'weights must sum to 100');
const nonFinite = structuredClone(config); nonFinite.ingredients[0].radius_du = Infinity;
assert.equal(ConfigLoader.validate(nonFinite).ok, false, 'non-finite radius must fail');
const zeroDensity = structuredClone(config); zeroDensity.physics.density_relative = 0;
assert.equal(ConfigLoader.validate(zeroDensity).ok, false, 'dynamic body density must be positive');
const badCupScale = structuredClone(config); badCupScale.stages[0].cup_width_scale = 0;
assert.equal(ConfigLoader.validate(badCupScale).ok, false, 'cup width scale must be positive');

function runCadence(renderHz) {
  let y = 10000, velocity = 0, steps = 0;
  const clock = new FixedClock(60, 5, () => { velocity -= 980 / 60; y += velocity / 60; steps++; });
  for (let i = 0; i < renderHz * 2; i++) clock.update(1 / renderHz);
  return { y, velocity, steps, tick: clock.tick };
}
const at30 = runCadence(30); const at60 = runCadence(60);
const at30Repeat = runCadence(30);
assert.equal(at30.steps, 120); assert.equal(at60.steps, 120);
assert.equal(at30.tick, 120); assert.equal(at60.tick, 120);
assert.equal(at30.y, at60.y); assert.equal(at30.velocity, at60.velocity);
assert.deepEqual(at30, at30Repeat, 'same model cadence and initial state must reproduce');
for (const hz of [17, 30, 60]) {
  let count = 0;
  const stoppingClock = new FixedClock(60, 5, () => { count++; if (count === 120) stoppingClock.pause(); });
  for (let i = 0; i < hz * 3; i++) stoppingClock.update(1 / hz);
  assert.equal(count, 120, 'pause inside a step must stop the remaining render-frame substeps');
  assert.equal(stoppingClock.tick, 120);
}

let steps = 0; const clock = new FixedClock(60, 5, () => steps++);
clock.update(1 / 60); clock.pause(); clock.update(4); assert.equal(clock.tick, 1); assert.equal(steps, 1);
clock.resume(); assert.equal(clock.update(1 / 60).steps, 1);
const overloaded = clock.update(0.25); assert.equal(overloaded.steps, 5); assert.equal(overloaded.pausedForBacklog, true); assert.equal(clock.paused, true);

const gate = new LabPauseGate();
assert.equal(gate.canAdvance, true);
const manualRevision = gate.hold('MANUAL'); assert.equal(gate.canAdvance, false);
gate.hold('BACKGROUND'); gate.release('BACKGROUND');
assert.equal(gate.canAdvance, false, 'show must not release an independent manual pause');
assert.ok(gate.revision > manualRevision);
gate.hold('RESUME_REQUIRED'); gate.clear('MANUAL');
assert.equal(gate.requestUserResume(true, true).ok, true); assert.equal(gate.has('RESUME_REQUIRED'), false);
gate.hold('BACKGROUND'); gate.hold('RESUME_REQUIRED'); gate.release('BACKGROUND');
assert.equal(gate.requestUserResume(true, true).ok, true); assert.equal(gate.canAdvance, true, 'visible explicit R clears the resume boundary');
assert.equal(gate.requestUserResume(true, false).reason, 'BACKGROUND');
gate.clear('MANUAL', 'BACKLOG'); assert.equal(gate.canAdvance, true);
assert.deepEqual(gate.snapshot(), []);

const probe = new LabProbe();
probe.configure('SUMMARY', { buildId: 'unit-build', attemptId: 'unit-attempt', probeVersion: 'unit-v1', worldId: 7, cupScale: 1 });
const emptySource = { visitBodySamples() {}, cupSegments: [], entityCount: 0,
  lastStepTimings: { syncToPhysics: 0.05, physicsStep: 0.1, syncFromPhysics: 0.05, velocityClamp: 0.01 } };
probe.beginFrame(1 / 60, 0); probe.afterStep(emptySource, 1, 0.25); probe.endFrame(1, 0.1);
const probeData = probe.export();
assert.equal(probeData.metadata.attemptId, 'unit-attempt'); assert.equal(probeData.coverage.frameCount, 1);
assert.equal(probeData.frames[0].steps, 1); assert.equal(probeData.frames[0].tickAfter, 1);
assert.ok(probeData.frames[0].adapterMs >= 0.25); assert.equal(probeData.coverage.frameOverflow, false);
const mapper = new CoordinateMapper(750, 1334, 100, 32);
const designSize = mapper.screenToDu({ x: 375, y: 667 }, 750, 1334);
const wideScreen = mapper.screenToDu({ x: 750, y: 1334 }, 1500, 2668);
assert.deepEqual(designSize, { x: 375, y: 667 }); assert.deepEqual(wideScreen, { x: 375, y: 667 });
assert.ok(Math.abs(mapper.specAccelerationToDu(-9.8) + 980) < 1e-9);
assert.equal(mapper.duVelocityToBox2D(320), 3.2);
assert.equal(mapper.box2DVelocityToDu(3.2), 320);
assert.equal(mapper.duAccelerationToBox2D(-980), -9.8);
assert.equal(mapper.duToBox2DMeters(100), 1);
assert.equal(mapper.duToCocosWorld(100), 32);
assert.equal(mapper.cocosWorldToDu(32), 100);
assert.equal(mapper.specAccelerationToCocosGravityApi(-9.8), -313.6);
const cup = CupGeometry.build({ centerXDu: 375, bottomYDu: 260, topYDu: 1060, bottomWidthDu: 360, topWidthDu: 520, widthScale: 1 });
assert.equal(cup.segments.length, 3); assert.equal(cup.segments.some(s => s.kind === 'top'), false);
assert.deepEqual(cup.leftBottom, { x: 195, y: 260 }); assert.deepEqual(cup.rightBottom, { x: 555, y: 260 });
for (const segment of cup.segments) {
  const dx = segment.innerEnd.x - segment.innerStart.x;
  const dy = segment.innerEnd.y - segment.innerStart.y;
  assert.ok(Math.abs(Math.hypot(segment.outward.x, segment.outward.y) - 1) < 1e-12);
  assert.ok(Math.abs(dx * segment.outward.x + dy * segment.outward.y) < 1e-9,
    `${segment.kind} outward normal must be perpendicular to the collider axis`);
  const innerFaceMid = { x: segment.center.x - segment.outward.x * segment.thicknessDu / 2,
    y: segment.center.y - segment.outward.y * segment.thicknessDu / 2 };
  const sourceMid = { x: (segment.innerStart.x + segment.innerEnd.x) / 2,
    y: (segment.innerStart.y + segment.innerEnd.y) / 2 };
  assert.ok(Math.hypot(innerFaceMid.x - sourceMid.x, innerFaceMid.y - sourceMid.y) < 1e-9,
    `${segment.kind} wall thickness must extend outward from its inner edge`);
  assert.ok(segment.lengthDu > Math.hypot(segment.innerEnd.x - segment.innerStart.x, segment.innerEnd.y - segment.innerStart.y),
    `${segment.kind} wall ends overlap adjacent segments`);
}
const left = cup.segments.find(s => s.kind === 'left');
const right = cup.segments.find(s => s.kind === 'right');
assert.ok(Math.abs(left.outward.x + right.outward.x) < 1e-12);
assert.ok(Math.abs(left.outward.y - right.outward.y) < 1e-12);
assert.ok(Math.abs(left.center.x + right.center.x - 750) < 1e-9);
assert.ok(Math.abs(left.center.y - right.center.y) < 1e-9);
const narrowWidth = 360 * 0.8; const topRadius = config.ingredients[8].radius_du;
assert.ok(topRadius * 2 <= narrowWidth, 'largest ingredient fits the narrowest bottom');
const sweepOut = new Float64Array(5); const inward = { x: -left.outward.x, y: -left.outward.y };
const mid = { x: (left.innerStart.x + left.innerEnd.x) / 2, y: (left.innerStart.y + left.innerEnd.y) / 2 };
sampleCupSegmentSweep(left, mid.x + inward.x * 8, mid.y + inward.y * 8, mid.x + inward.x * 8, mid.y + inward.y * 8, 5, false, sweepOut);
assert.ok(sweepOut[CUP_PROBE_ENDPOINT] > 0, 'mid-face point is clear of finite endpoints');
sampleCupSegmentSweep(left, mid.x - inward.x * 28, mid.y - inward.y * 28, mid.x + inward.x * 8, mid.y + inward.y * 8, 5, true, sweepOut);
assert.equal(sweepOut[CUP_PROBE_SWEPT], 1, 'sweep through the finite wall volume is detected');
assert.equal(sweepOut[CUP_PROBE_ESCAPE], 1, 'inside-to-outside wall crossing is an escape');
const endpoint = left.innerEnd;
sampleCupSegmentSweep(left, endpoint.x, endpoint.y + 25, endpoint.x, endpoint.y + 25, 5, false, sweepOut);
assert.equal(sweepOut[CUP_PROBE_ESCAPE], 0, 'body above the open rim is not classified as wall escape');
const bottom = cup.segments.find(s => s.kind === 'bottom');
sampleCupSegmentSweep(bottom, 375, 230, 375, 275, 5, true, sweepOut);
assert.equal(sweepOut[CUP_PROBE_ESCAPE], 1, 'bottom sweep through the finite wall is detected');
const timedProbe = new LabProbe(); timedProbe.configure('TIMING', { buildId: 'unit-build', attemptId: 'timing-attempt', probeVersion: 'unit-v2', worldId: 8, cupScale: 1 });
let timedVisits = 0;
const timedSource = { visitBodySamples() { timedVisits++; }, cupSegments: cup.segments, entityCount: 220, lastStepTimings: emptySource.lastStepTimings };
timedProbe.beginContinuousTest(220, 0, 3600, 60000); timedProbe.beginFrame(1 / 60, 0); timedProbe.afterStep(timedSource, 1, 0.2); timedProbe.endFrame(1, 0, 1, 2);
const timedData = timedProbe.export();
assert.equal(timedVisits, 0, 'TIMING probe must not traverse bodies');
assert.equal(timedData.coverage.activeObserveMs, 0, 'hidden/paused frame duration is excluded from continuous observation');
assert.equal(timedData.recentSteps[0][12], 220, 'TIMING probe records body count without geometry traversal');
assert.ok(timedData.recentSteps[0][14] >= 0, 'full per-step probe cost is recorded');
const legacyProbe = new LabProbe(); legacyProbe.configure('LEGACY_COMPARE', { buildId: 'unit-build', attemptId: 'legacy-attempt', probeVersion: 'unit-v2', worldId: 10, cupScale: 1 });
const legacySource = { ...emptySource, entityCount: 2, visitBodySamples(visitor) { visitor(1, 5, 10, 20, 0, 0, false); visitor(2, 7, 30, 40, 0, 0, true); } };
legacyProbe.beginContinuousTest(2, 1, 1, 0);
for (let step = 1; step <= 3; step++) { legacyProbe.beginFrame(1 / 60, step - 1); legacyProbe.afterStep(legacySource, step, 0.2); legacyProbe.endFrame(step, 0.1, 1); }
const legacyData = legacyProbe.export();
assert.equal(legacyData.metadata.mode, 'LEGACY_COMPARE'); assert.equal(legacyData.metadata.phase, 'COMPLETE');
assert.equal(legacyData.legacySummary.stepRecords, 2, 'legacy mode captures per-step object rows only while collecting');
assert.equal(legacyData.legacySummary.bodyRecords, 4, 'legacy mode allocates and array-pushes each actual body sample');
assert.equal(legacyData.legacySummary.frameObjects, 1, 'legacy mode retains old per-frame object pushes');
let position = { x: (left.innerStart.x + left.innerEnd.x) / 2 + inward.x * 8,
  y: (left.innerStart.y + left.innerEnd.y) / 2 + inward.y * 8 };
const movingSource = { ...emptySource, entityCount: 1, cupSegments: cup.segments, visitBodySamples(visitor) { visitor(0, 5, position.x, position.y, 0, 0, true); } };
const anomalyProbe = new LabProbe(); anomalyProbe.configure('SUMMARY', { buildId: 'unit-build', attemptId: 'freeze-attempt', probeVersion: 'unit-v2', worldId: 9, cupScale: 1 });
anomalyProbe.beginContinuousTest(1); anomalyProbe.afterStep(movingSource, 1, 0.1);
position = { x: (left.innerStart.x + left.innerEnd.x) / 2 - inward.x * 28, y: (left.innerStart.y + left.innerEnd.y) / 2 - inward.y * 28 };
assert.equal(anomalyProbe.afterStep(movingSource, 2, 0.1), 'FINITE_WALL_SWEEP_ESCAPE');
position = { x: 375, y: 500 }; anomalyProbe.afterStep(movingSource, 3, 0.1);
assert.equal(anomalyProbe.export().anomaly.tick, 2, 'first anomaly freezes and later bodies cannot replace it');
const queue = new NineSizeQueueLedger('queue-unit-attempt');
let batch = queue.tryCandidates(1, [100, 200, 300], x => x === 200 ? null : 'blocked');
assert.equal(batch.batchAttempt, 1); assert.equal(batch.acceptedX, 200); assert.equal(batch.failureRounds, 0);
for (let i = 0; i < 120; i++) batch = queue.tryCandidates(2, [1, 2, 3], () => 'all-blocked');
assert.equal(batch.failureRounds, 120); assert.equal(batch.terminal, true); assert.equal(queue.state.state, 'BLOCKED_FINAL');
const stoppedBatchCount = queue.state.batchAttempt; queue.tryCandidates(3, [4, 5], () => null);
assert.equal(queue.state.batchAttempt, stoppedBatchCount, 'terminal task cannot schedule later batches');
assert.deepEqual([...new Set(queue.state.records.map(row => row.level))], [1, 2], 'candidate history preserves earlier levels');
assert.equal(queue.cancel(), false, 'terminal task cancellation is idempotent and does not change its result');
console.log(JSON.stringify({ config: 'PASS', validationErrors: 'PASS', cadence30: at30, cadence60: at60,
  repeatability30: 'PASS', exactTickPauseAt17_30_60: 'PASS',
  pauseResumeAndOverload: 'PASS', pauseReasonOwnership: 'PASS', boundedProbeRecording: 'PASS', timingProbeSkipsGeometryAndExcludesPause: 'PASS', legacyAllocationPushProbe: 'PASS', firstAnomalyFreeze: 'PASS', queueBatchRoundsCancellationAndHistory: 'PASS', coordinateMapping: 'PASS', cupGeometry: 'PASS', narrowestCupFit: 'PASS', finiteWallSweepAndOpenRim: 'PASS' }, null, 2));
