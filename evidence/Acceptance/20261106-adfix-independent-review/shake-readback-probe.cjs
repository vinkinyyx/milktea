// Isolated fault injection against current services; no source or original assertion changes.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
let source=fs.readFileSync(path.join(root,'tools/verify_rewarded_shake.cjs'),'utf8');
const injection=`
  delete globalThis.__milkteaRewardedShake;
  const rbRepo=new LocalSaveRepository('review-shake-readback');await rbRepo.acquireWriteLease();
  const rbRun=makeRun();let rbBundle={profile:profileFor(rbRun),run:rbRun,lastResult:null};
  const rbInit=await rbRepo.commitBundle(0,null,rbBundle);let rbRev=rbInit.data.revision;
  const rbRead=rbRepo.readBundle.bind(rbRepo),rbCommit=rbRepo.commitBundle.bind(rbRepo);
  const rbWrapped=Object.create(rbRepo);let failRead=false,readFailed=false,rbShows=0;
  rbWrapped.commitBundle=async(...args)=>{const result=await rbCommit(...args);if(result.ok&&args[2].profile.rewardedShake.receipts.length>0&&!readFailed)failRead=true;return result;};
  rbWrapped.readBundle=async()=>{if(failRead){failRead=false;readFailed=true;return{ok:false,error:{code:'READ_FAULT',message:'once'}};}return rbRead();};
  const rbEngine=new RunEngine(adapter,rules,RUN_ID,12345,rbRun);
  const rbHost={getActiveRunSnapshot:()=>rbEngine.snapshot(),getBundle:()=>rbBundle,getSaveRevision:()=>rbRev,
    isTutorialComplete:()=>true,getForegroundSeconds:()=>60,pauseForRewardedAd:()=>rbEngine.pause('AD'),resumeFromRewardedAd:()=>{},onRewardedShakeChanged:()=>{},
    onRewardedShakeCommitted:(b,r)=>{rbBundle=b;rbRev=r;},applyCommittedExtraGrant:(a)=>rbEngine.commitExtraGrant(a).ok,waitForSaveIdle:async()=>{}};
  const rbProvider={providerName:'debug-mock',capability:()=>'SUPPORTED',prepare:async()=>({ok:true,data:undefined}),show:async(attemptId)=>{rbShows++;return{kind:'COMPLETED',attemptId};},dispose:()=>{}};
  const rbService=RewardedShakeService.create({provider:rbProvider,policy},rbWrapped,()=>NOW);
  rbService.bind(rbHost);rbService.setForegroundSeconds(60);rbService.openOffer();await rbService.watch();
  const rbDisk=await rbRead();
  const rbAfter={view:rbService.getView(),memoryRevision:rbRev,diskRevision:rbDisk.data.envelope.revision,extra:rbEngine.snapshot().shake.extraGranted};
  await rbService.retrySettlement();await rbService.retrySettlement();
  const rbResult={scope:'fault injection only, not real ad',afterWatch:rbAfter,afterTwoRetries:{view:rbService.getView(),memoryRevision:rbRev,extra:rbEngine.snapshot().shake.extraGranted},shows:rbShows,diskReceipts:rbDisk.data.envelope.payload.profile.rewardedShake.receipts.length};
  require('node:fs').writeFileSync(require('node:path').join(root,'evidence/Acceptance/20261106-adfix-independent-review/shake-readback-result.json'),JSON.stringify(rbResult,null,2));
  console.log('READBACK_DIAGNOSTIC',JSON.stringify(rbResult));
`;
source=source.replace('  console.log(`\\n${passed} checks passed, ${failures.length} failed`);',injection+'\n  console.log(`\\n${passed} checks passed, ${failures.length} failed`);');
new Function('require','__dirname','__filename',source)(require,path.join(root,'tools'),path.join(root,'tools/verify_rewarded_shake.cjs'));
