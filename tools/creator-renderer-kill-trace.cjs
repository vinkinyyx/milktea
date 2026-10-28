'use strict';
const fs = require('node:fs');
const port = Number(process.argv[2]);
const output = process.argv[3];
const deadline = Date.now() + 90000;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const attached = new Set();
const sessions = new Map();
let id = 0, installed = 0, captured = false;
function append(event, fields = {}) { fs.appendFileSync(output, JSON.stringify({ at:new Date().toISOString(), event, ...fields })+'\n'); }
function send(method, params = {}, sessionId) {
  const root=sessions.get('browser'); const ws=root?.socket;
  if(!ws || ws.readyState!==WebSocket.OPEN) return Promise.reject(new Error('CDP socket not open'));
  return new Promise((resolve,reject)=>{const requestId=++id;root.pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params,...(sessionId?{sessionId}:{})}));setTimeout(()=>{const entry=root.pending.get(requestId);if(entry){root.pending.delete(requestId);reject(new Error(`${method} timed out`));}},4000);});
}
function installListener(socket, key) {
  const state={socket,pending:new Map()};sessions.set(key,state);
  socket.addEventListener('message', event=>{
    let msg;try{msg=JSON.parse(event.data)}catch{return}
    if(msg.id&&state.pending.has(msg.id)){const p=state.pending.get(msg.id);state.pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);return;}
    if(msg.method==='Target.attachedToTarget') void onAttached(msg.params);
    if(msg.method==='Runtime.consoleAPICalled'){
      for(const arg of msg.params.args??[]){if(typeof arg.value==='string'&&arg.value.startsWith('P1A_KILL_TRACE:')){try{append('child-kill-request-cdp',{sessionId:key,...JSON.parse(arg.value.slice(15))});captured=true;}catch(error){append('trace-parse-error',{error:String(error),value:arg.value});}}}
    }
  });
}
const expression = `(()=>{const p=globalThis.process;const load=typeof p?.getBuiltinModule==='function'?p.getBuiltinModule.bind(p):typeof p?.mainModule?.require==='function'?p.mainModule.require.bind(p.mainModule):typeof globalThis.require==='function'?globalThis.require:null;if(!load)return{installed:false,error:'No built-in loader',pid:p?.pid??null,mainModule:typeof p?.mainModule,requireType:typeof globalThis.require};const cp=load('node:child_process'),fs=load('node:fs'),proto=cp.ChildProcess.prototype;if(proto.__p1aKillTraceInstalled)return{installed:true,already:true,pid:p.pid};const origKill=proto.kill;Object.defineProperty(proto,'__p1aKillTraceInstalled',{value:true});proto.kill=function(signal){const row={pid:p.pid,execPath:p.execPath,argv:p.argv?.slice(0,4),childPid:this.pid??null,signal:signal??null,stack:new Error('ChildProcess.kill call site').stack?.split('\\n').slice(1,20)??[]};try{console.info('P1A_KILL_TRACE:'+JSON.stringify(row))}catch{};try{fs.appendFileSync(${JSON.stringify(output)},JSON.stringify({at:new Date().toISOString(),event:'child-kill-request',...row})+'\\n')}catch{};this.once('exit',(code,actualSignal)=>{try{fs.appendFileSync(${JSON.stringify(output)},JSON.stringify({at:new Date().toISOString(),event:'child-exit-after-kill',pid:p.pid,childPid:this.pid??null,code,signal:actualSignal})+'\\n')}catch{}});return origKill.call(this,signal)};const origProcessKill=p.kill?.bind(p);if(origProcessKill)p.kill=function(pid,signal){const row={ownerPid:p.pid,pid,signal,stack:new Error('process.kill call site').stack?.split('\\n').slice(1,20)??[]};try{console.info('P1A_KILL_TRACE:'+JSON.stringify(row))}catch{};try{fs.appendFileSync(${JSON.stringify(output)},JSON.stringify({at:new Date().toISOString(),event:'process-kill-request',...row})+'\\n')}catch{};return origProcessKill(pid,signal)};return{installed:true,pid:p.pid,execPath:p.execPath}})()`;
async function onAttached(params){
  const {sessionId,targetInfo}=params; if(!sessionId||attached.has(sessionId))return;attached.add(sessionId);
  append('target-attached',{sessionId,targetInfo:{targetId:targetInfo.targetId,type:targetInfo.type,title:targetInfo.title,url:targetInfo.url}});
  try{await send('Runtime.enable',{},sessionId);const result=await send('Runtime.evaluate',{expression,returnByValue:true},sessionId);const value=result.result?.value;if(value?.installed){installed++;append('hook-installed',{sessionId,...value});}else append('hook-error',{sessionId,value,exception:result.exceptionDetails??null});}
  catch(error){append('target-hook-error',{sessionId,error:String(error)});}
}
async function run(){
  if(!Number.isInteger(port)||!output)throw new Error('Usage: creator-renderer-kill-trace.cjs <port> <output>');
  append('tracer-started',{port});
  let version;
  while(Date.now()<deadline&&!version){try{version=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json()}catch{await delay(50)}}
  if(!version?.webSocketDebuggerUrl){append('browser-endpoint-timeout',{port});process.exitCode=2;return;}
  const ws=new WebSocket(version.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('browser ws timeout')),5000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});ws.addEventListener('error',e=>{clearTimeout(timer);reject(e)},{once:true});});installListener(ws,'browser');
  await send('Target.setDiscoverTargets',{discover:true});await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:false,flatten:true});
  const targets=await send('Target.getTargets');for(const target of targets.targetInfos??[]){if(!['browser','devtools'].includes(target.type)){try{const attachedResult=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});if(attachedResult.sessionId)await onAttached({sessionId:attachedResult.sessionId,targetInfo:target});}catch(error){append('target-attach-error',{targetId:target.targetId,type:target.type,error:String(error)});}}}
  const started=Date.now();while(Date.now()-started<65000&&!captured)await delay(50);
  if(!captured)append('kill-request-not-observed',{installed,targetCount:attached.size});
  for(const {socket} of sessions.values())try{socket.close()}catch{}
  append('tracer-finished',{installed,captured,targetCount:attached.size});process.exitCode=installed?0:3;
}
run().catch(error=>{append('tracer-error',{error:String(error),stack:error?.stack??null});process.exitCode=1;});
