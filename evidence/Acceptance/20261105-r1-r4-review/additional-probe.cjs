// Uses existing fixtures without changing the original regression assertions or production code.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),runner=path.join(root,'tools/verify_rewarded_shake.cjs');
let source=fs.readFileSync(runner,'utf8');
const anchor='  console.log(`\\n${passed} checks passed, ${failures.length} failed`);';
const extra=`{
  async function reviewCase(namespace, failRewardCommit=false) {
    delete globalThis.__milkteaSpillRevive;
    const repo=new LocalSaveRepository(namespace);await repo.acquireWriteLease();
    let bundle={profile:profileFor(spillRun),run:spillRun,lastResult:null};
    const initial=await repo.commitBundle(0,null,bundle);let revision=initial.data.revision;
    const engine=new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions);
    let writes=0;
    const host={...reviveHost,getActiveRunSnapshot:()=>engine.snapshot(),getBundle:()=>bundle,getSaveRevision:()=>revision,
      onSpillReviveCommitted:(b,r)=>{writes++;bundle=b;revision=r;},projectRevive:r=>engine.projectRevive(r),
      applyCommittedRevive:r=>engine.reviveReceiptId===r||engine.applyRevive(r).ok,declineSpillRevive:()=>engine.declineRevive(),pauseForRewardedAd:()=>{}};
    const originalCommit=repo.commitBundle.bind(repo),originalRead=repo.readBundle.bind(repo);
    let commits=0,failRead=false;
    repo.commitBundle=async(...args)=>{if(++commits===2&&failRewardCommit)return {ok:false,error:{code:'TEST_SAVE_FAIL',message:'injected'}};const r=await originalCommit(...args);if(commits===2&&r.ok)failRead=true;return r;};
    repo.readBundle=async()=>{if(failRead){failRead=false;return {ok:false,error:{code:'TEST_READ_FAIL',message:'injected'}};}return originalRead();};
    const service=SpillReviveService.create({provider:reviveProvider,policy:revivePolicy},repo,()=>NOW);service.bind(host);service.setForegroundSeconds(60);service.openOffer();await service.watch();
    return {repo,engine,host,service,originalCommit,originalRead,get:()=>({bundle,revision,writes}),resetWrites:()=>{writes=0;}};
  }
  const changedOwner=await reviewCase('review-owner-change');changedOwner.resetWrites();
  changedOwner.repo.readBundle=async()=>{const result=await changedOwner.originalRead();changedOwner.service.bind({...changedOwner.host});return result;};
  await changedOwner.service.retrySettlement();
  const ownerProbe={writesToOldHostAfterRebind:changedOwner.get().writes,phase:changedOwner.service.getView().phase};
  const checkpoint=await reviewCase('review-new-checkpoint',true);
  const before=checkpoint.get();await checkpoint.originalCommit(before.revision,RUN_ID,before.bundle);
  await checkpoint.service.retrySettlement();
  const current=(await checkpoint.originalRead()).data.envelope;
  const checkpointProbe={memoryRevision:checkpoint.get().revision,persistedRevision:current.revision,used:checkpoint.engine.reviveUsed,phase:checkpoint.service.getView().phase,message:checkpoint.service.getView().message};
  const fourthProfile=profileFor(pendingSnap);fourthProfile.rewardedRevive={...fourthProfile.rewardedRevive,dayKey:ReviveLedger.dayKey(NOW),dailyGranted:3};
  const fourth=ReviveLedger.checkOffer({policy:revivePolicy,capability:'SUPPORTED',profile:fourthProfile,run:pendingSnap,foregroundSeconds:60,tutorialComplete:true,nowMs:NOW});
  const result={scope:'Node fixture probes; no real Tap device or ad',ownerProbe,checkpointProbe,fourthRunOffer:fourth};
  require('node:fs').writeFileSync(path.join(root,'evidence/Acceptance/20261105-r1-r4-review/additional-result.json'),JSON.stringify(result,null,2));
  console.log('ADDITIONAL_PROBE '+JSON.stringify(result));
}
`;
if(!source.includes(anchor))throw Error('Runner anchor changed; inspect before use');
source=source.replace(anchor,extra+'\n'+anchor);
new Function('require','__dirname','__filename',source)(require,path.dirname(runner),runner);
