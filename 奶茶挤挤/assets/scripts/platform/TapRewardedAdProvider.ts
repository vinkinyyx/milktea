import type { IRewardedAdProvider, Result, RewardedAdCapability, RewardedAdOutcome, UUID } from '../contracts/types';

type TapAdInstance = {
  onLoad?(callback: () => void): void; offLoad?(callback: () => void): void;
  onError?(callback: (error: unknown) => void): void; offError?(callback: (error: unknown) => void): void;
  onClose?(callback: (result?: { isEnded?: boolean }) => void): void; offClose?(callback: (result?: { isEnded?: boolean }) => void): void;
  load?(): Promise<unknown>; show?(): Promise<unknown>; destroy?(): void;
};
type TapGlobal = { createRewardedVideoAd?: (options: { adUnitId: string; multiton: true }) => TapAdInstance };
type InstanceState = { generation:number; instance:TapAdInstance; loaded:boolean; preparing:Promise<Result<void>>|null;
  pending:{attemptId:UUID;resolve:(outcome:RewardedAdOutcome)=>void}|null; loadFinish:((ok:boolean,code?:string)=>void)|null; onLoad:()=>void; onError:(error:unknown)=>void; onClose:(result?:{isEnded?:boolean})=>void };
const tapApi=():TapGlobal|undefined=>(globalThis as unknown as {tap?:TapGlobal}).tap;

/** Attempt-scoped Tap mini-game adapter. SDK listeners are owned and removed per multiton instance. */
export class TapRewardedAdProvider implements IRewardedAdProvider {
  readonly providerName='tap' as const;
  private active:InstanceState|null=null;
  private generation=0;
  private disposed=false;
  constructor(private readonly policy:{enabled:boolean;adUnitId:string|null}){}
  capability():RewardedAdCapability{
    if(!this.policy.enabled)return 'DISABLED';if(!this.policy.adUnitId)return 'UNCONFIGURED';
    return typeof tapApi()?.createRewardedVideoAd==='function'?'SUPPORTED':'UNSUPPORTED';
  }
  async prepare():Promise<Result<void>>{
    if(this.disposed)return this.fail('REWARD_AD_DISPOSED');
    const state=this.getInstance();if(!state)return this.fail('REWARD_AD_UNSUPPORTED');
    if(state.loaded)return {ok:true,data:undefined};if(state.preparing)return state.preparing;
    if(typeof state.instance.load!=='function')return this.fail('REWARD_AD_LOAD_UNSUPPORTED');
    state.preparing=new Promise<Result<void>>(resolve=>{
      let done=false;const finish=(ok:boolean,code='REWARD_AD_LOAD_FAILED')=>{if(done)return;done=true;clearTimeout(timer);state.preparing=null;state.loaded=ok;state.loadFinish=null;resolve(ok?{ok:true,data:undefined}:this.fail(code));if(!ok){this.detach(state);if(this.active===state)this.active=null;}};
      const timer=setTimeout(()=>finish(false,'REWARD_AD_LOAD_TIMEOUT'),10000);
      state.loadFinish=(ok,code)=>finish(ok,code);
      try{const p=state.instance.load!();if(!p||typeof p.then!=='function'){finish(false,'REWARD_AD_LOAD_CONTRACT');return;}p.then(()=>finish(true),()=>finish(false,'REWARD_AD_LOAD_REJECTED'));}
      catch{finish(false,'REWARD_AD_LOAD_THROW');}
    });
    return state.preparing;
  }
  show(attemptId:UUID):Promise<RewardedAdOutcome>{
    if(this.disposed)return Promise.resolve({kind:'FAILED',attemptId,errorCode:'REWARD_AD_DISPOSED'});
    const state=this.active;
    if(!state||!state.loaded||typeof state.instance.show!=='function')return Promise.resolve({kind:'UNAVAILABLE',attemptId,errorCode:'REWARD_AD_NOT_PREPARED'});
    if(state.pending)return Promise.resolve({kind:'UNAVAILABLE',attemptId,errorCode:'REWARD_AD_BUSY'});
    return new Promise(resolve=>{
      state.pending={attemptId,resolve};
      try{const p=state.instance.show!();if(!p||typeof p.then!=='function')this.finish(state,{kind:'FAILED',attemptId,errorCode:'REWARD_AD_SHOW_CONTRACT'});
        else p.catch(()=>this.finish(state,{kind:'FAILED',attemptId,errorCode:'REWARD_AD_SHOW_REJECTED'}));}
      catch{this.finish(state,{kind:'FAILED',attemptId,errorCode:'REWARD_AD_SHOW_THROW'});}
    });
  }
  private getInstance():InstanceState|null{
    if(this.active)return this.active;const api=tapApi();if(!api?.createRewardedVideoAd||!this.policy.adUnitId)return null;
    try{
      const instance=api.createRewardedVideoAd({adUnitId:this.policy.adUnitId,multiton:true});const generation=++this.generation;
      const state:InstanceState={generation,instance,loaded:false,preparing:null,pending:null,loadFinish:null,onLoad:()=>{},onError:()=>{},onClose:()=>{}};
      state.onLoad=()=>{state.loaded=true;state.loadFinish?.(true);};
      state.onError=()=>{state.loaded=false;if(state.pending)this.finish(state,{kind:'FAILED',attemptId:state.pending.attemptId,errorCode:'REWARD_AD_NATIVE_ERROR'});else state.loadFinish?.(false,'REWARD_AD_LOAD_ERROR');};
      state.onClose=result=>{const pending=state.pending;if(!pending)return;this.finish(state,result?.isEnded===true?{kind:'COMPLETED',attemptId:pending.attemptId}:{kind:'CANCELLED',attemptId:pending.attemptId,errorCode:'REWARD_AD_CLOSED_EARLY'});};
      if(!instance.onLoad||!instance.offLoad||!instance.onError||!instance.offError||!instance.onClose||!instance.offClose||!instance.load||!instance.show)return null;
      instance.onLoad(state.onLoad);instance.onError(state.onError);instance.onClose(state.onClose);this.active=state;return state;
    }catch{return null;}
  }
  private finish(state:InstanceState,outcome:RewardedAdOutcome):void{const pending=state.pending;if(!pending||pending.attemptId!==outcome.attemptId)return;state.pending=null;state.loaded=false;pending.resolve(outcome);this.detach(state);if(this.active===state)this.active=null;}
  private detach(state:InstanceState):void{try{state.instance.offLoad?.(state.onLoad);state.instance.offError?.(state.onError);state.instance.offClose?.(state.onClose);state.instance.destroy?.();}catch{/* per-instance teardown is best effort */}}
  private fail(code:string):Result<never>{return {ok:false,error:{code,message:code,retryable:true}};}
  dispose():void{if(this.disposed)return;this.disposed=true;const s=this.active;this.active=null;if(s){if(s.pending)this.finish(s,{kind:'FAILED',attemptId:s.pending.attemptId,errorCode:'REWARD_AD_DISPOSED'});this.detach(s);}}
}
