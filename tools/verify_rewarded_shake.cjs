/**
 * Deterministic acceptance checks for the rewarded-shake slice.
 * Compiles the pure logic modules to build-artifacts/rewarded-tests/js and runs them in Node.
 * Usage: node tools/verify_rewarded_shake.cjs
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const project = path.join(root, '奶茶挤挤');
const outDir = path.join(root, 'build-artifacts', 'rewarded-tests', 'js');
const configPath = path.join(root, 'config', 'design-baseline.json');
const testTsconfig = path.join(root, 'build-artifacts', 'rewarded-tests', 'tsconfig.json');
const scripts = path.join(project, 'assets', 'scripts');
const files = [
  'contracts/types.ts', 'core/CloneState.ts', 'core/Sha256.ts', 'core/ConfigLoader.ts', 'core/RunRng.ts', 'core/SpawnRng.ts', 'core/EventIdentity.ts', 'core/RunEngine.ts',
  'persistence/SaveCodec.ts', 'persistence/SaveValidator.ts', 'persistence/SaveMigration.ts', 'persistence/RewardLedger.ts', 'persistence/ReviveLedger.ts', 'persistence/LocalSaveRepository.ts',
  'application/RewardedShakeService.ts', 'application/RewardedAdCoordinator.ts', 'application/SpillReviveService.ts', 'platform/TapRewardedAdProvider.ts', 'platform/RewardedAdProviderFactory.ts', 'debug/FakeRewardedAdProvider.ts', 'core/RewardedAdPolicyLoader.ts', 'core/SpillRevivePolicyLoader.ts', 'core/Clock.ts', 'core/ArtLoadBudget.ts',
].map((file) => path.join(scripts, file));

fs.rmSync(path.dirname(outDir), { recursive: true, force: true });
fs.mkdirSync(path.dirname(outDir), { recursive: true });
const stubPath = path.join(root, 'build-artifacts', 'rewarded-tests', 'cc-env.d.ts');
fs.writeFileSync(stubPath, "declare module 'cc/env' { export const DEBUG: boolean; }\n");
fs.writeFileSync(testTsconfig, JSON.stringify({
  extends: path.join(project, 'tsconfig.json'),
  compilerOptions: { noEmit: false, module: 'commonjs', target: 'ES2019', outDir, rootDir: scripts, types: [] },
  files: [...files, stubPath],
  include: [],
}, null, 2));
const tsc = path.join(project, 'node_modules', 'typescript', 'bin', 'tsc');
const compile = spawnSync(process.execPath, [tsc, '--project', testTsconfig], { encoding: 'utf8' });
if (compile.status !== 0) {
  console.error(compile.stdout || '', compile.stderr || '');
  process.exit(1);
}
const load = (relative) => require(path.join(outDir, relative));
const { SaveCodec } = load('persistence/SaveCodec.js');
const { SaveValidator } = load('persistence/SaveValidator.js');
const { SaveMigration } = load('persistence/SaveMigration.js');
const { RewardLedger } = load('persistence/RewardLedger.js');
const { LocalSaveRepository } = load('persistence/LocalSaveRepository.js');
const { RunEngine } = load('core/RunEngine.js');
const { SpawnRng } = load('core/SpawnRng.js');
const { ConfigLoader } = load('core/ConfigLoader.js');
const { RewardedShakeService } = load('application/RewardedShakeService.js');
const { TapRewardedAdProvider } = load('platform/TapRewardedAdProvider.js');
const { RewardedAdPolicyLoader } = load('core/RewardedAdPolicyLoader.js');
const { ReviveLedger } = load('persistence/ReviveLedger.js');
const { ArtLoadBudget } = load('core/ArtLoadBudget.js');
const { SpillReviveService } = load('application/SpillReviveService.js');
const { SpillRevivePolicyLoader } = load('core/SpillRevivePolicyLoader.js');
const { RewardedAdCoordinator } = load('application/RewardedAdCoordinator.js');
const { FixedClock } = load('core/Clock.js');

let passed = 0; const failures = [];
const check = (name, condition, detail = '') => { if (condition) { passed++; console.log(`PASS ${name}`); } else { failures.push(`${name}${detail ? `: ${detail}` : ''}`); console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`); } };
const NOW = Date.UTC(2026, 10, 3, 4, 0, 0); // 2026-11-03 12:00 Asia/Shanghai
const RUN_ID = '11111111-1111-4111-8111-111111111111';
const rulesResult = ConfigLoader.validate(JSON.parse(fs.readFileSync(configPath, 'utf8')));
if (!rulesResult.ok) { console.error(rulesResult.error.message); process.exit(1); }
const rules = rulesResult.data;
const store = new Map();
globalThis.tap = {
  getStorageSync: (key) => store.get(key) ?? '',
  setStorageSync: (key, value) => { store.set(key, value); },
  removeStorageSync: (key) => { store.delete(key); },
  createRewardedVideoAd: () => ({ onLoad() {}, onError() {}, onClose() {}, load: async () => {}, show: async () => {}, destroy() {} }),
};
const adapter = {
  createCup() {}, setCupVelocityX() {}, getCupOffsetX() { return 0; }, createBody() {}, destroyBody() {},
  replaceParentsWithChild() { return { ok: true, data: undefined }; }, stepFixed() {},
  applyHorizontalAcceleration() {}, getContacts() { return []; }, getBody() { return undefined; },
  restoreBodies() {}, canSpawn() { return true; }, dispose() {},
};
const makeRun = (extraGranted = 0) => {
  const engine = new RunEngine(adapter, rules, RUN_ID, 12345);
  const snapshot = engine.snapshot();
  engine.dispose();
  return SaveCodec.sealSnapshot({
    ...snapshot, tick: 200, state: 'PAUSED', shake: { baseUsed: 2, extraGranted, extraUsed: 0, activeStartTick: null, cooldownUntilTick: 0 },
    rng: { algorithm: 'xorshift32_v1_nonzero_seed', state: 12345, drawCount: 2 },
    ingredients: [{ entityId: 1, level: 1, positionDu: { x: 430, y: 300 }, velocityDuPerSecond: { x: 0, y: 0 }, angleRadians: 0, angularVelocity: 0, bornTick: 0, dangerEligible: false, hasEnteredCup: false, spillTicks: 0, sleeping: false }],
    nextEntityId: 2, autoDrop: { ...snapshot.autoDrop, nextDueTick: 220 }, checksum: '',
  });
};
const profileFor = (run, extra = {}) => ({
  schemaVersion: 3, settings: { musicGain: 0.35, sfxGain: 0.7, reducedMotion: false, dropMode: 'drag_release', tutorialCompleted: true },
  discoveredLevels: [], unlockedStageIds: ['classic'], bestScores: {}, activeRunId: run ? run.runId : null, revision: 0,
  firstNaturalRunCompleted: true, rewardedShake: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] },
  rewardedRevive: { dayKey: null, dailyGranted: 0, pendingAttempt: null, receipts: [] }, ...extra,
});

(async () => {
  // 1. Day/quota ledger
  check('dayKey uses Asia/Shanghai', RewardLedger.dayKey(Date.UTC(2026, 10, 2, 16, 0, 0)) === '2026-11-03');
  const ledger = RewardLedger.normalize({ dayKey: '2026-11-02', dailyGranted: 5, pendingAttempt: null, receipts: [] }, '2026-11-03');
  check('day rollover resets dailyGranted', ledger.dailyGranted === 0);
  const receipt = RewardLedger.receiptFor({ attemptId: '22222222-2222-4222-8222-222222222222', runId: RUN_ID, policyVersion: 'p', amount: 1, dayKey: '2026-11-03', startedAt: NOW }, NOW);
  const granted = RewardLedger.grant({ dayKey: '2026-11-03', dailyGranted: 1, pendingAttempt: null, receipts: [] }, receipt, RUN_ID);
  check('grant increments quota and clears pending', granted.dailyGranted === 2 && granted.pendingAttempt === null && granted.receipts.length === 1);
  check('grant is idempotent by attemptId', RewardLedger.grant(granted, receipt, RUN_ID).receipts.filter((r) => r.attemptId === receipt.attemptId).length === 1);
  const duplicateGrant=RewardLedger.grant(granted,receipt,RUN_ID);
  check('duplicate receipt does not increment daily quota',duplicateGrant.dailyGranted===granted.dailyGranted);
  let receiptConflict=false;try{RewardLedger.grant(granted,{...receipt,runId:'99999999-9999-4999-8999-999999999999'},RUN_ID);}catch{receiptConflict=true;}
  check('receipt identity collision is rejected',receiptConflict);
  const crossed=RewardLedger.grant({dayKey:'2026-11-04',dailyGranted:2,pendingAttempt:null,receipts:[]},{...receipt,attemptId:'77777777-7777-4777-8777-777777777777',dayKey:'2026-11-03'},RUN_ID);
  check('late previous-day completion does not reset current-day quota',crossed.dayKey==='2026-11-04'&&crossed.dailyGranted===2&&RewardLedger.dailyRemaining(crossed,{maxDailyRewardedShakes:5},'2026-11-04')===3);

  // Clock debt is dropped without converting an ordinary slow frame to a pause.
  let committedTicks=0;const clock=new FixedClock(60,5,()=>{committedTicks++;return true;});
  const slow=clock.update(0.1);
  check('100ms frame caps at five steps without pausing',slow.steps===5&&!slow.pausedForBacklog&&!clock.paused&&clock.tick===5&&committedTicks===5);
  check('100ms frame drops complete debt and retains fractional remainder',Math.abs(slow.droppedSeconds-1/60)<1e-8);
  const afterSlow=clock.update(1/60);
  check('clock resumes normal progression after debt drop',afterSlow.steps===1&&clock.tick===6&&!clock.paused);
  const failedClock=new FixedClock(60,5,()=>false);const failedStep=failedClock.update(1/60);
  check('uncommitted physical step freezes without incrementing clock tick',failedStep.steps===0&&failedClock.tick===0&&failedClock.paused);
  const debtClock=new FixedClock(60,5,()=>true);let maxObserved=0;for(const dt of [0.25,1,1/60,1/30,0.016,0.033,0.1]){const r=debtClock.update(dt);maxObserved=Math.max(maxObserved,r.steps);check(`slow-frame input ${dt}s never pauses`,!debtClock.paused&&!r.pausedForBacklog&&r.droppedSeconds>=0);}
  check('slow-frame catch-up limit remains five',maxObserved<=5);
  const invalidClock=new FixedClock(60,5,()=>true);let invalidRejected=false;try{invalidClock.update(Number.NaN);}catch{invalidRejected=true;}
  check('invalid delta is classified as an error',invalidRejected&&invalidClock.tick===0);
  const mixedClock=new FixedClock(60,5,()=>true);for(let i=0;i<300;i++)mixedClock.update(i%2?1/30:1/60);
  check('mixed 60Hz and 30Hz frames commit their exact fixed ticks',mixedClock.tick===450&&!mixedClock.paused);
  const edgeClock=new FixedClock(60,5,()=>true);const edgeResult=edgeClock.update(5/60);
  check('five-step exact boundary commits five fixed ticks',edgeResult.steps===5&&edgeClock.tick===5&&!edgeResult.overloaded);
  const slowStream=new FixedClock(60,5,()=>true);let streamMax=0;for(let i=0;i<60;i++)streamMax=Math.max(streamMax,slowStream.update(.05).steps);
  const recoveredStream=slowStream.update(1/60);
  check('continuous slow frames stay bounded and recover without a backlog pause',streamMax===3&&!slowStream.paused&&recoveredStream.steps===1);
  let pausedStepClock;let pausedStepCount=0;pausedStepClock=new FixedClock(60,5,()=>{pausedStepCount++;if(pausedStepCount===2)pausedStepClock.pause();return true;});
  const midPause=pausedStepClock.update(.1);
  check('pause during catch-up stops after the committed pause boundary',midPause.steps===2&&midPause.tick===2&&pausedStepClock.paused&&!midPause.overloaded);
  let invalidCount=0;for(const dt of [Number.POSITIVE_INFINITY,-1]){const c=new FixedClock(60,5,()=>true);try{c.update(dt);}catch{invalidCount++;}}
  check('infinite and negative frame deltas are rejected',invalidCount===2);

  // 2. Schema migration
  const spawnRng = new SpawnRng(1);
  const golden = Array.from({length:5},()=>{const x=[-16,-12,-8,-4,4,8,12,16][spawnRng.nextIndex(8)]+375;const vx=[-12,-8,0,8,12][spawnRng.nextIndex(5)];return [x,vx];});
  check('spawn RNG matches independent fixed-seed golden sequence', JSON.stringify(golden)===JSON.stringify([[391,8],[363,8],[367,0],[387,-8],[383,8]])&&spawnRng.snapshot().drawCount===10);
  const firstA=SaveCodec.sealSnapshot(new RunEngine(adapter,rules,RUN_ID,1).snapshot()),firstB=SaveCodec.sealSnapshot(new RunEngine(adapter,rules,RUN_ID,1).snapshot());
  check('same seed yields the same preview descriptor without changing level stream',JSON.stringify(firstA.autoDrop.pendingSpawn)===JSON.stringify(firstB.autoDrop.pendingSpawn)&&firstA.rng.drawCount===2&&firstA.spawnRng.drawCount===2);
  check('schema5 run includes a valid checked spawn descriptor',SaveValidator.snapshot(firstA).valid&&firstA.autoDrop.pendingSpawn.level===firstA.currentLevel&&firstA.saveSchemaVersion===5);
  const old3={...firstA,shake:{baseUsed:0,extraUsed:0,activeStartTick:null,cooldownUntilTick:0},boardType:'standard'};delete old3.spawnRng;delete old3.revive;old3.autoDrop={nextDueTick:firstA.autoDrop.nextDueTick};const legacy3=SaveCodec.sealSnapshot({...old3,saveSchemaVersion:3,checksum:''});const upgraded3=SaveMigration.runV3(legacy3);check('schema3 migration preserves old rule identity with centered pending spawn',SaveValidator.legacySnapshot(legacy3,3).valid&&upgraded3.saveSchemaVersion===5&&upgraded3.rulesVersion===firstA.rulesVersion&&upgraded3.autoDrop.pendingSpawn.xDu===375&&upgraded3.revive.used===0);
  const blockedAdapter={...adapter,canSpawn(){return false;}};const blockedEngine=new RunEngine(blockedAdapter,rules,RUN_ID,1);blockedEngine.resume();const blockedBefore=blockedEngine.snapshot();for(let i=0;i<65;i++)blockedEngine.advanceOneTick();const blockedAfter=blockedEngine.snapshot();
  check('blocked automatic spawn retries preserve the exact descriptor and RNG state',JSON.stringify(blockedAfter.autoDrop.pendingSpawn)===JSON.stringify(blockedBefore.autoDrop.pendingSpawn)&&JSON.stringify(blockedAfter.spawnRng)===JSON.stringify(blockedBefore.spawnRng)&&blockedAfter.dropIndex===0);
  const run = makeRun();
  const legacyBase = { ...run }; delete legacyBase.spawnRng; delete legacyBase.revive; legacyBase.autoDrop = { nextDueTick: run.autoDrop.nextDueTick }; const legacyRun = SaveCodec.sealSnapshot({ ...legacyBase, saveSchemaVersion: 2, shake: { baseUsed: 1, extraUsed: 0, activeStartTick: null, cooldownUntilTick: 0 }, checksum: '' });
  const legacyProfile = { schemaVersion: 1, settings: profileFor(null).settings, discoveredLevels: [], unlockedStageIds: ['classic'], bestScores: {}, activeRunId: RUN_ID, revision: 2 };
  const legacyBundle = { profile: legacyProfile, run: legacyRun, lastResult: { runId: RUN_ID, reason: 'CUP_FULL', score: 120, maxLevel: 3, dropIndex: 4, baseUsed: 1, extraUsed: 0, rulesVersion: rules.design_rules_version } };
  const legacyEnvelope = SaveCodec.createEnvelope(4, legacyBundle);
  check('legacy envelope validates', SaveValidator.legacyEnvelope(legacyEnvelope));
  const migrated = SaveMigration.bundle(legacyEnvelope.payload);
  check('migration preserves run identity and tick', migrated.run.runId === RUN_ID && migrated.run.tick === legacyRun.tick && migrated.run.saveSchemaVersion === 5 && migrated.run.shake.extraGranted === 0 && migrated.run.revive.used === 0);
  check('migration upgrades profile and derives natural-run proof', migrated.profile.schemaVersion === 3 && migrated.profile.firstNaturalRunCompleted === true && migrated.profile.rewardedShake.receipts.length === 0 && migrated.profile.rewardedRevive.receipts.length === 0);
  check('migrated bundle passes V2 validation', SaveValidator.bundle(migrated).valid);
  const migratedEnvelope = SaveCodec.createEnvelopeV2(4, migrated);
  check('migrated envelope checksum verifies', SaveValidator.envelope(migratedEnvelope));

  // 3. Repository safe read + no boot-time write
  const migStore = new Map();
  globalThis.tap = { getStorageSync: (k) => migStore.get(k) ?? '', setStorageSync: (k, v) => migStore.set(k, v), removeStorageSync: (k) => migStore.delete(k), createRewardedVideoAd: () => ({}) };
  const migRepo = new LocalSaveRepository('migration-case');
  migStore.set('milktea.p1b.debug.migration-case.A', JSON.stringify(legacyEnvelope));
  migStore.set('milktea.p1b.debug.migration-case.pointer', 'A');
  const before = JSON.stringify([...migStore.entries()]);
  const read = await migRepo.readBundle();
  check('repository reads a legacy slot', read.ok && read.data.envelope && read.data.envelope.schemaVersion === 2 && read.data.envelope.revision === 4);
  check('legacy read performs no write', before === JSON.stringify([...migStore.entries()]));
  const lease = await migRepo.acquireWriteLease();
  check('lease acquired in test storage', lease.ok);
  const committed = await migRepo.commitBundle(4, RUN_ID, migrated);
  check('first V2 commit succeeds', committed.ok && committed.data.revision === 5);
  if (lease.ok) lease.data.release();

  const badStore = new Map([['milktea.p1b.debug.bad-case.A', JSON.stringify({ schemaVersion: 3, revision: 1, payload: {}, checksum: 'x' })]]);
  globalThis.tap = { getStorageSync: (k) => badStore.get(k) ?? '', setStorageSync: (k, v) => badStore.set(k, v), removeStorageSync: (k) => badStore.delete(k), createRewardedVideoAd: () => ({}) };
  const badRead = await new LocalSaveRepository('bad-case').readBundle();
  check('unknown envelope version is rejected', !badRead.ok && badRead.error.code === 'SAVE_VERSION_UNSUPPORTED');

  // 4. Engine rewarded shake consume
  const engine = new RunEngine(adapter, rules, RUN_ID, 12345, makeRun(1));
  check('restored engine is paused', engine.phase === 'PAUSED');
  const resumed = engine.resume();
  check('engine resumes', resumed.ok);
  const snap = engine.snapshot();
  const rewardedCommand = { ownerEpoch: snap.epoch, command: { kind: 'SHAKE', runId: RUN_ID, commandId: '33333333-3333-4333-8333-333333333333', sequence: snap.nextCommandSequence, tick: snap.tick + 1, source: 'rewarded_ad' } };
  const dispatched = engine.dispatch(rewardedCommand);
  check('rewarded shake command accepted', dispatched.ok);
  const events = engine.advanceOneTick();
  const shakeEvent = events.find((event) => event.kind === 'ShakeConsumed');
  const afterShake = engine.snapshot();
  check('rewarded shake consumed once with assistant marking', shakeEvent && shakeEvent.source === 'rewarded_ad' && afterShake.shake.extraUsed === 1 && afterShake.boardType === 'assisted');
  const baseCommand = { ownerEpoch: afterShake.epoch, command: { kind: 'SHAKE', runId: RUN_ID, commandId: '44444444-4444-4444-8444-444444444444', sequence: afterShake.nextCommandSequence, tick: afterShake.tick + 1, source: 'base' } };
  engine.dispatch(baseCommand); engine.advanceOneTick();
  check('base shake rejects after two uses', engine.currentOutcome && engine.currentOutcome.errorCode === 'NO_BASE_SHAKES');
  const grant = engine.commitExtraGrant(1);
  check('extra grant applies once save is confirmed', grant.ok && engine.snapshot().shake.extraGranted === 2);

  // 4b. Actual RunEngine target controller and shake eligibility with a deterministic physics adapter.
  let cupOffset=0,cupVelocity=0;const accelerations=[];
  const motionAdapter={...adapter,createCup(){},setCupVelocityX(v){cupVelocity=v;},getCupOffsetX(){return cupOffset;},stepFixed(){cupOffset=Math.max(-110,Math.min(110,cupOffset+cupVelocity/60));},applyHorizontalAcceleration(id,a){accelerations.push([id,a]);},restoreBodies(){}};
  const motionEngine=new RunEngine(motionAdapter,rules,RUN_ID,345);
  motionEngine.setCupTarget(110);for(let i=0;i<9;i++)motionEngine.advanceOneTick();
  check('fast cup target tracks 110du within eight du after 150ms',Math.abs(motionEngine.presentationCupOffsetXDu-110)<=8);
  motionEngine.cancelCupInput();
  check('cancelled cup input clears target and velocity immediately',motionEngine.snapshot().cupMotion.control==='IDLE'&&motionEngine.snapshot().cupMotion.velocityXDuPerSecond===0&&cupVelocity===0);
  motionEngine.setCupTarget(30);for(let i=0;i<3;i++)motionEngine.advanceOneTick();motionEngine.releaseCup();
  check('release enters bounded settling instead of immediate brake',motionEngine.snapshot().cupMotion.control==='SETTLING');
  for(let i=0;i<9;i++)motionEngine.advanceOneTick();
  check('settling remains bounded to nine fixed steps',motionEngine.snapshot().cupMotion.control!=='SETTLING');
  const shakeBase=makeRun();const shakeSnapshot=SaveCodec.sealSnapshot({...shakeBase,tick:200,state:'PAUSED',shake:{baseUsed:1,extraGranted:0,extraUsed:0,activeStartTick:200,cooldownUntilTick:278},ingredients:[
    {entityId:1,level:1,positionDu:{x:375,y:500},velocityDuPerSecond:{x:0,y:0},angleRadians:0,angularVelocity:0,bornTick:0,dangerEligible:false,hasEnteredCup:true,spillTicks:0,sleeping:false},
    {entityId:2,level:1,positionDu:{x:375,y:1050},velocityDuPerSecond:{x:0,y:0},angleRadians:0,angularVelocity:0,bornTick:0,dangerEligible:false,hasEnteredCup:false,spillTicks:0,sleeping:false}],nextEntityId:3,checksum:''});
  const shakeEngine=new RunEngine(motionAdapter,rules,RUN_ID,12345,shakeSnapshot);shakeEngine.resume();shakeEngine.advanceOneTick();shakeEngine.advanceOneTick();
  check('shake force uses configured amplitude and excludes unentered next ingredient',accelerations.some(x=>x[0]===1&&Math.abs(x[1])>0)&&!accelerations.some(x=>x[0]===2));
  const emptySnap=SaveCodec.sealSnapshot({...makeRun(),ingredients:[],nextEntityId:1,shake:{baseUsed:0,extraGranted:0,extraUsed:0,activeStartTick:null,cooldownUntilTick:0},autoDrop:{nextDueTick:1000},checksum:''});
  const emptyEngine=new RunEngine(adapter,rules,RUN_ID,456,emptySnap);emptyEngine.resume();
  const emptyState=emptyEngine.snapshot();emptyEngine.dispatch({ownerEpoch:emptyState.epoch,command:{kind:'SHAKE',runId:RUN_ID,commandId:'88888888-8888-4888-8888-888888888888',sequence:emptyState.nextCommandSequence,tick:emptyState.tick+1,source:'base'}});
  emptyEngine.advanceOneTick();
  check('empty cup shake rejects without consuming a base use',emptyEngine.snapshot().shake.baseUsed===0&&emptyEngine.currentOutcome?.errorCode==='SHAKE_EMPTY',JSON.stringify({used:emptyEngine.snapshot().shake.baseUsed,outcome:emptyEngine.currentOutcome}));
  const spamState=emptyEngine.snapshot();for(let i=0;i<20;i++){const s=emptyEngine.snapshot();emptyEngine.dispatch({ownerEpoch:s.epoch,command:{kind:'SHAKE',runId:RUN_ID,commandId:`spam-${i}`,sequence:s.nextCommandSequence,tick:s.tick+1,source:'base'}});emptyEngine.advanceOneTick();}
  check('twenty rapid empty-cup requests never consume shake quota',emptyEngine.snapshot().shake.baseUsed===0,JSON.stringify({used:emptyEngine.snapshot().shake.baseUsed,outcome:emptyEngine.currentOutcome}));
  const cooldownSnapshot=SaveCodec.sealSnapshot({...makeRun(),tick:276,shake:{baseUsed:1,extraGranted:0,extraUsed:0,activeStartTick:200,cooldownUntilTick:278},checksum:''});
  const cooldownEngine=new RunEngine(adapter,rules,RUN_ID,456,cooldownSnapshot);cooldownEngine.resume();let cs=cooldownEngine.snapshot();
  cooldownEngine.dispatch({ownerEpoch:cs.epoch,command:{kind:'SHAKE',runId:RUN_ID,commandId:'99999999-9999-4999-8999-999999999999',sequence:cs.nextCommandSequence,tick:cs.tick+1,source:'base'}});cooldownEngine.advanceOneTick();
  const cooldownRejected=cooldownEngine.lastCommandOutcome?.errorCode==='SHAKE_COOLDOWN';cs=cooldownEngine.snapshot();
  cooldownEngine.dispatch({ownerEpoch:cs.epoch,command:{kind:'SHAKE',runId:RUN_ID,commandId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',sequence:cs.nextCommandSequence,tick:cs.tick+1,source:'base'}});cooldownEngine.advanceOneTick();
  check('shake cooldown rejects tick 77 and accepts tick 78',cooldownRejected&&cooldownEngine.lastCommandOutcome?.status==='APPLIED');
  const midShakeSnap=SaveCodec.sealSnapshot({...makeRun(),tick:224,shake:{baseUsed:1,extraGranted:0,extraUsed:0,activeStartTick:200,cooldownUntilTick:278},checksum:''});
  const midShakeEngine=new RunEngine(motionAdapter,rules,RUN_ID,789,midShakeSnap);midShakeEngine.resume();midShakeEngine.pause('MANUAL');const pausedShake=midShakeEngine.snapshot();
  const resumedShake=new RunEngine(motionAdapter,rules,RUN_ID,789,pausedShake);resumedShake.resume();resumedShake.advanceOneTick();
  check('pause and restore during shake preserve active phase',pausedShake.shake.activeStartTick===200&&resumedShake.snapshot().shake.activeStartTick===200&&accelerations.some(x=>x[0]===1&&Math.abs(x[1])>0));
  const autoShakeSnap=SaveCodec.sealSnapshot({...makeRun(),autoDrop:{nextDueTick:201},shake:{baseUsed:0,extraGranted:0,extraUsed:0,activeStartTick:null,cooldownUntilTick:0},checksum:''});
  const autoShakeEngine=new RunEngine(adapter,rules,RUN_ID,987,autoShakeSnap);autoShakeEngine.resume();const as=autoShakeEngine.snapshot();
  autoShakeEngine.dispatch({ownerEpoch:as.epoch,command:{kind:'SHAKE',runId:RUN_ID,commandId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',sequence:as.nextCommandSequence,tick:as.tick+1,source:'base'}});autoShakeEngine.advanceOneTick();
  check('automatic ingredient drop defers during a successfully consumed shake',autoShakeEngine.snapshot().dropIndex===makeRun().dropIndex&&autoShakeEngine.snapshot().autoDrop.nextDueTick>autoShakeEngine.snapshot().tick);
  const faultAdapter={...adapter,stepFixed(){throw new Error('injected physics step failure');}};const faultRun=SaveCodec.sealSnapshot({...makeRun(),shake:{baseUsed:0,extraGranted:0,extraUsed:0,activeStartTick:null,cooldownUntilTick:0},checksum:''});const faultEngine=new RunEngine(faultAdapter,rules,RUN_ID,654,faultRun);faultEngine.resume();const fs=faultEngine.snapshot();
  faultEngine.dispatch({ownerEpoch:fs.epoch,command:{kind:'SHAKE',runId:RUN_ID,commandId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',sequence:fs.nextCommandSequence,tick:fs.tick+1,source:'base'}});faultEngine.advanceOneTick();
  check('failed physics transaction rolls back shake consumption and freezes',faultEngine.snapshot().shake.baseUsed===0&&faultEngine.phase==='PAUSED'&&!!faultEngine.lastTickFault,JSON.stringify({used:faultEngine.snapshot().shake.baseUsed,phase:faultEngine.phase,fault:faultEngine.lastTickFault}));
  let failRollbackRestore=false;const rollbackFaultAdapter={...faultAdapter,restoreBodies(){if(failRollbackRestore)throw new Error('injected rollback failure');}};const rollbackEngine=new RunEngine(rollbackFaultAdapter,rules,RUN_ID,655,faultRun);rollbackEngine.resume();failRollbackRestore=true;
  rollbackEngine.advanceOneTick();
  check('rollback failure preserves both physical and recovery fault codes',rollbackEngine.phase==='PAUSED'&&rollbackEngine.lastTickFault?.includes('injected physics step failure|ROLLBACK:Error:injected rollback failure'));

  // 5. Service completes, grants, and persists
  const runNow = makeRun();
  const repo = new LocalSaveRepository('service-case');
  await repo.acquireWriteLease();
  const initialBundle = { profile: profileFor(runNow), run: runNow, lastResult: null };
  const initialCommit = await repo.commitBundle(0, null, initialBundle);
  check('initial bundle commits', initialCommit.ok);
  let bundle = initialBundle; let revision = initialCommit.ok ? initialCommit.data.revision : 0; let paused = false; let resumedNotice = null;
  const serviceEngine = new RunEngine(adapter, rules, RUN_ID, 12345, runNow);
  const policy = { enabled: true, policyVersion: 'test-policy', adUnitId: 'debug-mock', placement: 'extra-shake', maxExtraShakesPerRun: 5, maxDailyRewardedShakes: 5, minForegroundSecondsFirstSession: 60, requireTutorialComplete: true, requireFirstNaturalRunCompleted: true };
  const host = {
    getActiveRunSnapshot: () => serviceEngine.snapshot(), getBundle: () => bundle, getSaveRevision: () => revision,
    isTutorialComplete: () => true, getForegroundSeconds: () => 60,
    pauseForRewardedAd: () => { paused = true; serviceEngine.pause('AD'); },
    resumeFromRewardedAd: (notice) => { paused = false; resumedNotice = notice; },
    onRewardedShakeChanged: () => {}, onRewardedShakeCommitted: (next, nextRevision) => { bundle = next; revision = nextRevision; },
    applyCommittedExtraGrant: () => serviceEngine.commitExtraGrant(1), waitForSaveIdle: async () => {},
  };
  const provider = { providerName: 'debug-mock', capability: () => 'SUPPORTED', prepare: async () => ({ ok: true, data: undefined }), show: async (attemptId) => ({ kind: 'COMPLETED', attemptId }), dispose: () => {} };
  const service = RewardedShakeService.create({ provider, policy }, repo, () => NOW);
  service.bind(host);
  service.setForegroundSeconds(60);
  check('offer is available after base shakes are used', service.getView().block === null && service.canOffer());
  service.openOffer();
  check('offer pauses the run', paused && service.getView().phase === 'OFFER');
  await service.watch();
  const view = service.getView();
  check('completed ad reaches GRANTED', view.phase === 'GRANTED');
  const persisted = await repo.readBundle();
  check('grant persisted with receipt and projected run', persisted.ok && persisted.data.envelope.payload.run.shake.extraGranted === 1 && persisted.data.envelope.payload.profile.rewardedShake.receipts.length === 1 && persisted.data.envelope.payload.profile.rewardedShake.pendingAttempt === null);
  check('live engine receives the grant exactly once', serviceEngine.snapshot().shake.extraGranted === 1);
  service.acknowledgeGrant();
  check('acknowledge resumes to safe pause', !paused && service.getView().phase === 'IDLE');

  // 6. Cancelled ad clears pending without granting
  delete globalThis.__milkteaRewardedShake;
  const cancelRun = makeRun();
  const cancelRepo = new LocalSaveRepository('cancel-case');
  await cancelRepo.acquireWriteLease();
  const cancelInitial = await cancelRepo.commitBundle(0, null, { profile: profileFor(cancelRun), run: cancelRun, lastResult: null });
  let cancelBundle = { profile: profileFor(cancelRun), run: cancelRun, lastResult: null }; let cancelRevision = cancelInitial.ok ? cancelInitial.data.revision : 0;
  const cancelEngine = new RunEngine(adapter, rules, RUN_ID, 12345, cancelRun);
  const cancelHost = { ...host, getActiveRunSnapshot: () => cancelEngine.snapshot(), getBundle: () => cancelBundle, getSaveRevision: () => cancelRevision, onRewardedShakeCommitted: (next, rev) => { cancelBundle = next; cancelRevision = rev; }, pauseForRewardedAd: () => cancelEngine.pause('AD'), applyCommittedExtraGrant: () => cancelEngine.commitExtraGrant(1) };
  const cancelProvider = { providerName: 'debug-mock', capability: () => 'SUPPORTED', prepare: async () => ({ ok: true, data: undefined }), show: async (attemptId) => ({ kind: 'CANCELLED', attemptId, errorCode: 'CLOSED_EARLY' }), dispose: () => {} };
  const cancelService = RewardedShakeService.create({ provider: cancelProvider, policy }, cancelRepo, () => NOW);
  cancelService.bind(cancelHost); cancelService.setForegroundSeconds(60); cancelService.openOffer(); await cancelService.watch();
  const cancelPersisted = await cancelRepo.readBundle();
  check('cancelled ad grants nothing and clears pending', cancelPersisted.ok && cancelPersisted.data.envelope.payload.run.shake.extraGranted === 0 && cancelPersisted.data.envelope.payload.profile.rewardedShake.pendingAttempt === null && cancelService.getView().phase === 'ERROR');
  check('cancelled ad leaves a safe-pause notice', typeof resumedNotice === 'string' && resumedNotice.includes('未发放'));

  // A failed pending-clear save after load failure must not enable reward settlement.
  delete globalThis.__milkteaRewardedShake;
  const unsafeRun = makeRun();
  const unsafeRepo = new LocalSaveRepository('untrusted-retry-case');
  await unsafeRepo.acquireWriteLease();
  let unsafeBundle = { profile: profileFor(unsafeRun), run: unsafeRun, lastResult: null };
  let unsafeRevision = 0; let commitCalls = 0;
  const originalCommit = unsafeRepo.commitBundle.bind(unsafeRepo);
  unsafeRepo.commitBundle = async (...args) => {
    commitCalls++;
    if (commitCalls === 2) return { ok: false, error: { code: 'SAVE_CONFLICT', message: 'injected clear failure' } };
    return originalCommit(...args);
  };
  const unsafeInitial = await originalCommit(0, null, unsafeBundle);
  unsafeRevision = unsafeInitial.ok ? unsafeInitial.data.revision : 0;
  const unsafeEngine = new RunEngine(adapter, rules, RUN_ID, 12345, unsafeRun);
  const unsafeHost = { ...host, getActiveRunSnapshot: () => unsafeEngine.snapshot(), getBundle: () => unsafeBundle, getSaveRevision: () => unsafeRevision,
    onRewardedShakeCommitted: (next, revision) => { unsafeBundle = next; unsafeRevision = revision; }, pauseForRewardedAd: () => unsafeEngine.pause('AD'), applyCommittedExtraGrant: () => unsafeEngine.commitExtraGrant(1) };
  const unavailableProvider = { providerName: 'tap', capability: () => 'SUPPORTED', prepare: async () => ({ ok: false, error: { code: 'NO_FILL', message: 'no fill' } }), show: async () => { throw new Error('must not show'); }, dispose() {} };
  const unsafeService = RewardedShakeService.create({ provider: unavailableProvider, policy }, unsafeRepo, () => NOW);
  unsafeService.bind(unsafeHost); unsafeService.setForegroundSeconds(60); unsafeService.openOffer(); await unsafeService.watch();
  check('failed untrusted pending clear does not expose retry settlement', !unsafeService.getView().retrySettle && unsafeService.getView().pendingAttempt);
  await unsafeService.retrySettlement();
  check('retry without trusted completion cannot grant', unsafeEngine.snapshot().shake.extraGranted === 0 && !unsafeService.getView().retrySettle);

  // 6b. Real-provider contract probes with isolated SDK instances (not ad-success mocks in game flow).
  const adInstances=[];
  const makeAdInstance=(load=()=>Promise.resolve())=>{
    const listeners={load:new Set(),error:new Set(),close:new Set()};
    const inst={onLoad:f=>listeners.load.add(f),offLoad:f=>listeners.load.delete(f),onError:f=>listeners.error.add(f),offError:f=>listeners.error.delete(f),onClose:f=>listeners.close.add(f),offClose:f=>listeners.close.delete(f),load,show:()=>Promise.resolve(),destroy(){},emit:(key,value)=>{for(const f of [...listeners[key]])f(value);},closeCallbacks:listeners.close};
    adInstances.push(inst);return inst;
  };
  globalThis.tap={createRewardedVideoAd:()=>makeAdInstance()};
  const providerPolicy={...policy,enabled:true};
  const nestedProvider=new TapRewardedAdProvider(providerPolicy);await nestedProvider.prepare();
  const nestedAttempt='55555555-5555-4555-8555-555555555555';const nestedPromise=nestedProvider.show(nestedAttempt);adInstances[0].emit('close',{status:{isEnded:true}});
  check('nested close status is not trusted as completion',(await nestedPromise).kind==='CANCELLED');
  const aInstance=adInstances[0];
  const providerB=new TapRewardedAdProvider(providerPolicy);await providerB.prepare();
  const attemptB='66666666-6666-4666-8666-666666666666';let bSettled=false;const bPromise=providerB.show(attemptB).then(value=>{bSettled=true;return value;});
  aInstance.emit('close',{isEnded:true});await Promise.resolve();
  check('late close from prior native instance cannot settle next attempt',!bSettled);
  adInstances[1].emit('close',{isEnded:true});check('top-level strict true completes the owning attempt',(await bPromise).kind==='COMPLETED');
  globalThis.tap={createRewardedVideoAd:()=>makeAdInstance(()=>Promise.reject(new Error('load')))};
  const failedLoadProvider=new TapRewardedAdProvider(providerPolicy);const failedLoad=await failedLoadProvider.prepare();
  check('rejected load Promise resolves prepare as failure',!failedLoad.ok&&failedLoad.error.code==='REWARD_AD_LOAD_REJECTED');

  // 7. Policy/block gates
  const disabled = await new TapRewardedAdProvider({ ...policy, enabled: false }).capability();
  check('disabled policy closes the tap provider', disabled === 'DISABLED');
  const unconfigured = new TapRewardedAdProvider({ ...policy, adUnitId: null }).capability();
  check('missing ad unit is not offered', unconfigured === 'UNCONFIGURED');
  const supported = new TapRewardedAdProvider(policy).capability();
  check('real tap API + unit is supported', supported === 'SUPPORTED');
  const loaded = RewardedAdPolicyLoader.validate({ policyVersion: 'p', enabled: false, adUnitId: null, placement: 'extra-shake', maxExtraShakesPerRun: 5, maxDailyRewardedShakes: 5, minForegroundSecondsFirstSession: 60, requireTutorialComplete: true, requireFirstNaturalRunCompleted: true });
  check('shipped policy shape validates (closed)', loaded.ok && loaded.data.enabled === false);
  check('policy rejects daily limit above 5', !RewardedAdPolicyLoader.validate({ ...loaded.data, maxDailyRewardedShakes: 6 }).ok);
  const dailyBlocked = RewardLedger.checkOffer({ policy, capability: 'SUPPORTED', profile: profileFor(runNow, { rewardedShake: { dayKey: RewardLedger.dayKey(NOW), dailyGranted: 5, pendingAttempt: null, receipts: [] } }), run: runNow, foregroundSeconds: 60, tutorialComplete: true, nowMs: NOW });
  check('daily quota blocks the offer', !dailyBlocked.allowed && dailyBlocked.block === 'DAILY_LIMIT');
  const earlyBlocked = RewardLedger.checkOffer({ policy, capability: 'SUPPORTED', profile: profileFor(runNow), run: runNow, foregroundSeconds: 59, tutorialComplete: true, nowMs: NOW });
  check('short foreground blocks the offer', !earlyBlocked.allowed && earlyBlocked.block === 'FOREGROUND_REQUIRED');

  // 8. Spill revive: deterministic cleanup, once-per-run, atomic receipt
  globalThis.tap={getStorageSync:(key)=>store.get(key)??'',setStorageSync:(key,value)=>{store.set(key,value);},removeStorageSync:(key)=>{store.delete(key);},createRewardedVideoAd:()=>({onLoad(){},onError(){},onClose(){},load:async()=>{},show:async()=>{},destroy(){}})};
  const revivePolicy = { enabled:true, policyVersion:'revive-test', adUnitId:'debug-mock', placement:'spill-revive', maxRevivesPerRun:1, clearanceDu:40, autoDropDelayTicks:120, minForegroundSecondsFirstSession:0, requireTutorialComplete:true, requireFirstNaturalRunCompleted:true };
  const reviveOptions = { enabled:true, clearanceDu:40, autoDropDelayTicks:120 };
  const RTOP=rules.cup.inner_top_y_du, RRAD=rules.ingredients[0].radius_du, RECEIPT='77777777-7777-4777-8777-777777777777';
  const spillRun = SaveCodec.sealSnapshot({...makeRun(), tick:200, state:'PAUSED', score:40, maxLevel:2, currentLevel:1, nextLevel:2, nextEntityId:4,
    dropIndex:2, lastDropTick:198, rng:{algorithm:'xorshift32_v1_nonzero_seed',state:12345,drawCount:4},
    ingredients:[
      {entityId:1,level:2,positionDu:{x:375,y:600},velocityDuPerSecond:{x:0,y:0},angleRadians:0,angularVelocity:0,bornTick:0,dangerEligible:false,hasEnteredCup:true,spillTicks:0,sleeping:false},
      {entityId:2,level:1,positionDu:{x:375,y:RTOP+RRAD+4},velocityDuPerSecond:{x:0,y:0},angleRadians:0,angularVelocity:0,bornTick:100,dangerEligible:false,hasEnteredCup:true,spillTicks:29,sleeping:false},
      {entityId:3,level:1,positionDu:{x:375,y:RTOP+RRAD+20},velocityDuPerSecond:{x:0,y:0},angleRadians:0,angularVelocity:0,bornTick:150,dangerEligible:false,hasEnteredCup:true,spillTicks:0,sleeping:false},
    ], autoDrop:{...makeRun().autoDrop, pendingSpawn:{...makeRun().autoDrop.pendingSpawn, level:1}, nextDueTick:10000}, checksum:''});
  let cupReset=0, restoredBodies=0; const reviveAdapter={...adapter,createCup(){cupReset++;},restoreBodies(list){restoredBodies=list.length;}};
  const reviveEngine=new RunEngine(reviveAdapter,rules,RUN_ID,12345,spillRun,reviveOptions);reviveEngine.resume();
  const spillEvents=reviveEngine.advanceOneTick();const pendingSnap=reviveEngine.snapshot();
  check('RV-01 spill freezes into PAUSED with a pending failure instead of RunEnded',pendingSnap.state==='PAUSED'&&!!pendingSnap.revive.pendingFailure&&!spillEvents.some(e=>e.kind==='RunEnded')&&spillEvents.some(e=>e.kind==='SpillReviveOffered'));
  const spilledCandidate=reviveEngine.spillCandidate();
  check('RV-02 candidate removes spilled and rim-danger items but keeps a safe item',spilledCandidate.removedEntityIds.includes(2)&&spilledCandidate.removedEntityIds.includes(3)&&spilledCandidate.retainedEntityIds.length===1&&spilledCandidate.retainedEntityIds[0]===1);
  check('RV-02b candidate hash matches the frozen failure',pendingSnap.revive.pendingFailure.candidateHash===spilledCandidate.candidateHash&&pendingSnap.revive.pendingFailure.detectedTick===reviveEngine.tick);
  const projected=reviveEngine.projectRevive(RECEIPT);
  check('RV-03 projected revive is assisted, once-per-run and buffered by 120 ticks',projected.ok&&projected.data.revive.used===1&&projected.data.revive.pendingFailure===null&&projected.data.boardType==='assisted'&&projected.data.autoDrop.nextDueTick===reviveEngine.tick+120&&projected.data.ingredients.length===1);
  const sealedProjected=SaveCodec.sealSnapshot(projected.data);
  check('RV-04 projected revive passes schema-5 validation',SaveValidator.snapshot(sealedProjected).valid);
  const applied=reviveEngine.applyRevive(RECEIPT);
  check('RV-05 applying the receipt mutates the live engine exactly once',applied.ok&&reviveEngine.reviveReceiptId===RECEIPT&&reviveEngine.reviveUsed===1&&reviveEngine.snapshot().boardType==='assisted'&&cupReset>=1&&restoredBodies===1);
  const resumeAfterRevive=reviveEngine.resume();
  check('RV-06 revive keeps the two-second auto-drop buffer on resume',resumeAfterRevive.ok&&reviveEngine.snapshot().autoDrop.nextDueTick>=reviveEngine.tick+120);
  check('RV-07 non-UUID receipt is rejected',!reviveEngine.applyRevive('not-a-uuid').ok);
  const pendingRestore=new RunEngine(adapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  check('RV-08 restoring a frozen spill reopens the same deterministic candidate',pendingRestore.phase==='PAUSED'&&!!pendingRestore.spillPending&&pendingRestore.spillCandidate().candidateHash===pendingSnap.revive.pendingFailure.candidateHash&&pendingRestore.projectRevive(RECEIPT).ok);
  const declined=pendingRestore.declineRevive();
  check('RV-09 declining settles the frozen spill as SPILLED',!!declined&&declined.kind==='RunEnded'&&declined.reason==='SPILLED'&&pendingRestore.phase==='SETTLING'&&pendingRestore.snapshot().revive.pendingFailure===null);
  const exhaustedRun=SaveCodec.sealSnapshot({...sealedProjected,tick:220,state:'PAUSED',revive:{used:1,pendingFailure:null,committedReceiptId:RECEIPT},
    ingredients:[{entityId:1,level:1,positionDu:{x:375,y:RTOP+RRAD+4},velocityDuPerSecond:{x:0,y:0},angleRadians:0,angularVelocity:0,bornTick:0,dangerEligible:false,hasEnteredCup:true,spillTicks:29,sleeping:false}],
    maxLevel:2,nextEntityId:4,checksum:''});
  const exhaustedEngine=new RunEngine(adapter,rules,RUN_ID,12345,exhaustedRun,reviveOptions);exhaustedEngine.resume();const exhaustedEvents=exhaustedEngine.advanceOneTick();
  check('RV-10 a used revive cannot offer again and settles normally',!exhaustedEngine.spillPending&&exhaustedEngine.phase==='SETTLING'&&exhaustedEvents.some(e=>e.kind==='RunEnded'&&e.reason==='SPILLED'));

  const reviveLedger=ReviveLedger.normalize({dayKey:'2026-11-03',dailyGranted:3,pendingAttempt:null,receipts:[]},'2026-11-03');
  const sameRunOffer=ReviveLedger.checkOffer({policy:revivePolicy,capability:'SUPPORTED',profile:profileFor(pendingSnap,{rewardedRevive:reviveLedger}),run:pendingSnap,foregroundSeconds:60,tutorialComplete:true,nowMs:NOW});
  check('RV-11 daily revive cap has been removed; three prior same-day grants still allow this run',sameRunOffer.allowed&&ReviveLedger.grantedForDay(reviveLedger,'2026-11-03')===3);
  const revisePending={attemptId:'88888888-8888-4888-8888-888888888888',runId:RUN_ID,failureId:'99999999-9999-4999-8999-999999999999',policyVersion:'revive-test',amount:1,dayKey:'2026-11-03',startedAt:NOW};
  check('RV-12 pending attempt blocks a second offer for the same run',!ReviveLedger.checkOffer({policy:revivePolicy,capability:'SUPPORTED',profile:profileFor(spillRun,{rewardedRevive:{dayKey:'2026-11-03',dailyGranted:0,pendingAttempt:revisePending,receipts:[]}}),run:spillRun,foregroundSeconds:60,tutorialComplete:true,nowMs:NOW}).allowed);
  const reviveReceipt={...ReviveLedger.receiptFor(revisePending,NOW),rewardKind:'spill_revive',failureId:revisePending.failureId};
  const reviveGranted=ReviveLedger.grant({dayKey:'2026-11-03',dailyGranted:0,pendingAttempt:revisePending,receipts:[]},reviveReceipt,RUN_ID);
  check('RV-13 revive grant clears pending and is idempotent',reviveGranted.pendingAttempt===null&&reviveGranted.receipts.length===1&&ReviveLedger.hasReceipt(reviveGranted,revisePending.attemptId)&&ReviveLedger.grant(reviveGranted,reviveReceipt,RUN_ID).dailyGranted===reviveGranted.dailyGranted);
  check('RV-14 closed revive policy blocks the offer',!ReviveLedger.checkOffer({policy:{...revivePolicy,enabled:false},capability:'SUPPORTED',profile:profileFor(spillRun),run:spillRun,foregroundSeconds:60,tutorialComplete:true,nowMs:NOW}).allowed);

  const loadedRevive=SpillRevivePolicyLoader.validate(revivePolicy);
  check('RV-15 shipped revive policy shape validates',loadedRevive.ok&&loadedRevive.data.maxRevivesPerRun===1);
  check('RV-16 policy rejects more than one revive per run',!SpillRevivePolicyLoader.validate({...revivePolicy,maxRevivesPerRun:2}).ok);
  check('RV-17 policy rejects clearance outside 8..120du',!SpillRevivePolicyLoader.validate({...revivePolicy,clearanceDu:0}).ok&&!SpillRevivePolicyLoader.validate({...revivePolicy,clearanceDu:121}).ok);
  check('RV-18 policy rejects a non-revive placement',!SpillRevivePolicyLoader.validate({...revivePolicy,placement:'extra-shake'}).ok);
  const shippedReviveJson=JSON.parse(require('node:fs').readFileSync(path.join(project,'assets','resources','config','spill-revive-policy.json'),'utf8'));
  const shippedRevive=SpillRevivePolicyLoader.validate(shippedReviveJson);
  check('RV-30 shipped revive policy validates and stays formally disabled',shippedRevive.ok&&shippedRevive.data.enabled===false&&shippedRevive.data.adUnitId===null&&shippedRevive.data.maxRevivesPerRun===1&&shippedRevive.data.clearanceDu===40);

  delete globalThis.__milkteaSpillRevive;
  const reviveRepo=new LocalSaveRepository('revive-service');await reviveRepo.acquireWriteLease();
  let reviveBundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
  const reviveInitial=await reviveRepo.commitBundle(0,null,reviveBundle);let reviveRevision=reviveInitial.ok?reviveInitial.data.revision:0;
  const liveEngine=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let revivePaused=false,reviveNotice=null;
  const reviveHost={
    getActiveRunSnapshot:()=>liveEngine.snapshot(),getBundle:()=>reviveBundle,getSaveRevision:()=>reviveRevision,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,
    pauseForRewardedAd:()=>{revivePaused=true;},
    resumeFromRewardedAd:(notice)=>{revivePaused=false;reviveNotice=notice;},
    onSpillReviveChanged:()=>{},onSpillReviveCommitted:(next,revision)=>{reviveBundle=next;reviveRevision=revision;},
    projectRevive:(receiptId)=>liveEngine.projectRevive(receiptId),
    applyCommittedRevive:(receiptId)=>liveEngine.reviveReceiptId===receiptId||liveEngine.applyRevive(receiptId).ok,
    declineSpillRevive:()=>{liveEngine.declineRevive();},waitForSaveIdle:async()=>{},
  };
  const reviveProvider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true,data:undefined}),show:async(attemptId)=>({kind:'COMPLETED',attemptId}),dispose:()=>{}};
  const reviveService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},reviveRepo,()=>NOW);
  reviveService.bind(reviveHost);reviveService.setForegroundSeconds(60);
  check('RV-19 live spill offer is available',reviveService.canOffer()&&reviveService.getView().block===null);
  reviveService.openOffer();
  check('RV-20 opening the revive offer pauses the run',revivePaused&&reviveService.getView().phase==='OFFER');
  await reviveService.watch();
  const reviveView=reviveService.getView();
  check('RV-21 completed revive ad reaches GRANTED',reviveView.phase==='GRANTED');
  const revivedPersisted=await reviveRepo.readBundle();
  const revivedPayload=revivedPersisted.data.envelope.payload;
  check('RV-22 receipt and projected run commit atomically',revivedPersisted.ok&&revivedPayload.profile.rewardedRevive.receipts.length===1&&revivedPayload.profile.rewardedRevive.pendingAttempt===null&&revivedPayload.run.revive.used===1&&revivedPayload.run.revive.committedReceiptId===revivedPayload.profile.rewardedRevive.receipts[0].attemptId);
  check('RV-23 live engine revived exactly once',liveEngine.reviveUsed===1&&liveEngine.reviveReceiptId===revivedPayload.profile.rewardedRevive.receipts[0].attemptId);
  reviveService.acknowledgeGrant();
  check('RV-24 acknowledge returns to a safe pause',!revivePaused&&typeof reviveNotice==='string'&&reviveService.getView().phase==='IDLE');

  delete globalThis.__milkteaSpillRevive;
  const cancelSpillRepo=new LocalSaveRepository('revive-cancel');await cancelSpillRepo.acquireWriteLease();
  const cancelSpillRun=spillRun;let cancelSpillBundle={profile:profileFor(cancelSpillRun),run:cancelSpillRun,lastResult:null};
  const cancelSpillInitial=await cancelSpillRepo.commitBundle(0,null,cancelSpillBundle);let cancelRev=cancelSpillInitial.ok?cancelSpillInitial.data.revision:0;
  const cancelLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  const cancelReviveHost={...reviveHost,getActiveRunSnapshot:()=>cancelLive.snapshot(),getBundle:()=>cancelSpillBundle,getSaveRevision:()=>cancelRev,
    onSpillReviveCommitted:(next,revision)=>{cancelSpillBundle=next;cancelRev=revision;},projectRevive:(r)=>cancelLive.projectRevive(r),
    applyCommittedRevive:(r)=>cancelLive.reviveReceiptId===r||cancelLive.applyRevive(r).ok,declineSpillRevive:()=>{cancelLive.declineRevive();},pauseForRewardedAd:()=>{}};
  let cancelShowCount=0;
  const cancelSpillProvider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true,data:undefined}),show:async(attemptId)=>({kind:(++cancelShowCount===1?'CANCELLED':'COMPLETED'),attemptId,errorCode:cancelShowCount===1?'CLOSED_EARLY':undefined}),dispose:()=>{}};
  const cancelReviveService=SpillReviveService.create({provider:cancelSpillProvider,policy:revivePolicy},cancelSpillRepo,()=>NOW);
  cancelReviveService.bind(cancelReviveHost);cancelReviveService.setForegroundSeconds(60);cancelReviveService.openOffer();await cancelReviveService.watch();
  const cancelRevivePersisted=await cancelSpillRepo.readBundle();
  const cancelView=cancelReviveService.getView();
  check('RV-25 cancelled revive ad grants nothing, clears pending, keeps the run frozen and surfaces ERROR',
    cancelRevivePersisted.ok&&cancelRevivePersisted.data.envelope.payload.profile.rewardedRevive.receipts.length===0&&cancelRevivePersisted.data.envelope.payload.profile.rewardedRevive.pendingAttempt===null
    &&cancelLive.phase==='PAUSED'&&cancelLive.reviveUsed===0&&cancelView.phase==='ERROR'&&!cancelView.retrySettle&&!cancelView.pendingAttempt);
  cancelReviveService.retryWatch();await cancelReviveService.watch();
  const rewatchPersisted=await cancelSpillRepo.readBundle();
  const rewatchPayload=rewatchPersisted.data.envelope.payload;
  check('RV-25b rewatch after cancel grants exactly once with the same run id and score',
    cancelReviveService.getView().phase==='GRANTED'&&cancelLive.reviveUsed===1&&rewatchPersisted.ok
    &&rewatchPayload.run.runId===RUN_ID&&rewatchPayload.run.score===40&&rewatchPayload.profile.rewardedRevive.receipts.length===1);

  delete globalThis.__milkteaSpillRevive;
  const retryRepo=new LocalSaveRepository('revive-retry');await retryRepo.acquireWriteLease();
  let retryBundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};let retryRev=0;let retryCommitCount=0;
  const retryOriginal=retryRepo.commitBundle.bind(retryRepo);
  retryRepo.commitBundle=async(...args)=>{retryCommitCount++;if(retryCommitCount===2)return {ok:false,error:{code:'SAVE_CONFLICT',message:'injected settle failure'}};return retryOriginal(...args);};
  const retryInitial=await retryOriginal(0,null,retryBundle);retryRev=retryInitial.ok?retryInitial.data.revision:0;
  const retryLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  const retryHost={...reviveHost,getActiveRunSnapshot:()=>retryLive.snapshot(),getBundle:()=>retryBundle,getSaveRevision:()=>retryRev,
    onSpillReviveCommitted:(next,revision)=>{retryBundle=next;retryRev=revision;},projectRevive:(r)=>retryLive.projectRevive(r),
    applyCommittedRevive:(r)=>retryLive.reviveReceiptId===r||retryLive.applyRevive(r).ok,declineSpillRevive:()=>{retryLive.declineRevive();},pauseForRewardedAd:()=>{}};
  const retryService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},retryRepo,()=>NOW);
  retryService.bind(retryHost);retryService.setForegroundSeconds(60);retryService.openOffer();await retryService.watch();
  check('RV-26 failed revive save keeps the engine frozen and offers retry',retryService.getView().phase==='ERROR'&&retryService.getView().retrySettle&&retryLive.reviveUsed===0&&retryLive.spillPending!==null);
  retryCommitCount=999;
  await retryService.retrySettlement();
  check('RV-27 trusted retry grants exactly once after the save recovers',retryService.getView().phase==='GRANTED'&&retryLive.reviveUsed===1&&retryLive.reviveReceiptId!==null);

  // R2c: rebinding the host during a retry settlement must give the previous owner zero callbacks.
  delete globalThis.__milkteaSpillRevive;
  const r2cRepo=new LocalSaveRepository('revive-r2c');await r2cRepo.acquireWriteLease();
  let r2cBundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
  const r2cInitial=await r2cRepo.commitBundle(0,null,r2cBundle);let r2cRev=r2cInitial.ok?r2cInitial.data.revision:0;
  let r2cCommitCount=0;const r2cOriginal=r2cRepo.commitBundle.bind(r2cRepo);
  const r2cOriginalRead=r2cRepo.readBundle.bind(r2cRepo);
  let r2cReadDefer=null;
  const r2cWrappedRepo=Object.create(r2cRepo);
  r2cWrappedRepo.commitBundle=async(...args)=>{r2cCommitCount++;if(r2cCommitCount===2)return{ok:false,error:{code:'SAVE_CONFLICT',message:'fault'}};return r2cOriginal(...args);};
  r2cWrappedRepo.readBundle=async()=>{if(r2cReadDefer)await r2cReadDefer;return r2cOriginalRead();};
  const r2cLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let oldCommitCalls=0,oldApplyCalls=0;
  const oldHost={...reviveHost,getActiveRunSnapshot:()=>r2cLive.snapshot(),getBundle:()=>r2cBundle,getSaveRevision:()=>r2cRev,
    onSpillReviveCommitted:(n,r)=>{oldCommitCalls++;r2cBundle=n;r2cRev=r;},projectRevive:(r)=>r2cLive.projectRevive(r),
    applyCommittedRevive:(r)=>{oldApplyCalls++;return r2cLive.reviveReceiptId===r||r2cLive.applyRevive(r).ok;},declineSpillRevive:()=>r2cLive.declineRevive(),pauseForRewardedAd:()=>{}};
  const r2cService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},r2cWrappedRepo,()=>NOW);
  r2cService.bind(oldHost);r2cService.setForegroundSeconds(60);r2cService.openOffer();await r2cService.watch();
  check('R2c setup reaches retry-settle ERROR after an injected commit fault',r2cService.getView().phase==='ERROR'&&r2cService.getView().retrySettle&&r2cLive.reviveUsed===0);
  r2cReadDefer=new Promise((r)=>setTimeout(r,8));
  const beforeCommit=oldCommitCalls,beforeApply=oldApplyCalls;
  const r2cRetry=r2cService.retrySettlement();
  const otherLive=new RunEngine(reviveAdapter,rules,'other-run-id',99999,spillRun,reviveOptions);
  r2cService.bind({...oldHost,getActiveRunSnapshot:()=>otherLive.snapshot()});
  await r2cRetry;
  check('R2c rebinding host during retry settlement leaves the previous owner with zero callbacks',oldCommitCalls===beforeCommit&&oldApplyCalls===beforeApply);

  const budget=new ArtLoadBudget(0,1,15000);
  check('AB-01 14s foreground does not expire the 15s budget',(()=>{budget.advance(14000,true);return!budget.expired&&budget.remainingMs===1000;})());
  check('AB-02 15s foreground expires the budget',(()=>{budget.advance(1000,true);return budget.expired;})());
  const bgBudget=new ArtLoadBudget(0,2,15000);
  check('AB-03 background time never counts toward the deadline',(()=>{bgBudget.advance(60000,false);return!bgBudget.expired&&bgBudget.foregroundMs===0;})());
  const cancelBudget=new ArtLoadBudget(0,3,15000);let cancelSettled=false;
  const waiter=cancelBudget.cancelled().then(()=>{},()=>{cancelSettled=true;});cancelBudget.cancel();await waiter;
  check('AB-04 cancellation rejects pending waiters immediately',cancelSettled);

  RewardedAdCoordinator.release('spill-revive');RewardedAdCoordinator.release('extra-shake');
  check('RV-28 one rewarded slot is shared by both ad kinds',RewardedAdCoordinator.claim('spill-revive')&&!RewardedAdCoordinator.claim('extra-shake')&&!RewardedAdCoordinator.claim('spill-revive'));
  RewardedAdCoordinator.release('spill-revive');
  check('RV-29 releasing the slot allows the other ad kind',RewardedAdCoordinator.claim('extra-shake'));
  RewardedAdCoordinator.release('extra-shake');

  console.log(`\n${passed} checks passed, ${failures.length} failed`);
  if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
})().catch((error) => { console.error(error); process.exit(1); });
