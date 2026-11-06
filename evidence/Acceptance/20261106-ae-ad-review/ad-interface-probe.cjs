// Contract/fault probes only: fake tap API, no real ad unit, network, SDK or reward issuance.
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'../../..');
const {TapRewardedAdProvider}=require(path.join(root,'build-artifacts/rewarded-tests/js/platform/TapRewardedAdProvider.js'));
const attempt='11111111-1111-4111-8111-111111111111';
function sdk({throwOffLoad=false,missingOffClose=false}={}){
 const handlers={},calls={created:0,destroy:0,offLoad:0,offError:0,offClose:0};
 globalThis.tap={createRewardedVideoAd:options=>{
   calls.created++;const ad={onLoad:f=>handlers.load=f,onError:f=>handlers.error=f,onClose:f=>handlers.close=f,
     offLoad:()=>{calls.offLoad++;if(throwOffLoad)throw Error('TEST_OFFLOAD_THROW');delete handlers.load;},
     offError:()=>{calls.offError++;delete handlers.error;},offClose:()=>{calls.offClose++;delete handlers.close;},
     load:()=>Promise.resolve(),show:()=>Promise.resolve(),destroy:()=>{calls.destroy++;}};
   if(missingOffClose)delete ad.offClose;
   return ad;
 }};
 return {handlers,calls};
}
async function closed(payload){const mock=sdk(),p=new TapRewardedAdProvider({enabled:true,adUnitId:'fixture-only'});await p.prepare();let settled=false;const outcome=p.show(attempt).then(x=>{settled=true;return x;});await Promise.resolve();const resolvedByShowPromise=settled;mock.handlers.close(payload);const result=await outcome;return {resolvedByShowPromise,outcome:result.kind,...mock.calls};}
(async()=>{
 const completed=await closed({isEnded:true}),early=await closed({isEnded:false}),nested=await closed({detail:{isEnded:true}}),missingFlag=await closed(undefined);
 const broken=sdk({throwOffLoad:true}),bp=new TapRewardedAdProvider({enabled:true,adUnitId:'fixture-only'});await bp.prepare();const bshow=bp.show(attempt);broken.handlers.close({isEnded:true});await bshow;
 const partial=sdk({missingOffClose:true}),pp=new TapRewardedAdProvider({enabled:true,adUnitId:'fixture-only'});const unavailable=await pp.prepare();
 const disposal=sdk(),dp=new TapRewardedAdProvider({enabled:true,adUnitId:'fixture-only'});await dp.prepare();const shown=dp.show(attempt);dp.dispose();await shown;
 const result={scope:'Fake API contract/fault injection, NOT real Tap ad validation',completed,early,nested,missingFlag,
   offLoadThrows:{...broken.calls,registeredHandlers:Object.keys(broken.handlers)},
   partialInstance:{...partial.calls,result:unavailable},disposeDuringShow:disposal.calls};
 fs.writeFileSync(path.join(__dirname,'ad-interface-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
