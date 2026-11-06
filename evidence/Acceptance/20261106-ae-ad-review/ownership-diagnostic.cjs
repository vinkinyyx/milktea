// Diagnostic variant only. Original regression assertions/source remain unchanged.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
let source=fs.readFileSync(path.join(root,'tools/verify_rewarded_shake.cjs'),'utf8');
source=source.replace("r2cService.bind({...oldHost,getActiveRunSnapshot:()=>otherLive.snapshot()});",`console.log('DIAG restoredRunId',otherLive.snapshot().runId,'requested','other-run-id');
  r2cService.bind({...oldHost,getActiveRunSnapshot:()=>otherLive.snapshot(),
    onSpillReviveCommitted:(n,r)=>{console.log('DIAG superseded-owner commit',r2cService.host===thirdHost);r2cBundle=n;r2cRev=r;},
    applyCommittedRevive:()=>{console.log('DIAG new-owner apply');return false;}});
  const thirdHost={...oldHost,getActiveRunSnapshot:()=>null,onSpillReviveCommitted:()=>{}};
  r2cService.bind(thirdHost);`);
source=source.replace("  console.log(`\\n${passed} checks passed, ${failures.length} failed`);",`  // Rebind a committed receipt to a host that cannot apply it; inspect truthful state.
  rv31Service.bind({...rv31Host,getActiveRunSnapshot:()=>new RunEngine(reviveAdapter,rules,RUN_ID,12345,SaveCodec.sealSnapshot(pendingSnap),reviveOptions).snapshot(),applyCommittedRevive:()=>false});
  console.log('DIAG apply-false',JSON.stringify(rv31Service.getView()));
  console.log(\`\\n\${passed} checks passed, \${failures.length} failed\`);`);
new Function('require','__dirname','__filename',source)(require,path.join(root,'tools'),path.join(root,'tools/verify_rewarded_shake.cjs'));
