const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '../../temp/p1a-core');
const output = base;
const { ConfigLoader } = require(path.join(output, 'core/ConfigLoader.js'));
const { FixedClock } = require(path.join(output, 'core/Clock.js'));
const { CoordinateMapper } = require(path.join(output, 'physics/CoordinateMapper.js'));
const { CupGeometry } = require(path.join(output, 'physics/CupGeometry.js'));

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

let steps = 0; const clock = new FixedClock(60, 5, () => steps++);
clock.update(1 / 60); clock.pause(); clock.update(4); assert.equal(clock.tick, 1); assert.equal(steps, 1);
clock.resume(); assert.equal(clock.update(1 / 60).steps, 1);
const overloaded = clock.update(0.25); assert.equal(overloaded.steps, 5); assert.equal(overloaded.pausedForBacklog, true); assert.equal(clock.paused, true);

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
  const innerFaceMid = { x: segment.center.x - segment.outward.x * segment.thicknessDu / 2,
    y: segment.center.y - segment.outward.y * segment.thicknessDu / 2 };
  const sourceMid = { x: (segment.innerStart.x + segment.innerEnd.x) / 2,
    y: (segment.innerStart.y + segment.innerEnd.y) / 2 };
  assert.ok(Math.hypot(innerFaceMid.x - sourceMid.x, innerFaceMid.y - sourceMid.y) < 1e-9,
    `${segment.kind} wall thickness must extend outward from its inner edge`);
  assert.ok(segment.lengthDu > Math.hypot(segment.innerEnd.x - segment.innerStart.x, segment.innerEnd.y - segment.innerStart.y),
    `${segment.kind} wall ends overlap adjacent segments`);
}
const narrowWidth = 360 * 0.8; const topRadius = config.ingredients[8].radius_du;
assert.ok(topRadius * 2 <= narrowWidth, 'largest ingredient fits the narrowest bottom');
console.log(JSON.stringify({ config: 'PASS', validationErrors: 'PASS', cadence30: at30, cadence60: at60,
  repeatability30: 'PASS',
  pauseResumeAndOverload: 'PASS', coordinateMapping: 'PASS', cupGeometry: 'PASS', narrowestCupFit: 'PASS' }, null, 2));
