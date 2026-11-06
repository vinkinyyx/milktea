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
const unhandledRejections = [];
process.on('unhandledRejection', (error) => unhandledRejections.push(error));
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
    applyCommittedExtraGrant: (amount) => serviceEngine.commitExtraGrant(amount).ok, waitForSaveIdle: async () => {},
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
  const cancelHost = { ...host, getActiveRunSnapshot: () => cancelEngine.snapshot(), getBundle: () => cancelBundle, getSaveRevision: () => cancelRevision, onRewardedShakeCommitted: (next, rev) => { cancelBundle = next; cancelRevision = rev; }, pauseForRewardedAd: () => cancelEngine.pause('AD'), applyCommittedExtraGrant: (amount) => cancelEngine.commitExtraGrant(amount).ok };
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
    onRewardedShakeCommitted: (next, revision) => { unsafeBundle = next; unsafeRevision = revision; }, pauseForRewardedAd: () => unsafeEngine.pause('AD'), applyCommittedExtraGrant: (amount) => unsafeEngine.commitExtraGrant(amount).ok };
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

  // AD05: native lifecycle ownership — idempotent destroy, independent off, partial creation/registration cleanup,
  // and late callbacks from a released instance must never settle a newer attempt.
  const makeLifecycleInstance=(overrides={})=>{
    const listeners={load:new Set(),error:new Set(),close:new Set()};const counts={load:0,error:0,close:0,destroy:0};
    const inst={onLoad:f=>listeners.load.add(f),offLoad:f=>{counts.load++;listeners.load.delete(f);},
      onError:f=>listeners.error.add(f),offError:f=>{counts.error++;listeners.error.delete(f);},
      onClose:f=>listeners.close.add(f),offClose:f=>{counts.close++;listeners.close.delete(f);},
      load:()=>Promise.resolve(),show:()=>Promise.resolve(),destroy:()=>{counts.destroy++;},
      emit:(key,value)=>{for(const f of [...listeners[key]])f(value);},counts,...overrides};
    return inst;
  };
  const idemInst=makeLifecycleInstance();globalThis.tap={createRewardedVideoAd:()=>idemInst};
  const idemProvider=new TapRewardedAdProvider(providerPolicy);await idemProvider.prepare();idemProvider.dispose();idemProvider.dispose();
  idemInst.emit('close',{isEnded:true}); // late close after dispose: ignored, no throw
  check('AD05-a repeated dispose unregisters each listener once and destroys once',
    idemInst.counts.load===1&&idemInst.counts.error===1&&idemInst.counts.close===1&&idemInst.counts.destroy===1);
  const throwOffInst=makeLifecycleInstance({offLoad:()=>{throw new Error('off load');}});
  globalThis.tap={createRewardedVideoAd:()=>throwOffInst};
  const throwOffProvider=new TapRewardedAdProvider(providerPolicy);await throwOffProvider.prepare();
  let throwOffEscaped=false;try{throwOffProvider.dispose();}catch{throwOffEscaped=true;}
  check('AD05-b a throwing offLoad does not block the other listeners or destroy',
    !throwOffEscaped&&throwOffInst.counts.error===1&&throwOffInst.counts.close===1&&throwOffInst.counts.destroy===1);
  const missingOffInst=makeLifecycleInstance();delete missingOffInst.offClose;
  globalThis.tap={createRewardedVideoAd:()=>missingOffInst};
  const missingProvider=new TapRewardedAdProvider(providerPolicy);const missingPrepare=await missingProvider.prepare();
  check('AD05-c a partial interface is rejected and the created instance is destroyed',
    !missingPrepare.ok&&missingOffInst.counts.destroy===1);
  const partialInst=makeLifecycleInstance();partialInst.onError=()=>{throw new Error('register error');};
  globalThis.tap={createRewardedVideoAd:()=>partialInst};
  const partialProvider=new TapRewardedAdProvider(providerPolicy);const partialPrepare=await partialProvider.prepare();
  check('AD05-d a registration throw unregisters the registered listeners and destroys once',
    !partialPrepare.ok&&partialInst.counts.load===1&&partialInst.counts.destroy===1);
  const lateInst=makeLifecycleInstance();globalThis.tap={createRewardedVideoAd:()=>lateInst};
  const lateProvider=new TapRewardedAdProvider(providerPolicy);await lateProvider.prepare();
  let lateSettles=0;const lateAttempt='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const latePromise=lateProvider.show(lateAttempt).then(value=>{lateSettles++;return value;});
  lateInst.emit('close',{isEnded:true});lateInst.emit('close',{isEnded:true});
  check('AD05-e duplicate close settles once and destroys the released instance once',
    (await latePromise).kind==='COMPLETED'&&lateSettles===1&&lateInst.counts.destroy===1);

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
  const earlyBlocked = RewardLedger.checkOffer({ policy, capability: 'SUPPORTED', profile: profileFor(runNow, { firstNaturalRunCompleted: false }), run: runNow, foregroundSeconds: 59, tutorialComplete: true, nowMs: NOW });
  check('short foreground blocks the offer before the first natural run', !earlyBlocked.allowed && earlyBlocked.block === 'FOREGROUND_REQUIRED');
  const veteranOffer = RewardLedger.checkOffer({ policy, capability: 'SUPPORTED', profile: profileFor(runNow), run: runNow, foregroundSeconds: 0, tutorialComplete: true, nowMs: NOW });
  check('the first-session window does not permanently gate a completed first run', veteranOffer.allowed);

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

  // RC01: a durable receipt whose live application fails must never report success; recovery stays free of ads.
  delete globalThis.__milkteaSpillRevive;
  const rc01Repo=new LocalSaveRepository('revive-apply-fail');await rc01Repo.acquireWriteLease();
  let rc01Bundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
  const rc01Initial=await rc01Repo.commitBundle(0,null,rc01Bundle);let rc01Rev=rc01Initial.ok?rc01Initial.data.revision:0;
  const rc01Live=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let rc01Apply=false,rc01ShowCount=0;
  const rc01Host={getActiveRunSnapshot:()=>rc01Live.snapshot(),getBundle:()=>rc01Bundle,getSaveRevision:()=>rc01Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{rc01Live.pause('AD');},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{rc01Bundle=n;rc01Rev=r;},projectRevive:(r)=>rc01Live.projectRevive(r),
    applyCommittedRevive:(r)=>rc01Apply&&(rc01Live.reviveReceiptId===r||rc01Live.applyRevive(r).ok),declineSpillRevive:()=>{rc01Live.declineRevive();},waitForSaveIdle:async()=>{}};
  const rc01Provider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true,data:undefined}),
    show:async(attemptId)=>{rc01ShowCount++;return{kind:'COMPLETED',attemptId};},dispose:()=>{}};
  const rc01Service=SpillReviveService.create({provider:rc01Provider,policy:revivePolicy},rc01Repo,()=>NOW);
  rc01Service.bind(rc01Host);rc01Service.setForegroundSeconds(60);rc01Service.openOffer();await rc01Service.watch();
  const rc01View=rc01Service.getView();const rc01Disk=await rc01Repo.readBundle();
  check('RC01-a a committed receipt with failed live application is ERROR, not GRANTED',
    rc01View.phase==='ERROR'&&rc01View.retrySettle&&rc01Live.reviveUsed===0&&rc01Disk.ok
    &&rc01Disk.data.envelope.payload.profile.rewardedRevive.receipts.length===1&&rc01Disk.data.envelope.payload.run.revive.used===1);
  rc01Apply=true;
  await rc01Service.retrySettlement();
  check('RC01-b committed-receipt recovery retries for free and grants exactly once',
    rc01Service.getView().phase==='GRANTED'&&rc01Live.reviveUsed===1&&rc01ShowCount===1);

  // R2c: a host handoff during a retry settlement must leave the previous owner with zero callbacks.
  // Two distinct scenarios: same run / new owner, and a genuinely new run (valid UUID, verified changed snapshot).
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
  const oldHost={getActiveRunSnapshot:()=>r2cLive.snapshot(),getBundle:()=>r2cBundle,getSaveRevision:()=>r2cRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{oldCommitCalls++;r2cBundle=n;r2cRev=r;},projectRevive:(r)=>r2cLive.projectRevive(r),
    applyCommittedRevive:(r)=>{oldApplyCalls++;return r2cLive.reviveReceiptId===r||r2cLive.applyRevive(r).ok;},declineSpillRevive:()=>r2cLive.declineRevive(),waitForSaveIdle:async()=>{}};
  const r2cService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},r2cWrappedRepo,()=>NOW);
  r2cService.bind(oldHost);r2cService.setForegroundSeconds(60);r2cService.openOffer();await r2cService.watch();
  check('R2c setup reaches retry-settle ERROR after an injected commit fault',r2cService.getView().phase==='ERROR'&&r2cService.getView().retrySettle&&r2cLive.reviveUsed===0);

  // R2c-1: same run, a different host object takes ownership while the retry read is in flight.
  const r2cDisk=await r2cOriginalRead();
  let nextBundle=r2cDisk.ok?r2cDisk.data.envelope.payload:r2cBundle;let nextRev=r2cDisk.ok?r2cDisk.data.envelope.revision:r2cRev;
  const nextSameRunLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let nextCommitCalls=0,nextApplyCalls=0;
  const nextSameRunHost={getActiveRunSnapshot:()=>nextSameRunLive.snapshot(),getBundle:()=>nextBundle,getSaveRevision:()=>nextRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{nextCommitCalls++;nextBundle=n;nextRev=r;},projectRevive:(r)=>nextSameRunLive.projectRevive(r),
    applyCommittedRevive:(r)=>{nextApplyCalls++;return nextSameRunLive.reviveReceiptId===r||nextSameRunLive.applyRevive(r).ok;},
    declineSpillRevive:()=>{nextSameRunLive.declineRevive();},waitForSaveIdle:async()=>{}};
  r2cReadDefer=new Promise((r)=>setTimeout(r,8));
  const beforeCommit=oldCommitCalls,beforeApply=oldApplyCalls;
  const r2cRetry=r2cService.retrySettlement();
  r2cService.bind(nextSameRunHost);
  await r2cRetry;
  await new Promise((r)=>setTimeout(r,30));
  check('R2c-1 same-run handoff during retry leaves the previous owner with zero callbacks',oldCommitCalls===beforeCommit&&oldApplyCalls===beforeApply);
  check('R2c-1 the new owner receives the stale-pending cleanup itself',nextCommitCalls===1&&nextBundle.profile.rewardedRevive.pendingAttempt===null);
  check('R2c-1 same-run handoff is not stranded',r2cService.getView().phase==='IDLE'&&!r2cService.getView().pendingAttempt,JSON.stringify(r2cService.getView()));

  // R2c-2: a genuinely new run must use a valid UUID and a snapshot whose runId really changed.
  const OTHER_RUN_ID='33333333-3333-4333-8333-333333333333';
  const otherSeed=SaveCodec.sealSnapshot({...pendingSnap,runId:OTHER_RUN_ID,checksum:''});
  const otherProbe=new RunEngine(reviveAdapter,rules,OTHER_RUN_ID,99999,SaveCodec.sealSnapshot(otherSeed),reviveOptions);
  const otherHash=otherProbe.spillCandidate().candidateHash;
  // The candidate hash binds the run identity, so re-seal the frozen failure for the new run instead of reusing it.
  const otherSnap=SaveCodec.sealSnapshot({...otherSeed,revive:{...otherSeed.revive,pendingFailure:{...otherSeed.revive.pendingFailure,candidateHash:otherHash}},checksum:''});
  const otherCommit=await r2cOriginal(nextRev,RUN_ID,{profile:profileFor(otherSnap),run:otherSnap,lastResult:null});
  check('R2c-2 setup commits a distinct run id for the new owner',otherCommit.ok&&otherSnap.runId!==RUN_ID,JSON.stringify(otherCommit));
  let otherBundle=otherCommit.ok?{profile:profileFor(otherSnap),run:otherSnap,lastResult:null}:null;let otherRev=otherCommit.ok?otherCommit.data.revision:0;
  const otherLive=new RunEngine(reviveAdapter,rules,OTHER_RUN_ID,99999,SaveCodec.sealSnapshot(otherSnap),reviveOptions);
  check('R2c-2 the new engine snapshot keeps its own valid run id',otherLive.snapshot().runId===OTHER_RUN_ID&&otherSnap.runId!==r2cLive.snapshot().runId);
  let otherCommitCalls=0,otherApplyCalls=0;
  const otherHost={getActiveRunSnapshot:()=>otherLive.snapshot(),getBundle:()=>otherBundle,getSaveRevision:()=>otherRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{otherLive.pause('AD');},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{otherCommitCalls++;otherBundle=n;otherRev=r;},projectRevive:(r)=>otherLive.projectRevive(r),
    applyCommittedRevive:(r)=>{otherApplyCalls++;return otherLive.reviveReceiptId===r||otherLive.applyRevive(r).ok;},
    declineSpillRevive:()=>{otherLive.declineRevive();},waitForSaveIdle:async()=>{}};
  r2cService.bind(otherHost);r2cService.setForegroundSeconds(60);r2cService.openOffer();await r2cService.watch();
  check('R2c-2 the previous owner still receives zero callbacks after the new run recovers',
    oldCommitCalls===beforeCommit&&oldApplyCalls===beforeApply);
  check('R2c-2 the new run recovers through its own callbacks and bundle',
    r2cService.getView().phase==='GRANTED'&&otherLive.reviveUsed===1&&otherApplyCalls>=1&&otherCommitCalls>=2
    &&otherBundle.profile.rewardedRevive.receipts.length===1&&otherBundle.run.runId===OTHER_RUN_ID,
    JSON.stringify({view:r2cService.getView(),used:otherLive.reviveUsed,apply:otherApplyCalls,commit:otherCommitCalls,
      receipts:otherBundle?.profile.rewardedRevive?.receipts?.length,runId:otherBundle?.run?.runId}));

  // OW02: host B's stale cleanup commit is still in flight when host C takes over the same run.
  // B must get zero callbacks; C must re-read the newest revision and finish a fresh attempt without losing the reward.
  delete globalThis.__milkteaSpillRevive;
  const cloneJson=(value)=>JSON.parse(JSON.stringify(value));
  const owStalePending={attemptId:'44444444-4444-4444-8444-444444444441',runId:RUN_ID,failureId:pendingSnap.revive.pendingFailure.failureId,
    policyVersion:'revive-test',amount:1,dayKey:'2026-11-03',startedAt:NOW-1000};
  const owBundleWithPending=()=>({profile:profileFor(pendingSnap,{rewardedRevive:{dayKey:'2026-11-03',dailyGranted:0,
    pendingAttempt:cloneJson(owStalePending),receipts:[]}}),run:SaveCodec.sealSnapshot(pendingSnap),lastResult:null});
  const ow02Repo=new LocalSaveRepository('revive-ow02');await ow02Repo.acquireWriteLease();
  let ow02Bundle=owBundleWithPending();
  const ow02Init=await ow02Repo.commitBundle(0,null,ow02Bundle);let ow02Rev=ow02Init.ok?ow02Init.data.revision:0;
  const ow02OriginalCommit=ow02Repo.commitBundle.bind(ow02Repo),ow02OriginalRead=ow02Repo.readBundle.bind(ow02Repo);
  let ow02GateResolve=null,ow02Gated=false;
  const ow02Wrapped=Object.create(ow02Repo);
  ow02Wrapped.commitBundle=async(...args)=>{if(!ow02Gated){ow02Gated=true;await new Promise((r)=>{ow02GateResolve=r;});}return ow02OriginalCommit(...args);};
  const ow02LiveB=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let ow02BCallbacks=0;
  const ow02HostB={getActiveRunSnapshot:()=>ow02LiveB.snapshot(),getBundle:()=>ow02Bundle,getSaveRevision:()=>ow02Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{ow02BCallbacks++;ow02Bundle=n;ow02Rev=r;},projectRevive:(r)=>ow02LiveB.projectRevive(r),
    applyCommittedRevive:(r)=>ow02LiveB.reviveReceiptId===r||ow02LiveB.applyRevive(r).ok,declineSpillRevive:()=>ow02LiveB.declineRevive(),waitForSaveIdle:async()=>{}};
  const ow02Service=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},ow02Wrapped,()=>NOW);
  ow02Service.bind(ow02HostB);
  await new Promise((r)=>setTimeout(r,10));
  check('OW02 setup keeps the superseded cleanup commit in flight',ow02Gated);
  const ow02LiveC=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let ow02CBundle=cloneJson(ow02Bundle),ow02CRev=ow02Rev,ow02CCallbacks=0;
  const ow02HostC={getActiveRunSnapshot:()=>ow02LiveC.snapshot(),getBundle:()=>ow02CBundle,getSaveRevision:()=>ow02CRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{ow02CCallbacks++;ow02CBundle=n;ow02CRev=r;},projectRevive:(r)=>ow02LiveC.projectRevive(r),
    applyCommittedRevive:(r)=>ow02LiveC.reviveReceiptId===r||ow02LiveC.applyRevive(r).ok,declineSpillRevive:()=>ow02LiveC.declineRevive(),waitForSaveIdle:async()=>{}};
  ow02Service.bind(ow02HostC);
  ow02GateResolve();
  await new Promise((r)=>setTimeout(r,25));
  const ow02Disk=await ow02OriginalRead();
  check('OW02-a the superseded owner B receives zero callbacks after C takes over',ow02BCallbacks===0);
  check('OW02-b the in-flight cleanup still lands once on disk',ow02Disk.ok
    &&ow02Disk.data.envelope.payload.profile.rewardedRevive.pendingAttempt===null&&ow02Disk.data.envelope.revision===ow02Rev+1,
    JSON.stringify({ok:ow02Disk.ok,rev:ow02Disk.ok?ow02Disk.data.envelope.revision:null,expect:ow02Rev+1}));
  ow02CBundle=ow02Disk.data.envelope.payload;ow02CRev=ow02Disk.data.envelope.revision;
  ow02Service.bind(ow02HostC);ow02Service.setForegroundSeconds(60);ow02Service.openOffer();await ow02Service.watch();
  const ow02After=await ow02OriginalRead();
  check('OW02-c host C starts from the newest revision and completes a fresh attempt without losing the reward',
    ow02Service.getView().phase==='GRANTED'&&ow02LiveC.reviveUsed===1&&ow02CCallbacks>=1&&ow02After.ok
    &&ow02After.data.envelope.payload.profile.rewardedRevive.receipts.length===1,JSON.stringify(ow02Service.getView()));

  // OW03: stale cleanup must survive CAS conflicts, repository throws and a newer pending written mid-cleanup.
  delete globalThis.__milkteaSpillRevive;
  const ow03aRepo=new LocalSaveRepository('revive-ow03a');await ow03aRepo.acquireWriteLease();
  let ow03aBundle=owBundleWithPending();
  const ow03aInit=await ow03aRepo.commitBundle(0,null,ow03aBundle);let ow03aRev=ow03aInit.ok?ow03aInit.data.revision:0;
  const ow03aWrapped=Object.create(ow03aRepo);
  ow03aWrapped.commitBundle=async()=>({ok:false,error:{code:'SAVE_CONFLICT',message:'injected cleanup conflict'}});
  const ow03aLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let ow03aCallbacks=0;
  const ow03aHost={getActiveRunSnapshot:()=>ow03aLive.snapshot(),getBundle:()=>ow03aBundle,getSaveRevision:()=>ow03aRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{ow03aCallbacks++;ow03aBundle=n;ow03aRev=r;},projectRevive:(r)=>ow03aLive.projectRevive(r),
    applyCommittedRevive:(r)=>ow03aLive.reviveReceiptId===r||ow03aLive.applyRevive(r).ok,declineSpillRevive:()=>ow03aLive.declineRevive(),waitForSaveIdle:async()=>{}};
  const ow03aService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},ow03aWrapped,()=>NOW);
  ow03aService.bind(ow03aHost);
  await new Promise((r)=>setTimeout(r,25));
  const ow03aDisk=await ow03aRepo.readBundle();
  check('OW03-a a CAS conflict during stale cleanup keeps the record without callbacks and stays actionable',
    ow03aCallbacks===0&&ow03aDisk.ok&&ow03aDisk.data.envelope.payload.profile.rewardedRevive.pendingAttempt?.attemptId===owStalePending.attemptId
    &&ow03aService.getView().phase==='IDLE'&&ow03aService.getView().pendingAttempt===true);

  delete globalThis.__milkteaSpillRevive;
  const ow03bRepo=new LocalSaveRepository('revive-ow03b');await ow03bRepo.acquireWriteLease();
  let ow03bBundle=owBundleWithPending();
  const ow03bInit=await ow03bRepo.commitBundle(0,null,ow03bBundle);let ow03bRev=ow03bInit.ok?ow03bInit.data.revision:0;
  const ow03bOriginalRead=ow03bRepo.readBundle.bind(ow03bRepo);
  let ow03bThrowOnce=true;
  const ow03bWrapped=Object.create(ow03bRepo);
  ow03bWrapped.readBundle=async()=>{if(ow03bThrowOnce){ow03bThrowOnce=false;throw new Error('storage offline');}return ow03bOriginalRead();};
  const ow03bLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let ow03bCallbacks=0;
  const ow03bHost={getActiveRunSnapshot:()=>ow03bLive.snapshot(),getBundle:()=>ow03bBundle,getSaveRevision:()=>ow03bRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{ow03bCallbacks++;ow03bBundle=n;ow03bRev=r;},projectRevive:(r)=>ow03bLive.projectRevive(r),
    applyCommittedRevive:(r)=>ow03bLive.reviveReceiptId===r||ow03bLive.applyRevive(r).ok,declineSpillRevive:()=>ow03bLive.declineRevive(),waitForSaveIdle:async()=>{}};
  const ow03bService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},ow03bWrapped,()=>NOW);
  ow03bService.bind(ow03bHost);
  await new Promise((r)=>setTimeout(r,20));
  const ow03bBefore=await ow03bOriginalRead();
  check('OW03-b a throwing repository is contained and leaves the pending record for a later retry',
    ow03bBefore.ok&&ow03bBefore.data.envelope.payload.profile.rewardedRevive.pendingAttempt?.attemptId===owStalePending.attemptId&&ow03bCallbacks===0);
  ow03bService.bind(ow03bHost);
  await new Promise((r)=>setTimeout(r,25));
  const ow03bAfter=await ow03bOriginalRead();
  check('OW03-b the next bind retries the cleanup and notifies only the current owner',
    ow03bAfter.ok&&ow03bAfter.data.envelope.payload.profile.rewardedRevive.pendingAttempt===null&&ow03bCallbacks===1);

  delete globalThis.__milkteaSpillRevive;
  const ow03cRepo=new LocalSaveRepository('revive-ow03c');await ow03cRepo.acquireWriteLease();
  let ow03cBundle=owBundleWithPending();
  const ow03cInit=await ow03cRepo.commitBundle(0,null,ow03cBundle);let ow03cRev=ow03cInit.ok?ow03cInit.data.revision:0;
  const ow03cOriginalRead=ow03cRepo.readBundle.bind(ow03cRepo),ow03cOriginalCommit=ow03cRepo.commitBundle.bind(ow03cRepo);
  let ow03cRelease=null;const ow03cGate=new Promise((r)=>{ow03cRelease=r;});let ow03cDefer=true;
  const ow03cWrapped=Object.create(ow03cRepo);
  ow03cWrapped.readBundle=async()=>{if(ow03cDefer){ow03cDefer=false;await ow03cGate;}return ow03cOriginalRead();};
  const ow03cLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  let ow03cCallbacks=0;
  const ow03cHost={getActiveRunSnapshot:()=>ow03cLive.snapshot(),getBundle:()=>ow03cBundle,getSaveRevision:()=>ow03cRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onSpillReviveChanged:()=>{},
    onSpillReviveCommitted:(n,r)=>{ow03cCallbacks++;ow03cBundle=n;ow03cRev=r;},projectRevive:(r)=>ow03cLive.projectRevive(r),
    applyCommittedRevive:(r)=>ow03cLive.reviveReceiptId===r||ow03cLive.applyRevive(r).ok,declineSpillRevive:()=>ow03cLive.declineRevive(),waitForSaveIdle:async()=>{}};
  const ow03cService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},ow03cWrapped,()=>NOW);
  ow03cService.bind(ow03cHost);
  await new Promise((r)=>setTimeout(r,10));
  const owNewPending={...owStalePending,attemptId:'55555555-5555-4555-8555-555555555551'};
  const owNewBundle=cloneJson(ow03cBundle);
  owNewBundle.profile.rewardedRevive={...owNewBundle.profile.rewardedRevive,pendingAttempt:owNewPending};
  const owNewCommit=await ow03cOriginalCommit(ow03cRev,RUN_ID,owNewBundle);
  check('OW03-c setup writes a newer pending while the old cleanup is still reading',owNewCommit.ok,JSON.stringify(owNewCommit));
  ow03cRelease();
  await new Promise((r)=>setTimeout(r,25));
  const ow03cDisk=await ow03cOriginalRead();
  check('OW03-c the old cleanup never clears the newer pending and reports no callback',
    ow03cDisk.ok&&ow03cDisk.data.envelope.payload.profile.rewardedRevive.pendingAttempt?.attemptId===owNewPending.attemptId&&ow03cCallbacks===0);
  ow03cBundle=ow03cDisk.data.envelope.payload;ow03cRev=ow03cDisk.data.envelope.revision;
  const ow03cBeforeRev=ow03cRev;
  ow03cService.bind(ow03cHost);
  await new Promise((r)=>setTimeout(r,25));
  const ow03cFinal=await ow03cOriginalRead();
  check('OW03-c the next owner starts from the newest revision and resolves the preserved pending exactly once',
    ow03cFinal.ok&&ow03cFinal.data.envelope.payload.profile.rewardedRevive.pendingAttempt===null&&ow03cCallbacks===1
    &&ow03cFinal.data.envelope.revision===ow03cBeforeRev+1,
    JSON.stringify({ok:ow03cFinal.ok,pending:ow03cFinal.ok?ow03cFinal.data.envelope.payload.profile.rewardedRevive.pendingAttempt:null,
      callbacks:ow03cCallbacks,rev:ow03cFinal.ok?ow03cFinal.data.envelope.revision:null,expect:ow03cBeforeRev+1}));

  const budget=new ArtLoadBudget(0,1,15000);
  check('AB-01 14s foreground does not expire the 15s budget',(()=>{budget.advance(14000,true);return!budget.expired&&budget.remainingMs===1000;})());
  check('AB-02 15s foreground expires the budget',(()=>{budget.advance(1000,true);return budget.expired;})());
  const bgBudget=new ArtLoadBudget(0,2,15000);
  check('AB-03 background time never counts toward the deadline',(()=>{bgBudget.advance(60000,false);return!bgBudget.expired&&bgBudget.foregroundMs===0;})());
  const cancelBudget=new ArtLoadBudget(0,3,15000);let cancelSettled=false;
  const waiter=cancelBudget.cancelled().then(()=>{},()=>{cancelSettled=true;});cancelBudget.cancel();await waiter;
  check('AB-04 cancellation rejects pending waiters immediately',cancelSettled);

  // RV-32: rebinding while an ad batch is mid-flight must not strand the new host in a transient phase.
  RewardedAdCoordinator.release('spill-revive');RewardedAdCoordinator.release('extra-shake');
  delete globalThis.__milkteaSpillRevive;
  const rv32Repo=new LocalSaveRepository('revive-rv32');await rv32Repo.acquireWriteLease();
  let rv32Bundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
  const rv32Init=await rv32Repo.commitBundle(0,null,rv32Bundle);let rv32Rev=rv32Init.ok?rv32Init.data.revision:0;
  const rv32Live=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  const rv32Host={...reviveHost,getActiveRunSnapshot:()=>rv32Live.snapshot(),getBundle:()=>rv32Bundle,getSaveRevision:()=>rv32Rev,
    onSpillReviveCommitted:(n,r)=>{rv32Bundle=n;rv32Rev=r;},projectRevive:(r)=>rv32Live.projectRevive(r),
    applyCommittedRevive:(r)=>rv32Live.reviveReceiptId===r||rv32Live.applyRevive(r).ok,declineSpillRevive:()=>rv32Live.declineRevive(),pauseForRewardedAd:()=>{}};
  const rv32Provider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true,data:undefined}),show:async(attemptId)=>({kind:'COMPLETED',attemptId}),dispose:()=>{}};
  const rv32Service=SpillReviveService.create({provider:rv32Provider,policy:revivePolicy},rv32Repo,()=>NOW);
  rv32Service.bind(rv32Host);rv32Service.setForegroundSeconds(60);rv32Service.openOffer();
  const rv32Watch=rv32Service.watch();
  check('RV-32a a new ad batch reports a transient phase',rv32Service.getView().phase==='PREPARING');
  const rv32Next=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  rv32Service.bind({...rv32Host,getActiveRunSnapshot:()=>rv32Next.snapshot(),projectRevive:(r)=>rv32Next.projectRevive(r),
    applyCommittedRevive:(r)=>rv32Next.reviveReceiptId===r||rv32Next.applyRevive(r).ok,declineSpillRevive:()=>rv32Next.declineRevive()});
  const rv32View=rv32Service.getView();
  check('RV-32b host handoff clears PREPARING/SHOWING/SETTLING instead of stranding the new host',rv32View.phase==='IDLE'&&!rv32View.pendingAttempt,JSON.stringify(rv32View));
  await rv32Watch;
  check('RV-32c the superseded completion cannot grant on either host',rv32Next.reviveUsed===0&&rv32Live.reviveUsed===0&&rv32Bundle.profile.rewardedRevive.receipts.length===0&&rv32Service.getView().phase!=='GRANTED');

  // RV-31: a receipt already committed for this run is owned — never re-offered after a rebind.
  delete globalThis.__milkteaSpillRevive;
  const rv31Repo=new LocalSaveRepository('revive-rv31');await rv31Repo.acquireWriteLease();
  let rv31Bundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
  const rv31Init=await rv31Repo.commitBundle(0,null,rv31Bundle);let rv31Rev=rv31Init.ok?rv31Init.data.revision:0;
  const rv31Live=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  const rv31Host={...reviveHost,getActiveRunSnapshot:()=>rv31Live.snapshot(),getBundle:()=>rv31Bundle,getSaveRevision:()=>rv31Rev,
    onSpillReviveCommitted:(n,r)=>{rv31Bundle=n;rv31Rev=r;},projectRevive:(r)=>rv31Live.projectRevive(r),
    applyCommittedRevive:(r)=>rv31Live.reviveReceiptId===r||rv31Live.applyRevive(r).ok,declineSpillRevive:()=>rv31Live.declineRevive(),pauseForRewardedAd:()=>{}};
  const rv31Service=SpillReviveService.create({provider:rv32Provider,policy:revivePolicy},rv31Repo,()=>NOW);
  rv31Service.bind(rv31Host);rv31Service.setForegroundSeconds(60);rv31Service.openOffer();await rv31Service.watch();
  check('RV-31a the first watch commits a revive receipt',rv31Live.reviveUsed===1&&rv31Bundle.profile.rewardedRevive.receipts.length===1);
  rv31Service.bind({...rv31Host,getActiveRunSnapshot:()=>new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions).snapshot()});
  check('RV-31b a committed revive receipt is never re-sold on the same run',rv31Service.getView().phase==='GRANTED'&&!rv31Service.canOffer(),JSON.stringify(rv31Service.getView()));

  // RS-30: a committed extra-shake receipt must be restored for free, never re-offered.
  delete globalThis.__milkteaRewardedShake;
  const rs30Run=makeRun();
  const rs30Repo=new LocalSaveRepository('shake-rs30');await rs30Repo.acquireWriteLease();
  let rs30Bundle={profile:profileFor(rs30Run),run:rs30Run,lastResult:null};
  const rs30Init=await rs30Repo.commitBundle(0,null,rs30Bundle);let rs30Rev=rs30Init.ok?rs30Init.data.revision:0;
  const rs30Engine=new RunEngine(adapter,rules,RUN_ID,12345,rs30Run);
  const rs30Host={getActiveRunSnapshot:()=>rs30Engine.snapshot(),getBundle:()=>rs30Bundle,getSaveRevision:()=>rs30Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{rs30Engine.pause('AD');},resumeFromRewardedAd:()=>{},
    onRewardedShakeChanged:()=>{},onRewardedShakeCommitted:(n,r)=>{rs30Bundle=n;rs30Rev=r;},
    applyCommittedExtraGrant:(amount)=>rs30Engine.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const rs30Service=RewardedShakeService.create({provider:rv32Provider,policy},rs30Repo,()=>NOW);
  rs30Service.bind(rs30Host);rs30Service.setForegroundSeconds(60);rs30Service.openOffer();await rs30Service.watch();
  check('RS-30a the first watch grants one extra shake and stores a receipt',rs30Engine.snapshot().shake.extraGranted===1&&rs30Bundle.profile.rewardedShake.receipts.length===1);
  const rs30Restarted=new RunEngine(adapter,rules,RUN_ID,12345,rs30Run);
  rs30Service.bind({...rs30Host,getActiveRunSnapshot:()=>rs30Restarted.snapshot(),applyCommittedExtraGrant:(amount)=>rs30Restarted.commitExtraGrant(amount).ok});
  check('RS-30b a committed extra-shake receipt is restored without a second ad',rs30Restarted.snapshot().shake.extraGranted===1&&rs30Service.getView().phase==='GRANTED'&&!rs30Service.canOffer(),JSON.stringify(rs30Service.getView()));

  // RC02: several committed extra-shake receipts must restore the persisted TOTAL, once, without touching used shakes.
  delete globalThis.__milkteaRewardedShake;
  const rc02Run=makeRun();
  const rc02Persisted=SaveCodec.sealSnapshot({...rc02Run,shake:{...rc02Run.shake,extraGranted:3,extraUsed:1}});
  const rc02Receipts=['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3']
    .map((attemptId,index)=>RewardLedger.receiptFor({attemptId,runId:RUN_ID,policyVersion:'rc02',amount:1,dayKey:'2026-11-03',startedAt:NOW+index},NOW));
  const rc02Repo=new LocalSaveRepository('shake-rc02');await rc02Repo.acquireWriteLease();
  let rc02Bundle={profile:profileFor(rc02Run,{rewardedShake:{dayKey:RewardLedger.dayKey(NOW),dailyGranted:3,pendingAttempt:null,receipts:rc02Receipts}}),run:rc02Persisted,lastResult:null};
  const rc02Initial=await rc02Repo.commitBundle(0,null,rc02Bundle);let rc02Rev=rc02Initial.ok?rc02Initial.data.revision:0;
  const rc02MemSnap=SaveCodec.sealSnapshot({...rc02Run,shake:{...rc02Run.shake,extraGranted:1,extraUsed:1}});
  const rc02Engine=new RunEngine(adapter,rules,RUN_ID,12345,rc02MemSnap);
  const rc02Host={getActiveRunSnapshot:()=>rc02Engine.snapshot(),getBundle:()=>rc02Bundle,getSaveRevision:()=>rc02Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{rc02Bundle=n;rc02Rev=r;},applyCommittedExtraGrant:(amount)=>rc02Engine.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const rc02Service=RewardedShakeService.create({provider:rv32Provider,policy},rc02Repo,()=>NOW);
  rc02Service.bind(rc02Host);rc02Service.setForegroundSeconds(60);
  const rc02Snap=rc02Engine.snapshot();
  check('RC02-a committed extra shakes restore the persisted total, not a single unit',
    rc02Snap.shake.extraGranted===3&&rc02Snap.shake.extraUsed===1&&rc02Service.getView().phase==='GRANTED');
  rc02Service.bind(rc02Host);
  const rc02Again=rc02Engine.snapshot();
  check('RC02-b repeated bind never double-grants or converts consumed shakes into free ones',
    rc02Again.shake.extraGranted===3&&rc02Again.shake.extraUsed===1&&!rc02Service.canOffer());

  // SR01–SR07: committed extra-shake recovery must never strand the player on a CAS conflict after readback failure.
  // All SR scenarios keep the original 152 assertions intact; these add the production recovery path.
  const srPolicy={enabled:true,policyVersion:'sr',adUnitId:'debug-mock',placement:'extra-shake',maxExtraShakesPerRun:5,maxDailyRewardedShakes:5,minForegroundSecondsFirstSession:60,requireTutorialComplete:true,requireFirstNaturalRunCompleted:true};

  // SR01: reward commit succeeds, the post-commit readback fails once. Host revision must equal the committed
  // revision; ERROR offers free retry and must never claim GRANTED before the live grant is applied.
  delete globalThis.__milkteaRewardedShake;
  const sr01Run=makeRun();
  const sr01Repo=new LocalSaveRepository('shake-sr01');await sr01Repo.acquireWriteLease();
  let sr01Bundle={profile:profileFor(sr01Run),run:sr01Run,lastResult:null};
  const sr01Init=await sr01Repo.commitBundle(0,null,sr01Bundle);let sr01Rev=sr01Init.ok?sr01Init.data.revision:0;
  const sr01OriginalRead=sr01Repo.readBundle.bind(sr01Repo);
  const sr01OriginalCommit=sr01Repo.commitBundle.bind(sr01Repo);
  let sr01ReadCalls=0;
  const sr01Wrapped=Object.create(sr01Repo);
  sr01Wrapped.readBundle=async()=>{sr01ReadCalls++;const c=sr01ReadCalls;const r=sr01OriginalRead();if(c===3)return{ok:false,error:{code:'READBACK_FAIL'}};return r;};
  sr01Wrapped.commitBundle=async(...args)=>{return sr01OriginalCommit(...args);};
  const sr01Engine=new RunEngine(adapter,rules,RUN_ID,12345,sr01Run);
  let sr01Show=0;
  const sr01Host={getActiveRunSnapshot:()=>sr01Engine.snapshot(),getBundle:()=>sr01Bundle,getSaveRevision:()=>sr01Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>sr01Engine.pause('AD'),resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr01Bundle=n;sr01Rev=r;},applyCommittedExtraGrant:(amount)=>sr01Engine.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const sr01Provider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true}),show:async(a)=>{sr01Show++;return{kind:'COMPLETED',attemptId:a};},dispose:()=>{}};
  const sr01Service=RewardedShakeService.create({provider:sr01Provider,policy:srPolicy},sr01Wrapped,()=>NOW);
  sr01Service.bind(sr01Host);sr01Service.setForegroundSeconds(60);sr01Service.openOffer();await sr01Service.watch();
  const sr01Disk=await sr01OriginalRead();
  check('SR01 readback failure after commit keeps committed revision synced and exposes free retry, not GRANTED',
    sr01Service.getView().phase==='ERROR'&&sr01Service.getView().retrySettle&&sr01Engine.snapshot().shake.extraGranted===0
    &&sr01Disk.ok&&sr01Disk.data.envelope.payload.profile.rewardedShake.receipts.length===1
    &&sr01Rev===sr01Disk.data.envelope.revision,
    JSON.stringify({rev:sr01Rev,diskRev:sr01Disk.ok?sr01Disk.data.envelope.revision:null,extra:sr01Engine.snapshot().shake.extraGranted,phase:sr01Service.getView().phase,retry:sr01Service.getView().retrySettle,receipts:sr01Disk.ok?sr01Disk.data.envelope.payload.profile.rewardedShake.receipts.length:null}));

  // SR02: retry twice after SR01. First retry applies the committed grant for free; second retry is idempotent.
  await sr01Service.retrySettlement();
  const sr02Disk=await sr01OriginalRead();
  check('SR02-a first free retry applies exactly one committed grant without re-watching',
    sr01Service.getView().phase==='GRANTED'&&sr01Engine.snapshot().shake.extraGranted===1&&sr01Show===1);
  check('SR02-b retry never appends a receipt or re-consumes daily/run quota',
    sr02Disk.ok&&sr02Disk.data.envelope.payload.profile.rewardedShake.receipts.length===1
    &&sr02Disk.data.envelope.payload.profile.rewardedShake.dailyGranted===1);
  await sr01Service.retrySettlement();
  check('SR02-c second retry after GRANTED is idempotent',
    sr01Service.getView().phase==='GRANTED'&&sr01Engine.snapshot().shake.extraGranted===1&&sr01Show===1);

  // SR03: commit succeeds but the live apply fails once; retry applies it for free without re-watching.
  delete globalThis.__milkteaRewardedShake;
  const sr03Run=makeRun();
  const sr03Repo=new LocalSaveRepository('shake-sr03');await sr03Repo.acquireWriteLease();
  let sr03Bundle={profile:profileFor(sr03Run),run:sr03Run,lastResult:null};
  const sr03Init=await sr03Repo.commitBundle(0,null,sr03Bundle);let sr03Rev=sr03Init.ok?sr03Init.data.revision:0;
  const sr03Engine=new RunEngine(adapter,rules,RUN_ID,12345,sr03Run);
  let sr03ApplyFail=true,sr03Show=0;
  const sr03Host={getActiveRunSnapshot:()=>sr03Engine.snapshot(),getBundle:()=>sr03Bundle,getSaveRevision:()=>sr03Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>sr03Engine.pause('AD'),resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr03Bundle=n;sr03Rev=r;},
    applyCommittedExtraGrant:(amount)=>{if(sr03ApplyFail){sr03ApplyFail=false;return false;}return sr03Engine.commitExtraGrant(amount).ok;},waitForSaveIdle:async()=>{}};
  const sr03Provider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true}),show:async(a)=>{sr03Show++;return{kind:'COMPLETED',attemptId:a};},dispose:()=>{}};
  const sr03Service=RewardedShakeService.create({provider:sr03Provider,policy:srPolicy},sr03Repo,()=>NOW);
  sr03Service.bind(sr03Host);sr03Service.setForegroundSeconds(60);sr03Service.openOffer();await sr03Service.watch();
  check('SR03-a failed live application after commit is ERROR, not GRANTED, and keeps a free retry',
    sr03Service.getView().phase==='ERROR'&&sr03Service.getView().retrySettle&&sr03Engine.snapshot().shake.extraGranted===0&&sr03Show===1);
  await sr03Service.retrySettlement();
  check('SR03-b free retry applies the committed grant once without re-watching or re-consuming quota',
    sr03Service.getView().phase==='GRANTED'&&sr03Engine.snapshot().shake.extraGranted===1&&sr03Show===1);

  // SR04: a host/run handoff during the retry read must leave the previous owner with zero callbacks and never
  // grant into a different run; the current owner reconciles through its own recovery entry.
  delete globalThis.__milkteaRewardedShake;
  const sr04Run=makeRun();
  const sr04Repo=new LocalSaveRepository('shake-sr04');await sr04Repo.acquireWriteLease();
  let sr04Bundle={profile:profileFor(sr04Run),run:sr04Run,lastResult:null};
  const sr04Init=await sr04Repo.commitBundle(0,null,sr04Bundle);let sr04Rev=sr04Init.ok?sr04Init.data.revision:0;
  const sr04OriginalRead=sr04Repo.readBundle.bind(sr04Repo);
  const sr04OriginalCommit=sr04Repo.commitBundle.bind(sr04Repo);
  let sr04ReadCalls=0;let sr04Defer=null;const sr04Gate=new Promise(r=>{sr04Defer=r;});
  const sr04Wrapped=Object.create(sr04Repo);
  sr04Wrapped.readBundle=async()=>{
    sr04ReadCalls++;const c=sr04ReadCalls;
    if(c===3)return{ok:false,error:{code:'READBACK_FAIL'}}; // post-commit readback fails → ERROR+retrySettle
    if(c===4){await sr04Gate;} // retry fresh read is deferred so a handoff can land in flight
    return sr04OriginalRead();
  };
  sr04Wrapped.commitBundle=async(...args)=>sr04OriginalCommit(...args);
  const sr04EngineA=new RunEngine(adapter,rules,RUN_ID,12345,sr04Run);
  let sr04ACallbacks=0,sr04Show=0;
  const sr04HostA={getActiveRunSnapshot:()=>sr04EngineA.snapshot(),getBundle:()=>sr04Bundle,getSaveRevision:()=>sr04Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>sr04EngineA.pause('AD'),resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr04ACallbacks++;sr04Bundle=n;sr04Rev=r;},applyCommittedExtraGrant:(amount)=>sr04EngineA.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const sr04Provider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true}),show:async(a)=>{sr04Show++;return{kind:'COMPLETED',attemptId:a};},dispose:()=>{}};
  const sr04Service=RewardedShakeService.create({provider:sr04Provider,policy:srPolicy},sr04Wrapped,()=>NOW);
  sr04Service.bind(sr04HostA);sr04Service.setForegroundSeconds(60);sr04Service.openOffer();await sr04Service.watch();
  check('SR04 setup reaches retry-settle ERROR after injected readback failure',
    sr04Service.getView().phase==='ERROR'&&sr04Service.getView().retrySettle&&sr04EngineA.snapshot().shake.extraGranted===0);
  // Start retry; its fresh read (call #4) is deferred. Snapshot A's callback count before the handoff.
  const sr04BeforeHandoff=sr04ACallbacks;
  const sr04Retry=sr04Service.retrySettlement();
  await new Promise(r=>setTimeout(r,10));
  // Hand off to a new owner on the same run while the retry read is in flight.
  const sr04Disk=await sr04OriginalRead();
  let sr04BundleB=sr04Disk.ok?sr04Disk.data.envelope.payload:sr04Bundle;let sr04RevB=sr04Disk.ok?sr04Disk.data.envelope.revision:sr04Rev;
  const sr04EngineB=new RunEngine(adapter,rules,RUN_ID,12345,sr04Run);
  let sr04BCallbacks=0;
  const sr04HostB={getActiveRunSnapshot:()=>sr04EngineB.snapshot(),getBundle:()=>sr04BundleB,getSaveRevision:()=>sr04RevB,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr04BCallbacks++;sr04BundleB=n;sr04RevB=r;},applyCommittedExtraGrant:(amount)=>sr04EngineB.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  sr04Service.bind(sr04HostB);
  sr04Defer();
  await sr04Retry;
  await new Promise(r=>setTimeout(r,20));
  check('SR04 handoff during retry leaves the previous owner with zero callbacks',sr04ACallbacks===sr04BeforeHandoff);
  check('SR04 the current owner reconciles the committed grant through its own entry',
    sr04EngineB.snapshot().shake.extraGranted===1&&sr04Service.getView().phase==='GRANTED'&&sr04Show===1);

  // SR05: the readback envelope may advance beyond the commit result. The host must adopt the envelope's own
  // revision so the next legal save does not keep CAS-conflicting.
  delete globalThis.__milkteaRewardedShake;
  const sr05Run=makeRun();
  const sr05Repo=new LocalSaveRepository('shake-sr05');await sr05Repo.acquireWriteLease();
  let sr05Bundle={profile:profileFor(sr05Run),run:sr05Run,lastResult:null};
  const sr05Init=await sr05Repo.commitBundle(0,null,sr05Bundle);let sr05Rev=sr05Init.ok?sr05Init.data.revision:0;
  const sr05OriginalRead=sr05Repo.readBundle.bind(sr05Repo);
  const sr05OriginalCommit=sr05Repo.commitBundle.bind(sr05Repo);
  let sr05ReadCalls=0;
  const sr05Wrapped=Object.create(sr05Repo);
  sr05Wrapped.readBundle=async()=>{
    sr05ReadCalls++;
    const real=await sr05OriginalRead();
    if(sr05ReadCalls===3&&real.ok){
      // Simulate a concurrent save that advanced the revision without changing this payload.
      const bump=JSON.parse(JSON.stringify(real));bump.data.envelope.revision+=5;return bump;
    }
    return real;
  };
  sr05Wrapped.commitBundle=async(...args)=>sr05OriginalCommit(...args);
  const sr05Engine=new RunEngine(adapter,rules,RUN_ID,12345,sr05Run);
  let sr05Show=0;
  const sr05Host={getActiveRunSnapshot:()=>sr05Engine.snapshot(),getBundle:()=>sr05Bundle,getSaveRevision:()=>sr05Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>sr05Engine.pause('AD'),resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr05Bundle=n;sr05Rev=r;},applyCommittedExtraGrant:(amount)=>sr05Engine.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const sr05Provider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true}),show:async(a)=>{sr05Show++;return{kind:'COMPLETED',attemptId:a};},dispose:()=>{}};
  const sr05Service=RewardedShakeService.create({provider:sr05Provider,policy:srPolicy},sr05Wrapped,()=>NOW);
  sr05Service.bind(sr05Host);sr05Service.setForegroundSeconds(60);sr05Service.openOffer();await sr05Service.watch();
  const sr05PostRev=sr05Rev;
  check('SR05 host adopts the readback envelope own revision even when it exceeds the commit result',sr05Service.getView().phase==='GRANTED'&&sr05PostRev>sr05Init.data.revision+2,JSON.stringify({rev:sr05PostRev,initRev:sr05Init.data.revision}));
  // A subsequent legal save (a second grant) must succeed instead of CAS-conflicting on the stale commit revision.
  sr05Service.acknowledgeGrant();sr05Service.openOffer();await sr05Service.watch();
  check('SR05 the next legal save succeeds with no recurring CAS conflict',sr05Service.getView().phase==='GRANTED'&&sr05Engine.snapshot().shake.extraGranted===2&&sr05Show===2);

  // SR06: receipt mismatch or storage unreadable must never fabricate a reward, overwrite old state, or loop.
  delete globalThis.__milkteaRewardedShake;
  const sr06Run=makeRun();
  const sr06Repo=new LocalSaveRepository('shake-sr06');await sr06Repo.acquireWriteLease();
  const sr06Receipt=RewardLedger.receiptFor({attemptId:'66666666-6666-4666-8666-666666666666',runId:RUN_ID,policyVersion:'sr06',amount:1,dayKey:'2026-11-03',startedAt:NOW},NOW);
  let sr06Bundle={profile:profileFor(sr06Run,{rewardedShake:{dayKey:'2026-11-03',dailyGranted:1,pendingAttempt:null,receipts:[sr06Receipt]}}),run:SaveCodec.sealSnapshot({...sr06Run,shake:{...sr06Run.shake,extraGranted:1}}),lastResult:null};
  const sr06Init=await sr06Repo.commitBundle(0,null,sr06Bundle);let sr06Rev=sr06Init.ok?sr06Init.data.revision:0;
  const sr06OriginalRead=sr06Repo.readBundle.bind(sr06Repo);
  const sr06OriginalCommit=sr06Repo.commitBundle.bind(sr06Repo);
  let sr06ThrowOnce=true;
  const sr06Wrapped=Object.create(sr06Repo);
  sr06Wrapped.readBundle=async()=>{if(sr06ThrowOnce){sr06ThrowOnce=false;throw new Error('storage offline');}return sr06OriginalRead();};
  sr06Wrapped.commitBundle=async(...args)=>sr06OriginalCommit(...args);
  const sr06Engine=new RunEngine(adapter,rules,RUN_ID,12345,sr06Run);
  let sr06Apply=false;
  const sr06Host={getActiveRunSnapshot:()=>sr06Engine.snapshot(),getBundle:()=>sr06Bundle,getSaveRevision:()=>sr06Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr06Bundle=n;sr06Rev=r;},applyCommittedExtraGrant:(amount)=>sr06Apply&&sr06Engine.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const sr06Service=RewardedShakeService.create({provider:rv32Provider,policy:srPolicy},sr06Wrapped,()=>NOW);
  sr06Service.bind(sr06Host);sr06Service.setForegroundSeconds(60);
  check('SR06-a unreadable storage during bind recovery is contained and leaves an actionable retry entry',
    sr06Service.getView().phase==='ERROR'&&sr06Service.getView().retrySettle&&sr06Engine.snapshot().shake.extraGranted===0);
  sr06Apply=true;
  // The first retry hits the still-offline storage read; it stays actionable. The second retry recovers for free.
  await sr06Service.retrySettlement();
  await sr06Service.retrySettlement();
  check('SR06-b after storage recovers the committed grant applies for free',
    sr06Service.getView().phase==='GRANTED'&&sr06Engine.snapshot().shake.extraGranted===1);
  // A receipt committed for a different run must never grant the current run (cross-run isolation).
  const SR06_OTHER_RUN='66666666-6666-4666-8666-666666666667';
  const sr06OtherReceipt=RewardLedger.receiptFor({attemptId:'66666666-6666-4666-8666-666666666668',runId:SR06_OTHER_RUN,policyVersion:'sr06',amount:1,dayKey:'2026-11-03',startedAt:NOW},NOW);
  const sr06OtherBundle={profile:profileFor(sr06Run,{rewardedShake:{dayKey:'2026-11-03',dailyGranted:1,pendingAttempt:null,receipts:[sr06OtherReceipt]}}),run:SaveCodec.sealSnapshot({...sr06Run,shake:{...sr06Run.shake,extraGranted:0}}),lastResult:null};
  const sr06OtherCommit=await sr06Repo.commitBundle(sr06Rev,RUN_ID,sr06OtherBundle);
  check('SR06-c setup writes a receipt for a different run',sr06OtherCommit.ok,JSON.stringify(sr06OtherCommit));
  sr06Bundle=sr06OtherBundle;sr06Rev=sr06OtherCommit.ok?sr06OtherCommit.data.revision:sr06Rev;
  const sr06OtherService=RewardedShakeService.create({provider:rv32Provider,policy:srPolicy},sr06Repo,()=>NOW);
  sr06OtherService.bind(sr06Host);sr06OtherService.setForegroundSeconds(60);
  check('SR06-d a receipt for a different run never grants the current run and leaves state untouched',
    sr06OtherService.getView().phase==='IDLE'&&sr06Engine.snapshot().shake.extraGranted===1&&!sr06OtherService.getView().retrySettle);

  // SR07: committed total is 3 while live is 1 with extraUsed 1; retry must apply only the delta of 2, never
  // restore consumed shakes, and repeated retry must stay idempotent.
  delete globalThis.__milkteaRewardedShake;
  const sr07Run=makeRun();
  const sr07Receipts=['77777777-7777-4777-8777-777777777771','77777777-7777-4777-8777-777777777772','77777777-7777-4777-8777-777777777773']
    .map((attemptId,i)=>RewardLedger.receiptFor({attemptId,runId:RUN_ID,policyVersion:'sr07',amount:1,dayKey:'2026-11-03',startedAt:NOW+i},NOW));
  const sr07Repo=new LocalSaveRepository('shake-sr07');await sr07Repo.acquireWriteLease();
  let sr07Bundle={profile:profileFor(sr07Run,{rewardedShake:{dayKey:'2026-11-03',dailyGranted:3,pendingAttempt:null,receipts:sr07Receipts}}),run:SaveCodec.sealSnapshot({...sr07Run,boardType:'assisted',shake:{...sr07Run.shake,extraGranted:3,extraUsed:1}}),lastResult:null};
  const sr07Init=await sr07Repo.commitBundle(0,null,sr07Bundle);let sr07Rev=sr07Init.ok?sr07Init.data.revision:0;
  const sr07MemSnap=SaveCodec.sealSnapshot({...sr07Run,boardType:'assisted',shake:{...sr07Run.shake,extraGranted:1,extraUsed:1}});
  const sr07Engine=new RunEngine(adapter,rules,RUN_ID,12345,sr07MemSnap);
  let sr07Apply=false;
  const sr07Host={getActiveRunSnapshot:()=>sr07Engine.snapshot(),getBundle:()=>sr07Bundle,getSaveRevision:()=>sr07Rev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>{},resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(n,r)=>{sr07Bundle=n;sr07Rev=r;},applyCommittedExtraGrant:(amount)=>sr07Apply&&sr07Engine.commitExtraGrant(amount).ok,waitForSaveIdle:async()=>{}};
  const sr07Service=RewardedShakeService.create({provider:rv32Provider,policy:srPolicy},sr07Repo,()=>NOW);
  sr07Service.bind(sr07Host);sr07Service.setForegroundSeconds(60);
  check('SR07-a bind recovery with a failed live apply exposes free retry instead of claiming GRANTED',
    sr07Service.getView().phase==='ERROR'&&sr07Service.getView().retrySettle&&sr07Engine.snapshot().shake.extraGranted===1);
  sr07Apply=true;
  await sr07Service.retrySettlement();
  check('SR07-b free retry applies only the committed delta (2) and never restores consumed shakes',
    sr07Service.getView().phase==='GRANTED'&&sr07Engine.snapshot().shake.extraGranted===3&&sr07Engine.snapshot().shake.extraUsed===1);
  await sr07Service.retrySettlement();
  const sr07Disk=await sr07Repo.readBundle();
  check('SR07-c repeated retry is idempotent and leaves receipts/quota untouched',
    sr07Service.getView().phase==='GRANTED'&&sr07Engine.snapshot().shake.extraGranted===3&&sr07Engine.snapshot().shake.extraUsed===1
    &&sr07Disk.ok&&sr07Disk.data.envelope.payload.profile.rewardedShake.receipts.length===3
    &&sr07Disk.data.envelope.payload.profile.rewardedShake.dailyGranted===3);

  RewardedAdCoordinator.release('spill-revive');RewardedAdCoordinator.release('extra-shake');
  check('RV-28 one rewarded slot is shared by both ad kinds',RewardedAdCoordinator.claim('spill-revive')&&!RewardedAdCoordinator.claim('extra-shake')&&!RewardedAdCoordinator.claim('spill-revive'));
  RewardedAdCoordinator.release('spill-revive');
  check('RV-29 releasing the slot allows the other ad kind',RewardedAdCoordinator.claim('extra-shake'));
  RewardedAdCoordinator.release('extra-shake');

  check('OW03 no stale-cleanup rejection escapes as unhandled',unhandledRejections.length===0,
    unhandledRejections.map((error)=>String(error&&error.message||error)).join('|'));

  console.log(`\n${passed} checks passed, ${failures.length} failed`);
  if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
})().catch((error) => { console.error(error); process.exit(1); });
