// Reuse existing validated fixtures; add probes without modifying the production test runner.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const runner = path.join(root, 'tools/verify_rewarded_shake.cjs');
const extra = `
  delete globalThis.__milkteaSpillRevive;
  const probeRepo=new LocalSaveRepository('review-readback');await probeRepo.acquireWriteLease();
  let probeBundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
  const probeInitial=await probeRepo.commitBundle(0,null,probeBundle);let probeRev=probeInitial.data.revision;
  const probeLive=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
  const probeHost={...reviveHost,getActiveRunSnapshot:()=>probeLive.snapshot(),getBundle:()=>probeBundle,getSaveRevision:()=>probeRev,
    onSpillReviveCommitted:(next,revision)=>{probeBundle=next;probeRev=revision;},projectRevive:r=>probeLive.projectRevive(r),
    applyCommittedRevive:r=>probeLive.reviveReceiptId===r||probeLive.applyRevive(r).ok,declineSpillRevive:()=>probeLive.declineRevive(),pauseForRewardedAd:()=>{}};
  const readOriginal=probeRepo.readBundle.bind(probeRepo), commitOriginal=probeRepo.commitBundle.bind(probeRepo);
  let failNextRead=false,probeCommits=0;
  probeRepo.readBundle=async()=>{if(failNextRead){failNextRead=false;return {ok:false,error:{code:'TEST_READBACK_FAILURE',message:'one-time post-commit read error'}};}return readOriginal();};
  probeRepo.commitBundle=async(...args)=>{const result=await commitOriginal(...args);if(++probeCommits===2&&result.ok)failNextRead=true;return result;};
  const probeService=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},probeRepo,()=>NOW);
  probeService.bind(probeHost);probeService.setForegroundSeconds(60);probeService.openOffer();await probeService.watch();
  const probeAfterWatch={view:probeService.getView(),memoryRevision:probeRev,persistedRevision:(await readOriginal()).data.envelope.revision,liveUsed:probeLive.reviveUsed};
  await probeService.retrySettlement();await probeService.retrySettlement();
  const probeAfterRetry={view:probeService.getView(),memoryRevision:probeRev,persistedRevision:(await readOriginal()).data.envelope.revision,liveUsed:probeLive.reviveUsed};
  const cancelRetryBefore={state:cancelLive.snapshot().state,reviveUsed:cancelLive.reviveUsed,phase:cancelReviveService.getView().phase};
  const probeResults={scope:'Node pure-state/service probes, not Tap host',readbackFailure:{afterWatch:probeAfterWatch,afterTwoRetries:probeAfterRetry},cancelledAd:cancelRetryBefore};
  require('node:fs').writeFileSync(path.join(root,'evidence/Acceptance/20261105-tap-host-review/revive-boundaries.json'),JSON.stringify(probeResults,null,2));
  console.log('BOUNDARY_PROBE '+JSON.stringify(probeResults));
`;
let source = fs.readFileSync(runner, 'utf8');
const anchor = '  console.log(`\\n${passed} checks passed, ${failures.length} failed`);';
if (!source.includes(anchor)) throw Error('Runner anchor changed; inspect before reuse');
source = source.replace(anchor, extra + '\n' + anchor);
new Function('require', '__dirname', '__filename', source)(require, path.dirname(runner), runner);
