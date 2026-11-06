// Execute the actual ArtAssets clock adapter with a deterministic host clock; no production edits.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
const ts=require(path.join(root,'奶茶挤挤/node_modules/typescript'));
const budget=require(path.join(root,'build-artifacts/rewarded-tests/js/core/ArtLoadBudget.js'));
const source=fs.readFileSync(path.join(root,'奶茶挤挤/assets/scripts/presentation/ArtAssets.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2019,module:ts.ModuleKind.CommonJS}}).outputText;
function fixture(options={}){
 let now=0,timer=null,hidden=options.startHidden===true;const listeners=new Set();
 const host={get backgrounded(){return hidden;},set backgrounded(value){hidden=value;for(const fn of listeners)fn(host.snapshot());},
   snapshot:()=>({backgrounded:hidden,domHidden:hidden,engineHidden:false,revision:0,hideEpoch:hidden?1:0,resumeRequired:hidden,events:[]}),
   subscribe:fn=>{listeners.add(fn);fn(host.snapshot());return()=>listeners.delete(fn);}};
 const module={exports:{}};
 const context={module,exports:module.exports,performance:{now:()=>now},Date,Promise,Map,Error,Number,Math,
   setInterval:cb=>{timer=cb;return 1;},clearInterval:()=>{timer=null;},require:name=>{
     if(name==='cc')return {};
     if(name==='./ArtCatalog')return {};
     if(name==='../core/ArtLoadBudget')return budget;
     if(name==='../core/HostLifecycleCoordinator')return {HostLifecycleCoordinator:host};
     throw Error('Unexpected dependency '+name);
   }};
 vm.runInNewContext(js,context,{filename:'ArtAssets.actual.js'});
 const art=new module.exports.ArtAssets();const b=art.beginLoadScope(1,1,15000);
 return {art,b,host,at:n=>{now=n;},tick:()=>timer?.()};
}
const hidden=fixture();hidden.at(5000);hidden.tick();hidden.host.backgrounded=true;hidden.at(25000);
// Real suspension can suppress all setInterval callbacks; visibility is foreground again at wake-up.
hidden.host.backgrounded=false;hidden.tick();
const background={scenario:'5s foreground, 20s background with timer suspension, then resume',expectedForegroundMs:5000,actualForegroundMs:hidden.b.foregroundMs,status:hidden.b.status};
const late=fixture();late.at(16000);let accepted=false;
try{late.art.assertScope(late.art.scope);accepted=true;}catch{}
late.art.settleLoadScope();
const overdue={scenario:'foreground callback after 16s before interval dispatch',elapsedMs:16000,scopeAccepted:accepted,status:late.b.status,accountedForegroundMs:late.b.foregroundMs};

// A02: the batch legitimately begins while the host is already backgrounded.
const bg=fixture({startHidden:true});
bg.at(20000);bg.host.backgrounded=false;    // 20s of background must be charged as zero
const backgroundOnly={status:bg.b.status,foregroundMs:bg.b.foregroundMs,remainingMs:bg.b.remainingMs};
bg.at(35000);bg.tick();                     // 15s of real foreground must exhaust the 15s budget
const startedBackground={scenario:'batch starts hidden, 20s background, then 15s foreground',backgroundOnly,status:bg.b.status,foregroundMs:bg.b.foregroundMs,scopeStillActive:bg.art.activeBudget!==null};

// B01: a token from a replaced batch can neither settle nor cancel the replacement scope.
const token=fixture();const oldBudget=token.b,newBudget=token.art.beginLoadScope(1,2,15000,'GAME_ART');
token.art.settleLoadScope(oldBudget);
const afterOldSettle={oldStatus:oldBudget.status,newStatus:newBudget.status,activeIsNew:token.art.activeBudget===newBudget};
token.art.cancelScope('START_ART_CANCELLED',oldBudget);
const afterOldCancel={oldStatus:oldBudget.status,newStatus:newBudget.status,activeIsNew:token.art.activeBudget===newBudget};
token.art.settleLoadScope(newBudget);
const tokens={scenario:'stale handle cannot settle or cancel the replacement batch',oldBudgetCancelledByBegin:oldBudget.status==='CANCELLED',afterOldSettle,afterOldCancel,newSettled:newBudget.status==='SETTLED'};

const result={scope:'Actual ArtAssets adapter with mocked clock/host, not a real device performance sample',background,overdue,startedBackground,tokens};
fs.writeFileSync(path.join(__dirname,'budget-integration-result.json'),JSON.stringify(result,null,2));
process.stdout.write(JSON.stringify(result,null,2)+'\n');
