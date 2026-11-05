import { _decorator, assetManager, AssetManager, AudioClip, Color, Component, Graphics, Input, input, JsonAsset, Label, Node, resources, Sprite, Tween, UITransform, UIOpacity, Vec2, Vec3, tween } from 'cc';

import type { CommandOutcome, DomainEvent, IBundleSaveRepository, IngredientState, Level, LocalSaveBundle, Result, RewardedShakePolicy, RunCommand, RunSnapshot, SpillRevivePolicy } from '../contracts/types';
import { FixedClock } from '../core/Clock';
import { RunEngine, type RunEngineReviveOptions } from '../core/RunEngine';
import { HostLifecycleCoordinator, HostLifecycleSnapshot } from '../core/HostLifecycleCoordinator';
import { AppRuntime } from '../core/AppRuntime';
import { CocosPhysicsAdapter } from '../physics/CocosPhysicsAdapter';
import { ArtAssets } from './ArtAssets';
import { ArtCatalog } from './ArtCatalog';
import { GameAudio, GameAudioCue } from './GameAudio';
import { LocalSaveRepository } from '../persistence/LocalSaveRepository';
import { RewardLedger } from '../persistence/RewardLedger';
import { SaveCodec } from '../persistence/SaveCodec';
import { SaveValidator } from '../persistence/SaveValidator';
import { sha256Utf8 } from '../core/Sha256';

import { RewardedShakeService, type RewardedShakeHost, type RewardedShakeView } from '../application/RewardedShakeService';
import { SpillReviveService, type SpillReviveHost, type SpillReviveView } from '../application/SpillReviveService';
import { RewardedAdCoordinator } from '../application/RewardedAdCoordinator';
import { ReviveLedger } from '../persistence/ReviveLedger';
import { RewardedAdPolicyLoader } from '../core/RewardedAdPolicyLoader';
import { SpillRevivePolicyLoader } from '../core/SpillRevivePolicyLoader';
import { createRewardedAdEnvironment, createReviveAdEnvironment } from '../platform/RewardedAdProviderFactory';
import { gameUiPoint, presentationSize } from '../bootstrap/Viewport';
import { EffectsController } from '../effects/EffectsController';

const { ccclass } = _decorator;
type Screen='MENU'|'PLAYING'|'PAUSED'|'SETTINGS'|'CONFIRM_RESTART'|'CONFIRM_MENU'|'RESULTS'|'ERROR'|'REWARD'|'REVIVE';
const CLOSED_REWARDED_POLICY:Readonly<RewardedShakePolicy>=Object.freeze({
  enabled:false,policyVersion:'policy-unavailable',adUnitId:null,placement:'extra-shake' as const,
  maxExtraShakesPerRun:5,maxDailyRewardedShakes:5,minForegroundSecondsFirstSession:60,
  requireTutorialComplete:true,requireFirstNaturalRunCompleted:true,
});
const CLOSED_SPILL_REVIVE_POLICY:Readonly<SpillRevivePolicy>=Object.freeze({
  enabled:false,policyVersion:'policy-unavailable',adUnitId:null,placement:'spill-revive' as const,
  maxRevivesPerRun:1,maxDailyRevives:3,clearanceDu:40,autoDropDelayTicks:120,
  minForegroundSecondsFirstSession:60,requireTutorialComplete:true,requireFirstNaturalRunCompleted:true,
});
interface Rect { x:number;y:number;w:number;h:number }
interface UiButton { id:string;label:string;rect:Rect;action:()=>void;enabled?:boolean }
type PointDu={x:number;y:number};
function pointSegmentDistance(p:PointDu,a:PointDu,b:PointDu):number {
  const vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy;if(l2===0)return Math.hypot(p.x-a.x,p.y-a.y);
  const t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/l2));return Math.hypot(p.x-a.x-t*vx,p.y-a.y-t*vy);
}
function segmentDistance(a:PointDu,b:PointDu,c:PointDu,d:PointDu):number {
  const cross=(p:PointDu,q:PointDu,r:PointDu)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const on=(p:PointDu,q:PointDu,r:PointDu)=>r.x>=Math.min(p.x,q.x)-1e-9&&r.x<=Math.max(p.x,q.x)+1e-9&&r.y>=Math.min(p.y,q.y)-1e-9&&r.y<=Math.max(p.y,q.y)+1e-9;
  const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b);
  if((o1*o2<0&&o3*o4<0)||(Math.abs(o1)<1e-9&&on(a,b,c))||(Math.abs(o2)<1e-9&&on(a,b,d))||(Math.abs(o3)<1e-9&&on(c,d,a))||(Math.abs(o4)<1e-9&&on(c,d,b)))return 0;
  return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));
}
function circleBoxClearance(p:PointDu,a:PointDu,b:PointDu,outward:PointDu,thickness:number,radius:number):number{
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),tx=dx/length,ty=dy/length;
  const along=(p.x-a.x)*tx+(p.y-a.y)*ty,depth=(p.x-a.x)*outward.x+(p.y-a.y)*outward.y;
  const qx=Math.abs(along-length/2)-(length+thickness)/2,qy=Math.abs(depth-thickness/2)-thickness/2;
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-radius;
}
function crossesFiniteCupWall(previous:PointDu,current:PointDu,a:PointDu,b:PointDu,outward:PointDu,thickness:number,radius:number):boolean{
  const signed=(p:PointDu)=>(p.x-a.x)*outward.x+(p.y-a.y)*outward.y;
  const d0=signed(previous),d1=signed(current);
  if(!((d0 < -radius && d1 > thickness+radius)||(d1 < -radius && d0 > thickness+radius)))return false;
  const t=(0-d0)/(d1-d0),x=previous.x+(current.x-previous.x)*t,y=previous.y+(current.y-previous.y)*t;
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),along=(x-a.x)*(dx/length)+(y-a.y)*(dy/length);
  return along>=-thickness/2-radius&&along<=length+thickness/2+radius;
}
function classifyWallPenetration(signedClearanceDu:number,residualAllowanceDu:number,previousTicks:number,persistenceTicks:number):{penetrationDepthDu:number;consecutiveTicks:number;persistent:boolean}{
  const penetrationDepthDu=Math.max(0,-signedClearanceDu),consecutiveTicks=penetrationDepthDu>residualAllowanceDu?previousTicks+1:0;
  return{penetrationDepthDu,consecutiveTicks,persistent:consecutiveTicks>=persistenceTicks};
}

/** Minimum complete local player loop. Domain writes remain in RunEngine; this class owns UI and scene lifetime. */
@ccclass('P1BGameRoot')
export class GameRoot extends Component {
  private screen:Screen='MENU'; private sceneId=0; private worldId=0; private world:Node|null=null; private rear:Node|null=null; private front:Node|null=null; private fixedBackground:Node|null=null;
  private art=new ArtAssets(); private effects:EffectsController|null=null; private artReady=false; private adapter:CocosPhysicsAdapter|null=null; private engine:RunEngine|null=null; private clock:FixedClock|null=null;
  private audio:GameAudio|null=null; private audioLoading=false; private audioUnlockRequested=false; private audioFailure='';
  private ingredientViews=new Map<number,Node>();
  private shakeArcNodes:Array<{node:Node;opacity:UIOpacity}>=[];
  private classicBundle:AssetManager.Bundle|null=null; private classicBundleLoad:Promise<AssetManager.Bundle|null>|null=null;
  private readonly audioClips:Partial<Record<GameAudioCue|'bgm_classic',AudioClip>>={}; private readonly audioFailures=new Set<GameAudioCue|'bgm_classic'>();
  private repo=new LocalSaveRepository(); private bundle:LocalSaveBundle=LocalSaveRepository.emptyBundle(); private bundleRevision=0;
  private rewarded:RewardedShakeService|null=null; private rewardedHost:RewardedShakeHost|null=null; private rewardedPolicyError=''; private foregroundSeconds=0;
  private spillRevive:SpillReviveService|null=null; private spillReviveHost:SpillReviveHost|null=null; private spillRevivePolicyError=''; private adOverlayKind:'extra-shake'|'spill-revive'='extra-shake';
  private debugRepo:LocalSaveRepository|null=null; private debugLease:(()=>void)|null=null; private debugNamespace:string|null=null; private debugMode=false;
  private lease:(()=>void)|null=null; private persistent=false; private loading=false; private saveInFlight=false; private activeSaveTaskId=0; private saveTaskSequence=0; private saveIdleWaiters:Array<()=>void>=[]; private saveDirty=false; private settingsDirty=false; private saveAge=0; private baseTick=0;
  private leaseInitialized=false; private bundleInitialized=false; private artRetryTask:Promise<void>|null=null; private artLoadGeneration=0; private pendingStartRequested=false;
  private buttons:UiButton[]=[]; private labels=new Map<string,Label>(); private previewX=375; private primaryPointer:number|null=null; private dropStartX=0; private dropStartPreviewX=375;
  private pointerKind:'ui'|'drop'|'cup'|null=null; private startedInButton:string|null=null; private ignoreMouseUntil=0; private ownerEpoch=0; private lastCommand:CommandOutcome|null=null;
  private cupPointerStartX=0; private cupPointerStartOffset=0;
  private lastEvents:DomainEvent[]=[]; 
    
  // R1 整改：开局阶段日志（docs44 要求环形内存最多 32 条，禁止逐帧写盘）
  private readonly stages=new DiagnosticRing<Record<string,unknown>>(64); private readonly stageStartedAtMs=performance.now();
   
     
  private pauseOwners=new Set<string>(); private lifecycleOff:(()=>void)|null=null; private notice=''; private mode:'drag_release'|'tap_confirm'='drag_release'; private reducedMotion=false;
  private settingsReturnScreen:'MENU'|'PAUSED'='MENU'; private tutorialStep=0; private tutorialReturnScreen:Screen='PLAYING';
  private resultSaved=false; private resultFinalized=false; private resultError=''; private runBestScoreAtStart=0; private uiRoot:Node|null=null;
  private recoveryUsedRunId:string|null=null;
  private showPhysicsDiagnostics=false;
  private previewGraphic:Sprite|null=null;
     
   
  private contactPairs=new Set<string>(); private contactObjectTicks=new Map<number,number>(); private lastContactFeedbackTick=-60; private feedbackSequence=0;
  private readonly keydown=(event:KeyboardEvent)=>{if(event.key.toLowerCase()==='p')this.togglePause();else if(event.key.toLowerCase()==='r')this.resumeByUser();};
  private readonly onWindowBlur=()=>this.cancelPointer();
  onLoad():void{
    
    this.sceneId=GameRoot.nextSceneId++; this.lifecycleOff=HostLifecycleCoordinator.subscribe(s=>this.onLifecycle(s));
    input.on(Input.EventType.TOUCH_START,this.onTouchStart,this);input.on(Input.EventType.TOUCH_MOVE,this.onTouchMove,this);input.on(Input.EventType.TOUCH_END,this.onTouchEnd,this);input.on(Input.EventType.TOUCH_CANCEL,this.onTouchCancel,this);
    input.on(Input.EventType.MOUSE_DOWN,this.onMouseDown,this);input.on(Input.EventType.MOUSE_MOVE,this.onMouseMove,this);input.on(Input.EventType.MOUSE_UP,this.onMouseUp,this);
    window.addEventListener('keydown',this.keydown);
    window.addEventListener('blur',this.onWindowBlur);
    this.uiRoot=new Node('P1BPlayerUI');this.node.addChild(this.uiRoot);this.uiRoot.setSiblingIndex(this.node.children.length-1);this.effects=new EffectsController(this.uiRoot);
    void this.initialize();
    // initialize() synchronously paints the player loading UI before its first
    // await. Retire the earlier brand layer so it cannot cover a later shop
    // background inserted at sibling index zero.
    const startupFrame=this.node.getChildByName('MilkTeaStartupFrame');
    if(startupFrame?.isValid){startupFrame.active=false;startupFrame.destroy();}
  }
  private artLoading=false;
  private buttonSkins=new Map<string,{node:Node;family:string}>();
  private static nextSceneId=1;
  private static nextWorldId=1;
  /** R1 整改：记录开局阶段，环形内存（最多64条，docs44要求实际报告取最新32条），禁止逐帧写盘。 */
  private appendStage(name:string,result:string='ok',detail?:Record<string,unknown>):void{
    this.stages.append({name,result,msSinceBoot:performance.now()-this.stageStartedAtMs,epoch:this.ownerEpoch,detail});
  }
  private async initialize():Promise<void>{
    if(this.loading)return;this.loading=true;this.artLoading=true;this.render();
    this.appendStage('BOOT_CONFIG','start');
    try{
      if(!this.leaseInitialized){const lock=await this.repo.acquireWriteLease();this.leaseInitialized=true;if(lock.ok){if(!this.isOwner()){lock.data.release();this.appendStage('BOOT_CONFIG','error',{reason:'not_owner'});return;}this.lease=lock.data.release;this.persistent=lock.data.mode==='persistent';}}
      this.appendStage('BOOT_CONFIG','ok',{persistent:this.persistent,leaseHeld:!!this.lease});
      if(!this.isOwner())return;
      if(!this.bundleInitialized){const stored=await this.repo.readBundle();if(!this.isOwner())return;
        if(stored.ok){if(stored.data.envelope){this.bundle=stored.data.envelope.payload;this.bundleRevision=stored.data.envelope.revision;}
          if(stored.data.warning)this.notice=stored.data.warning;}
        else{this.persistent=false;this.notice=`存档不可续用：${stored.error.message}。原始槽保留；为保护存档，当前禁止持久化覆盖。`;}this.bundleInitialized=true;}
      this.appendStage('SAVE_READ',this.bundleInitialized?'ok':'error',{hasRun:!!this.bundle.run,revision:this.bundleRevision});
      this.mode=this.bundle.profile.settings.dropMode;this.reducedMotion=this.bundle.profile.settings.reducedMotion;
      if(!this.rewarded)await this.initializeRewardedShake();if(!this.isOwner())return;
      if(!this.spillRevive)await this.initializeSpillRevive();if(!this.isOwner())return;
      this.appendStage('SAVE_READ','ok',{rewardedShake:!!this.rewarded,spillRevive:!!this.spillRevive});
      await this.art.initialize();if(!this.isOwner()){this.art.dispose();return;}this.artReady=true;
      this.appendStage('ART_CATALOG','ok',{catalogSize:this.art.catalog?0:0});
      await this.loadRequiredArt();
      if(!this.isOwner()){this.art.dispose();return;}
      this.appendStage('ART_CATALOG','ok',{loadedArt:this.art.loadedCount});
      this.artLoading=false;this.render();this.bindRewardedShake();this.bindSpillRevive();void this.loadAudioClips();if(!this.isOwner())return;
      this.appendStage('MENU_READY','ok',{screen:this.screen});
      
      if(this.bundle.run){this.notice=this.bundle.run.rulesVersion===AppRuntime.rules?.design_rules_version?'发现可续局存档。选择“继续上局”后仍需明确点击继续。':'发现旧版玩法未完成局；原存档已保留，可取消确认或明确开始新局。';}
    }catch(error){this.artLoading=false;if(this.isOwner()){this.appendStage('BOOT_CONFIG','error',{reason:String(error)});this.screen='ERROR';this.notice=`启动失败：${String(error)}`;this.render();}}
    finally{if(this.isOwner()){this.loading=false;if(this.pendingStartRequested&&this.artReady&&this.screen==='MENU'){this.pendingStartRequested=false;void this.startNew();}}}
  }
  onDestroy():void{
    this.ownerEpoch++;this.lifecycleOff?.();this.lifecycleOff=null;if(this.rewarded&&this.rewardedHost)this.rewarded.unbind(this.rewardedHost);this.rewardedHost=null;if(this.spillRevive&&this.spillReviveHost)this.spillRevive.unbind(this.spillReviveHost);this.spillReviveHost=null;
    input.off(Input.EventType.TOUCH_START,this.onTouchStart,this);input.off(Input.EventType.TOUCH_MOVE,this.onTouchMove,this);input.off(Input.EventType.TOUCH_END,this.onTouchEnd,this);input.off(Input.EventType.TOUCH_CANCEL,this.onTouchCancel,this);
    input.off(Input.EventType.MOUSE_DOWN,this.onMouseDown,this);input.off(Input.EventType.MOUSE_MOVE,this.onMouseMove,this);input.off(Input.EventType.MOUSE_UP,this.onMouseUp,this);window.removeEventListener('keydown',this.keydown);window.removeEventListener('blur',this.onWindowBlur);
    this.clock?.pause();this.clock=null;this.engine?.dispose();this.engine=null;this.effects?.dispose();this.effects=null;this.art.dispose();this.audio?.dispose();this.audio=null;
    for(const cue of Object.keys(this.audioClips) as Array<GameAudioCue|'bgm_classic'>)this.releaseAudioClip(cue);
    this.debugLease?.();this.debugLease=null;this.debugRepo=null;this.lease?.();this.lease=null;
  }
  update(dt:number):void{
    const probing=false;const begin=probing?performance.now():0;const before=this.engine?.tick??0;let stepCount=0;
    if(this.screen==='PLAYING'&&this.tutorialStep===0&&this.clock&&this.engine){
      try{
        const result=this.clock.update(dt);stepCount=result.steps;
        
        if(this.clock.tick+this.baseTick!==this.engine.tick)throw new Error('CLOCK_ENGINE_TICK_DIVERGED');
        this.processEvents();
      }catch(error){this.enterTechnicalError(String(error));}
    }
    const presentationStart=probing?performance.now():0;const states=this.engine?.renderStates()??null;this.syncViews(states);this.syncCupArt();this.syncViewportBackgrounds();
    if(this.engine&&this.activeSaveRepository()&&this.engine.tick-this.lastSaveTick>=120)this.saveDirty=true;
    this.saveAge+=Math.max(0,dt)*1000;if(this.saveDirty&&!this.saveInFlight&&this.engine?.phase!=='SETTLING'&&this.saveAge>=250){this.saveAge=0;void this.commitCheckpoint(false);}
    if(this.engine&&this.engine.phase==='SETTLING'&&!this.resultFinalized&&!this.saveInFlight)void this.commitResult();
    if(!this.pauseOwners.has('HOST_HIDDEN')&&this.screen!=='REWARD'&&this.screen!=='REVIVE')this.foregroundSeconds+=Math.max(0,dt);this.rewarded?.setForegroundSeconds(this.foregroundSeconds);this.spillRevive?.setForegroundSeconds(this.foregroundSeconds);this.effects?.setPaused(this.screen==='PAUSED'||this.screen==='REWARD'||this.screen==='REVIVE'||this.pauseOwners.has('HOST_HIDDEN'));this.effects?.update(Math.max(0,dt));
    if(this.uiRefreshElapsed>=.12){this.uiRefreshElapsed=0;this.refreshHud();}else this.uiRefreshElapsed+=Math.max(0,dt);
  }
  private uiRefreshElapsed=0;
  private isOwner():boolean{return this.isValid&&this.sceneId===GameRoot.nextSceneId-1;}
  private onLifecycle(state:HostLifecycleSnapshot):void{
    if(state.resumeRequired)this.pauseOwners.add('RESUME_REQUIRED');
    const terminal=this.engine?.phase==='SETTLING';
    if(state.backgrounded){this.pauseOwners.add('HOST_HIDDEN');this.cancelPointer();this.audio?.pauseForHidden();if(this.engine){this.engine.pause('HOST_HIDDEN');this.clock?.pause();if(!terminal&&!this.isModalScreen())this.screen='PAUSED';if(!terminal){this.notice='应用已进入后台；返回后请点击“继续”。';this.saveDirty=true;void this.commitCheckpoint(true);}this.render();}}
    else{this.pauseOwners.delete('HOST_HIDDEN');if(this.engine&&state.resumeRequired){this.engine.pause('RESUME_REQUIRED');this.clock?.pause();if(!terminal&&!this.isModalScreen())this.screen='PAUSED';if(!terminal)this.notice='已返回前台；物理保持暂停，请点击“继续”。';this.render();}}
  }
  private async initializeRewardedShake():Promise<void>{
    let policy:Readonly<RewardedShakePolicy>=CLOSED_REWARDED_POLICY;
    try{
      const json=await new Promise<unknown>((resolve,reject)=>resources.load('config/rewarded-ad-policy',JsonAsset,(error,asset)=>error||!asset?reject(error??new Error('激励广告策略缺失')):resolve(asset.json)));
      const validated=RewardedAdPolicyLoader.validate(json);
      if(validated.ok)policy=validated.data;else{this.rewardedPolicyError=validated.error.message;console.warn('[reward] policy invalid',validated.error.message);}
    }catch(error){this.rewardedPolicyError=String(error);console.warn('[reward] policy load failed',String(error));}
    this.rewarded=RewardedShakeService.create(createRewardedAdEnvironment({...policy}),this.adSaveRepository(),()=>Date.now());
  }
  private bindRewardedShake():void{
    if(!this.rewarded)return;if(!this.rewardedHost)this.rewardedHost=this.makeRewardedHost();
    this.rewarded.setForegroundSeconds(this.foregroundSeconds);this.rewarded.bind(this.rewardedHost);
  }
  private makeRewardedHost():RewardedShakeHost{
    return {
      getActiveRunSnapshot:()=>this.activeRunSnapshot(),
      getBundle:()=>this.bundle,
      getSaveRevision:()=>this.bundleRevision,
      isTutorialComplete:()=>this.bundle.profile.settings.tutorialCompleted||this.bundle.profile.tutorialRulesVersion===AppRuntime.rules?.design_rules_version,
      getForegroundSeconds:()=>this.foregroundSeconds,
      pauseForRewardedAd:()=>{this.adOverlayKind='extra-shake';this.pauseForRewardedAd();},
      resumeFromRewardedAd:(notice)=>this.resumeFromRewardedAd(notice),
      onRewardedShakeChanged:()=>this.onRewardedChanged(),
      onRewardedShakeCommitted:(bundle,revision)=>{this.bundle=bundle;this.bundleRevision=revision;},
      applyCommittedExtraGrant:()=>{const applied=this.engine?.commitExtraGrant(1);if(applied&&!applied.ok)this.enterTechnicalError(applied.error.message);},
      waitForSaveIdle:()=>this.waitForSaveIdle(),
    };
  }
  private async initializeSpillRevive():Promise<void>{
    let policy:Readonly<SpillRevivePolicy>=CLOSED_SPILL_REVIVE_POLICY;
    try{
      const json=await new Promise<unknown>((resolve,reject)=>resources.load('config/spill-revive-policy',JsonAsset,(error,asset)=>error||!asset?reject(error??new Error('复活广告策略缺失')):resolve(asset.json)));
      const validated=SpillRevivePolicyLoader.validate(json);
      if(validated.ok)policy=validated.data;else{this.spillRevivePolicyError=validated.error.message;console.warn('[revive] policy invalid',validated.error.message);}
    }catch(error){this.spillRevivePolicyError=String(error);console.warn('[revive] policy load failed',String(error));}
    this.spillRevive=SpillReviveService.create(createReviveAdEnvironment({...policy}),this.adSaveRepository(),()=>Date.now());
  }
  private bindSpillRevive():void{
    if(!this.spillRevive)return;if(!this.spillReviveHost)this.spillReviveHost=this.makeSpillReviveHost();
    this.spillRevive.setForegroundSeconds(this.foregroundSeconds);this.spillRevive.bind(this.spillReviveHost);
  }
  private reviveOptions():Readonly<RunEngineReviveOptions>{
    const policy=this.spillRevive?.policy;
    return {enabled:!!policy?.enabled,clearanceDu:policy?.clearanceDu??0,autoDropDelayTicks:policy?.autoDropDelayTicks??0};
  }
  private makeSpillReviveHost():SpillReviveHost{
    return {
      getActiveRunSnapshot:()=>this.activeRunSnapshot(),
      getBundle:()=>this.bundle,
      getSaveRevision:()=>this.bundleRevision,
      isTutorialComplete:()=>this.bundle.profile.settings.tutorialCompleted||this.bundle.profile.tutorialRulesVersion===AppRuntime.rules?.design_rules_version,
      getForegroundSeconds:()=>this.foregroundSeconds,
      pauseForRewardedAd:()=>{this.adOverlayKind='spill-revive';this.pauseForRewardedAd();},
      resumeFromRewardedAd:(notice)=>this.resumeFromRewardedAd(notice),
      onSpillReviveChanged:()=>this.onSpillReviveChanged(),
      onSpillReviveCommitted:(bundle,revision)=>{this.bundle=bundle;this.bundleRevision=revision;},
      projectRevive:(receiptId)=>this.engine?this.engine.projectRevive(receiptId):{ok:false,error:{code:'NO_RUN',message:'no active run',retryable:false}} as Result<RunSnapshot>,
      applyCommittedRevive:(receiptId)=>{
        if(!this.engine)return false;
        if(this.engine.reviveReceiptId===receiptId)return true;
        const applied=this.engine.applyRevive(receiptId);
        if(!applied.ok){this.notice=applied.error.message;return false;}
        this.pauseOwners.add('AD');this.clock?.pause();
        return true;
      },
      declineSpillRevive:()=>this.declineSpillRevive(),
      waitForSaveIdle:()=>this.waitForSaveIdle(),
    };
  }
  private reviveView():SpillReviveView|null{return this.spillRevive?.getView()??null;}
  private onSpillReviveChanged():void{
    if(!this.spillRevive)return;
    if(this.screen==='REVIVE'){this.render();return;}
    const message=this.reviveView()?.message;if(message&&this.screen==='PLAYING'){this.notice=message;this.render();}
  }
  private declineSpillRevive():void{
    const ended=this.engine?.declineRevive()??null;
    if(ended){this.lastEvents.push(ended);this.processEvents();return;}
    if(this.engine?.phase==='SETTLING')this.screen='RESULTS';else if(this.engine)this.screen='PAUSED';
    this.render();
  }
  private enterSpillOffer():void{
    this.clock?.pause();this.cancelPointer();this.screen='REVIVE';this.notice='';this.saveDirty=true;this.render();void this.commitCheckpoint(true);
  }
  private activeRunSnapshot():RunSnapshot|null{const live=this.engine?.snapshot();return live&&this.bundle.profile.activeRunId===live.runId?live:this.bundle.run;}
  private rewardView():RewardedShakeView|null{return this.rewarded?.getView()??null;}
  private pauseForRewardedAd():void{
    this.cancelPointer();this.saveDirty=false;this.pauseOwners.add('AD');
    if(this.engine){this.engine.pause('AD');this.clock?.pause();}
    this.audio?.pauseForHidden();this.screen=this.adOverlayKind==='spill-revive'?'REVIVE':'REWARD';this.notice='';this.render();
  }
  private resumeFromRewardedAd(notice:string|null):void{this.pauseOwners.delete('AD');this.screen=this.engine?'PAUSED':'MENU';this.notice=notice??'';this.render();}
  private onRewardedChanged():void{
    if(!this.rewarded)return;
    if(this.screen==='REWARD'){this.render();return;}
    const message=this.rewardView()?.message;if(message){this.notice=message;this.render();}
  }
  private openRewardedOffer():void{
    if(!this.rewarded){this.notice='广告奖励暂不可用';this.render();return;}
    if(RewardedAdCoordinator.busy()){this.notice='另有广告正在进行，请稍后再试。';this.render();return;}
    if(this.rewardView()?.pendingAttempt){this.rewarded.openPendingReview();return;}
    this.rewarded.openOffer();
  }
  private renderReward():void{
    const view=this.rewardView();
    this.themePanel('ui_panel_modal',375,667,660,800,true);
    if(!view){this.text('reward-title','激励视频',375,930,36);this.text('reward-message','广告组件尚未就绪',375,820,22);this.button('reward-back','返回游戏',185,540,380,96,()=>this.rewarded?.closeOffer());return;}
    const title=view.phase==='GRANTED'?'奖励已到账':view.phase==='ERROR'?'广告奖励':'额外晃杯';
    this.text('reward-title',title,375,950,38);
    this.text('reward-stats',`本局奖励 ${view.grantedThisRun}/${view.runLimit}  ·  今日剩余 ${view.dailyRemaining}`,375,870,22);
    const message=view.phase==='OFFER'?'观看一段激励视频，本局额外获得 1 次晃杯。\n广告完整看完并保存成功后才计入本局。':view.phase==='PREPARING'?'正在准备激励视频…':view.phase==='SHOWING'?'广告播放中…':view.phase==='SETTLING'?'正在保存奖励…':view.phase==='GRANTED'?'奖励已保存。返回后点击“继续”恢复本局。':view.message??'广告暂时不可用。';
    this.text('reward-message',message,375,770,23);
    if(view.phase==='OFFER'){this.button('reward-watch','观看广告 +1 次',185,610,380,96,()=>void this.rewarded?.watch());this.button('reward-cancel','取消',185,480,380,96,()=>this.rewarded?.closeOffer());}
    else if(view.phase==='GRANTED'){this.button('reward-continue','继续游戏',185,520,380,96,()=>this.rewarded?.acknowledgeGrant());}
    else if(view.phase==='ERROR'){
      if(view.retrySettle)this.button('reward-retry','重试领取',185,610,380,96,()=>void this.rewarded?.retrySettlement());
      else if(view.pendingAttempt)this.button('reward-abandon','放弃未确认奖励',185,610,380,96,()=>void this.rewarded?.abandonPending());
      this.button('reward-back','返回游戏',185,470,380,96,()=>this.rewarded?.closeOffer());
    }
    if(view.simulated)this.text('reward-mock','Debug 模拟广告：不会展示真实视频',375,370,20,new Color(170,70,40));
  }
  private renderRevive():void{
    const view=this.reviveView();
    this.themePanel('ui_panel_modal',375,667,660,900,true);
    this.text('revive-title','小料洒出来了',375,1010,44,new Color(103,58,32));
    const copy='分数与进度保留。完整观看激励视频可复活本局一次。\n复活时会清理洒出的小料和杯口危险区，\n成功后 2 秒内不会落新料。';
    this.text('revive-copy',copy,375,900,23);this.labels.get('revive-copy')?.node.getComponent(UITransform)?.setContentSize(560,150);
    if(!view){this.text('revive-status','复活组件尚未就绪',375,790,22);this.button('revive-end','结束本局',185,540,380,96,()=>this.declineSpillRevive());return;}
    const status=view.phase==='GRANTED'?'复活成功：分数已保留，点击继续。':view.phase==='PREPARING'?'正在准备激励视频…':view.phase==='SHOWING'?'广告播放中…':view.phase==='SETTLING'?'正在保存复活结果…':view.phase==='ERROR'?(view.message??'复活流程未完成'):view.block===null?'本局可复活一次；完整观看后才发放。':this.reviveBlockText(view.block);
    this.text('revive-status',status,375,790,22);
    if(view.phase==='GRANTED'){this.button('revive-continue','继续游戏',185,560,380,96,()=>this.spillRevive?.acknowledgeGrant());return;}
    if(view.phase==='PREPARING'||view.phase==='SHOWING'||view.phase==='SETTLING')return;
    if(view.phase==='ERROR'){
      if(view.retrySettle)this.button('revive-retry','重试领取',185,620,380,96,()=>void this.spillRevive?.retrySettlement());
      else if(view.pendingAttempt)this.button('revive-abandon','放弃未确认奖励',185,620,380,96,()=>void this.spillRevive?.abandonPending());
      this.button('revive-end','结束本局',185,490,380,96,()=>this.spillRevive?.closeOffer());
    }else if(view.pendingAttempt){
      this.text('revive-status','上次复活广告未得到可信完成确认，未发放。',375,790,22);
      this.button('revive-abandon','放弃并结算',185,560,380,96,()=>void this.spillRevive?.abandonPending());
    }else if(view.block===null){
      this.button('revive-watch','观看广告复活',185,620,380,96,()=>{this.spillRevive?.openOffer();void this.spillRevive?.watch();});
      this.button('revive-end','结束本局（正常结算）',185,490,380,96,()=>this.spillRevive?.closeOffer());
    }else{
      this.button('revive-end','结束本局',185,520,380,96,()=>this.spillRevive?.closeOffer());
    }
    if(view.simulated)this.text('revive-mock','Debug 模拟广告：不会展示真实视频',375,340,20,new Color(170,70,40));
  }
  private reviveBlockText(block:SpillReviveView['block']):string{
    switch(block){
      case 'POLICY_DISABLED':return '洒出复活广告尚未开启';
      case 'AD_UNCONFIGURED':return '未配置真实复活广告位';
      case 'AD_UNSUPPORTED':return '当前环境不支持激励广告';
      case 'NO_ACTIVE_RUN':case 'NOT_SPILL_PENDING':return '当前没有可复活的洒出局';
      case 'RUN_LIMIT':return '本局已使用过复活';
      case 'DAILY_LIMIT':return '今日复活次数已达上限';
      case 'TUTORIAL_REQUIRED':return '完成教程后可观看复活广告';
      case 'FIRST_RUN_REQUIRED':return '完成一局真实游戏后可观看复活广告';
      case 'FOREGROUND_REQUIRED':return '游戏时间稍短，暂不可观看复活广告';
      case 'PENDING_ATTEMPT':return '有未确认的复活奖励';
      default:return '暂不可复活';
    }
  }
  private async startNew(memoryOnly=false,seedOverride?:number,attemptId?:string):Promise<void>{
    while(this.saveInFlight)await this.waitForSaveIdle();if(this.loading||this.screen==='PLAYING')return;this.loading=true;this.notice='正在建立新局…';this.render();const owner=++this.ownerEpoch;
    try{
      if(!this.artReady)throw new Error('美术资源尚未就绪');
      await this.loadGameArt();if(!this.isOwner()||owner!==this.ownerEpoch)return;
      const rules=AppRuntime.rules!;this.runBestScoreAtStart=this.bundle.profile.bestScoresByRules?.[rules.design_rules_version]?.classic?.standard??0;const runId=this.makeUuid();const seed=seedOverride??this.seed();const adapter=this.createWorld();
      const engine=new RunEngine(adapter,rules,runId,seed,undefined,this.reviveOptions());engine.setTimingDiagnostics(false);this.adapter=adapter;this.engine=engine;this.baseTick=0;this.lastEvents=[];this.consumedDomainEventIds.clear();this.resultSaved=false;this.resultError='';this.screen='PLAYING';
      this.tutorialStep=this.bundle.profile.tutorialRulesVersion===rules.design_rules_version?0:1;this.tutorialReturnScreen='PLAYING';
      this.pauseOwners.clear();const host=HostLifecycleCoordinator.snapshot();if(host.resumeRequired)this.pauseOwners.add('RESUME_REQUIRED');if(host.backgrounded)this.pauseOwners.add('HOST_HIDDEN');if(this.tutorialStep){engine.pause('MODAL');this.pauseOwners.add('MODAL');}
      const snap=engine.snapshot();const pendingReward=this.bundle.profile.rewardedShake.pendingAttempt;const pendingRevive=this.bundle.profile.rewardedRevive.pendingAttempt;const next={...this.bundle,profile:{...this.bundle.profile,activeRunId:runId,revision:this.bundle.profile.revision+1,rewardedShake:pendingReward&&pendingReward.runId!==runId?RewardLedger.clearPending(this.bundle.profile.rewardedShake):this.bundle.profile.rewardedShake,rewardedRevive:pendingRevive&&pendingRevive.runId!==runId?ReviveLedger.clearPending(this.bundle.profile.rewardedRevive):this.bundle.profile.rewardedRevive},run:snap,lastResult:null};
      const repository=this.activeSaveRepository();
      if(!memoryOnly&&repository&&this.persistent){const committed=await repository.commitBundle(this.bundleRevision,this.bundle.run?.runId??null,next);
        if(!committed.ok){engine.dispose();this.engine=null;this.adapter=null;this.world?.destroy();this.world=null;this.clock=null;this.screen='ERROR';this.notice=`新局存档失败：${committed.error.message}。可重试或明确选择仅内存新局。`;this.resultError=this.notice;this.render();return;}
        this.bundleRevision=committed.data.revision;this.bundle=next;this.notice=committed.data.warning??'';
      }else{this.bundle=next;if(!this.debugMode)this.persistent=false;this.notice=this.debugMode?'':'仅内存模式：此局不会跨关闭页面保存。';}
      if(!this.isOwner()||owner!==this.ownerEpoch)return;
      this.clock=new FixedClock(rules.physics.fixed_hz,rules.physics.max_catchup_steps,()=>this.advanceRunTick());
      if(this.pauseOwners.size){if(!this.pauseOwners.has('MODAL')){this.engine.pause(this.pauseOwners.has('HOST_HIDDEN')?'HOST_HIDDEN':'RESUME_REQUIRED');this.screen='PAUSED';}this.clock.pause();}
      this.previewX=rules.cup.center_x_du;this.lastSaveTick=0;this.resultFinalized=false;this.resultSaved=false;this.resultError='';this.saveDirty=true;this.bindRewardedShake();this.bindSpillRevive();this.render();
    }catch(error){if(this.isOwner()&&owner===this.ownerEpoch){this.enterTechnicalError(String(error));}}
    finally{if(this.isOwner()&&owner===this.ownerEpoch)this.loading=false;}
  }
  private createWorld():CocosPhysicsAdapter{
    if(this.world?.isValid)this.world.destroy();this.ingredientViews.clear();this.shakeArcNodes=[];this.contactPairs.clear();this.contactObjectTicks.clear();this.lastContactFeedbackTick=-60;this.world=new Node('P1BPhysicsWorld');this.node.addChild(this.world);this.world.setSiblingIndex(Math.max(0,this.node.children.length-2));this.worldId=GameRoot.nextWorldId++;
    const rules=AppRuntime.rules!;const adapter=new CocosPhysicsAdapter(this.world,rules,AppRuntime.mapper!);adapter.setTimingDiagnostics(false);adapter.createCup('classic');
    this.createCupArt();return adapter;
  }
  private createCupArt():void{
    const rules=AppRuntime.rules!;if(this.rear?.isValid)this.rear.destroy();if(this.front?.isValid)this.front.destroy();
    this.rear=new Node('CupRearArt');this.node.addChild(this.rear);this.rear.setSiblingIndex(Math.max(0,this.node.children.length-3));
    this.front=new Node('CupFrontArt');this.node.addChild(this.front);this.front.setSiblingIndex(Math.max(0,this.node.children.length-2));
    if(this.fixedBackground?.isValid)this.fixedBackground.destroy();this.fixedBackground=this.art.createSprite(this.node,'bg_shop_base',rules.viewport.width_du,rules.viewport.height_du,true);this.fixedBackground.name='FixedShopBackground';this.fixedBackground.setPosition(0,0,-10);this.fixedBackground.setSiblingIndex(0);this.coverBackground(this.fixedBackground,'bg_shop_base');
    const shadow=this.art.createSprite(this.rear,'spr_cup_shadow',512,128);shadow.setPosition(0,this.localY(rules.cup.inner_bottom_y_du-30),0);
    // The 1000-DU source layers are mapped only along Y: y' = 360 + (y - 260) * 0.8.
    // This aligns the existing transparent cup art to the new 360..1000 DU physical bowl.
    for(const suffix of ['back','tea','rim_back']){const id=`spr_cup_classic_${suffix}`,variant=this.art.catalog.select(id,1000),size=variant.display_size??variant.size;const n=this.art.createSprite(this.rear,id,size[0],size[1]);n.setPosition(-size[0]/2,this.localY(312),0);n.setScale(1,0.8,1);}
    for(const suffix of ['front','rim_front','base','label']){const id=`spr_cup_classic_${suffix}`,variant=this.art.catalog.select(id,1000),size=variant.display_size??variant.size;const n=this.art.createSprite(this.front,id,size[0],size[1]);n.setPosition(-size[0]/2,this.localY(312),0);n.setScale(1,0.8,1);}
    for(const side of [-1,1])for(let index=0;index<2;index++){
      const node=new Node(`CupShakeArc-${side}-${index}`);this.front.addChild(node);node.setPosition(side*(245+index*18),this.localY(875),2);
      const opacity=node.addComponent(UIOpacity);opacity.opacity=0;const graphics=node.addComponent(Graphics);graphics.lineWidth=5;graphics.strokeColor=new Color(255,232,192,230);
      graphics.arc(0,0,16+index*7,side<0?0.25:Math.PI+0.25,side<0?2.9:Math.PI+2.9,false);graphics.stroke();this.shakeArcNodes.push({node,opacity});
    }
    // Audio nodes are siblings too; keep the full-screen cup art below the player HUD.
    if(this.uiRoot?.isValid)this.uiRoot.setSiblingIndex(this.node.children.length-1);
  }
  private syncCupArt():void{
    const engine=this.engine;const offset=engine?.presentationCupOffsetXDu??0;
    const tick=engine?.presentationTick??0;const start=engine?.presentationShakeStartTick??null;const rules=AppRuntime.rules;
    let visual=0;
    if(start!==null&&rules){const elapsed=Math.max(0,(tick-start)/rules.physics.fixed_hz);const duration=rules.shake.duration_seconds;if(elapsed<duration){const amp=this.reducedMotion?Math.min(2,rules.shake.visual_offset_max_du):rules.shake.visual_offset_max_du;visual=amp*Math.sin(Math.PI*elapsed/duration)**2*Math.sin(2*Math.PI*rules.shake.frequency_hz*elapsed);}}
    const x=offset+visual;if(this.rear?.isValid)this.rear.setPosition(x,0,0);if(this.front?.isValid)this.front.setPosition(x,0,0);
    const elapsed=start===null||!rules?-1:(tick-start)/rules.physics.fixed_hz;let alpha=0;
    if(rules&&elapsed>=0&&elapsed<rules.shake.duration_seconds){alpha=Math.min(1,elapsed/0.1,(rules.shake.duration_seconds-elapsed)/0.15);if(this.reducedMotion)alpha=Math.min(0.55,alpha);}
    for(const arc of this.shakeArcNodes)if(arc.node.isValid)arc.opacity.opacity=Math.max(0,Math.round(alpha*255));
  }
  private localY(worldY:number):number{return worldY-(AppRuntime.rules!.viewport.height_du/2);}
  private syncViews(states:readonly import('../contracts/types').IngredientState[]|null):void{
    if(!states||!this.adapter||!this.world?.isValid)return;
    const live=new Set(states.map(s=>s.entityId));
    for(const [id,node] of this.ingredientViews)if(!live.has(id)||!node.isValid){if(node.isValid)node.destroy();this.ingredientViews.delete(id);}
    for(const state of states){let n=this.ingredientViews.get(state.entityId);if(!n?.isValid){const item=AppRuntime.rules!.ingredients.find(v=>v.level===state.level)!;n=this.art.createSprite(this.world,ArtCatalog.ingredientId(item.id),ArtCatalog.ingredientEdgeDu(item.radius_du),ArtCatalog.ingredientEdgeDu(item.radius_du),true);n.name=`P1BIngredientVisual-${state.entityId}`;this.ingredientViews.set(state.entityId,n);}
      n.setPosition(state.positionDu.x-AppRuntime.rules!.viewport.width_du/2,state.positionDu.y-AppRuntime.rules!.viewport.height_du/2,0);n.angle=state.angleRadians*180/Math.PI;}
  }
  private lastSaveTick=0;
  private lastDangerCueTick=-60;
  private consumedDomainEventIds=new Set<string>();
  
  private processEvents():void{
    if(!this.lastEvents.length)return;
    for(const event of this.lastEvents){if(this.consumedDomainEventIds.has(event.eventId))continue;this.consumedDomainEventIds.add(event.eventId);if(this.consumedDomainEventIds.size>4096)this.consumedDomainEventIds.delete(this.consumedDomainEventIds.values().next().value!);if(event.kind==='IngredientDropped'||event.kind==='MergeCommitted'||event.kind==='ShakeConsumed')this.saveDirty=true;
      if(event.kind==='IngredientDropped')this.audio?.play('drop');
      if(event.kind==='MergeCommitted'){this.showMergeFeedback(event.positionDu,event.scoreDelta);void this.effects?.play('merge',event.positionDu.x,event.positionDu.y,event.eventId,this.reducedMotion);void this.effects?.play('combo',event.positionDu.x,event.positionDu.y+72,event.eventId,this.reducedMotion);}
      if(event.kind==='MergeCommitted')this.audio?.play(event.childLevel<=4?'merge_small':'merge_large');
      if(event.kind==='ShakeConsumed'){this.showTextFeedback('轻晃',375,1015,new Color(247,192,115));void this.effects?.play('tap',375,1015,event.eventId,this.reducedMotion);this.audio?.play('shake_start');}
      if(event.kind==='DangerChanged'&&event.dangerTicks>0&&event.tick-this.lastDangerCueTick>=60){this.lastDangerCueTick=event.tick;void this.effects?.play('danger',375,740,event.eventId,true);this.audio?.play('danger_tick');}
      if(event.kind==='SpillReviveOffered'){this.audio?.play('result');void this.effects?.play('result',375,805,event.eventId,this.reducedMotion);this.enterSpillOffer();}
      if(event.kind==='RunEnded'){this.audio?.play('result');void this.effects?.play('result',375,805,event.eventId,this.reducedMotion);this.screen='RESULTS';this.clock?.pause();this.resultSaved=false;this.resultFinalized=false;}}
    this.lastEvents.length=0;
  }
  private async waitForSaveIdle():Promise<void>{if(!this.saveInFlight)return;await new Promise<void>(resolve=>this.saveIdleWaiters.push(resolve));}
  private activeSaveRepository():LocalSaveRepository|null{return this.debugMode?this.debugRepo:this.persistent?this.repo:null;}
  /** Ad services follow the active save repository so debug fixtures persist receipts in their own namespace. */
  private adSaveRepository():IBundleSaveRepository{
    const pick=()=>this.activeSaveRepository()??this.repo;
    return {
      readBundle:()=>pick().readBundle(),
      commitBundle:(expectedRevision,expectedRunId,next)=>pick().commitBundle(expectedRevision,expectedRunId,next),
      acquireWriteLease:()=>pick().acquireWriteLease(),
    };
  }
  private beginSaveTask():number|null{if(this.activeSaveTaskId!==0)return null;const id=++this.saveTaskSequence;this.activeSaveTaskId=id;this.saveInFlight=true;return id;}
  private ownsSaveTask(id:number,owner:number):boolean{return this.activeSaveTaskId===id&&owner===this.ownerEpoch&&this.isOwner();}
  private finishSaveTask(id:number):void{
    if(this.activeSaveTaskId!==id)return;this.activeSaveTaskId=0;this.saveInFlight=false;
    const waiters=this.saveIdleWaiters.splice(0);for(const resolve of waiters)resolve();
    if(!this.isOwner())return;
    if(this.engine?.phase==='SETTLING'){if(!this.resultFinalized)void this.commitResult();else this.saveDirty=false;return;}
    if(this.settingsDirty&&this.activeSaveRepository()){this.settingsDirty=false;void this.persistSettings();return;}
    if(this.saveDirty&&this.activeSaveRepository()&&this.engine){void this.commitCheckpoint(true);}
  }
  private async commitCheckpoint(immediate:boolean):Promise<void>{
    const repository=this.activeSaveRepository();if(!this.engine||!repository){this.saveDirty=false;return;}if(this.saveInFlight){this.saveDirty=true;return;}
    const task=this.beginSaveTask();if(task===null){this.saveDirty=true;return;}this.saveDirty=false;const owner=this.ownerEpoch;const runId=this.engine.snapshot().runId;const expectedRevision=this.bundleRevision;const expectedRunId=this.bundle.run?.runId??null;const measureSave=false;const start=measureSave?performance.now():0;
    try{const snap=SaveCodec.sealSnapshot(this.engine.snapshot());const score=snap.score;const rulesVersion=snap.rulesVersion;const bucket=snap.boardType==='assisted'?'assisted':'standard';const best=this.bundle.profile.bestScoresByRules?.[rulesVersion]?.classic?.[bucket]??0;
      const profile={...this.bundle.profile,activeRunId:snap.runId,discoveredLevels:Array.from(new Set([...this.bundle.profile.discoveredLevels,...snap.ingredients.map(i=>i.level)] as Level[])).sort(),bestScoresByRules:{...this.bundle.profile.bestScoresByRules,[rulesVersion]:{...this.bundle.profile.bestScoresByRules?.[rulesVersion],classic:{...this.bundle.profile.bestScoresByRules?.[rulesVersion]?.classic,[bucket]:Math.max(best,score)}}},revision:this.bundle.profile.revision+1};
      const next={...this.bundle,profile,run:snap};const result=await repository.commitBundle(expectedRevision,expectedRunId,next);
      if(!this.ownsSaveTask(task,owner)||this.engine?.snapshot().runId!==runId)return;
      if(result.ok){this.bundle=next;this.bundleRevision=result.data.revision;if(result.data.warning)this.notice=result.data.warning;this.lastSaveTick=snap.tick;}
      else{this.saveDirty=false;this.notice=`保存未完成：${result.error.message}`;if(result.error.code==='CONFLICT_REVISION'){this.engine.pause('TECHNICAL_ERROR');this.clock?.pause();this.pauseOwners.add('TECHNICAL_ERROR');this.cancelPointer();this.screen='PAUSED';this.notice='存档版本冲突；为保护现有存档，本局已冻结。请重新开始或重新加载。';}}
    }catch(error){if(this.ownsSaveTask(task,owner)){this.saveDirty=true;this.notice=`保存失败：${String(error)}`;}}finally{this.finishSaveTask(task);}
  }
  private async commitResult():Promise<void>{
    if(!this.engine||this.saveInFlight||this.resultFinalized)return;const task=this.beginSaveTask();if(task===null)return;const owner=this.ownerEpoch;const runId=this.engine.snapshot().runId;this.screen='RESULTS';this.clock?.pause();this.render();
    const snap=SaveCodec.sealSnapshot(this.engine.snapshot());const reason=snap.terminalReason??'ABANDONED';const rulesVersion=snap.rulesVersion;const bucket=snap.boardType==='assisted'?'assisted':'standard';const pending=this.bundle.profile.rewardedShake.pendingAttempt;const pendingRevive=this.bundle.profile.rewardedRevive.pendingAttempt;const profile={...this.bundle.profile,activeRunId:null,revision:this.bundle.profile.revision+1,firstNaturalRunCompleted:this.bundle.profile.firstNaturalRunCompleted||(snap.boardType==='standard'&&(reason==='CUP_FULL'||reason==='SPILLED')),rewardedShake:pending&&pending.runId===snap.runId?RewardLedger.clearPending(this.bundle.profile.rewardedShake):this.bundle.profile.rewardedShake,rewardedRevive:pendingRevive&&pendingRevive.runId===snap.runId?ReviveLedger.clearPending(this.bundle.profile.rewardedRevive):this.bundle.profile.rewardedRevive,
      bestScoresByRules:{...this.bundle.profile.bestScoresByRules,[rulesVersion]:{...this.bundle.profile.bestScoresByRules?.[rulesVersion],classic:{...this.bundle.profile.bestScoresByRules?.[rulesVersion]?.classic,[bucket]:Math.max(this.bundle.profile.bestScoresByRules?.[rulesVersion]?.classic?.[bucket]??0,snap.score)}}}};
    const next:LocalSaveBundle={profile,run:null,lastResult:{runId:snap.runId,reason,score:snap.score,maxLevel:snap.maxLevel,dropIndex:snap.dropIndex,baseUsed:snap.shake.baseUsed,extraUsed:snap.shake.extraUsed,boardType:snap.boardType,rulesVersion}};
    try{const repository=this.activeSaveRepository();if(repository){const result=await repository.commitBundle(this.bundleRevision,this.bundle.run?.runId??null,next);if(!this.ownsSaveTask(task,owner)||this.engine?.snapshot().runId!==runId)return;if(!result.ok)throw new Error(result.error.message);this.bundleRevision=result.data.revision;if(result.data.warning)this.resultError=result.data.warning;}
      if(!this.ownsSaveTask(task,owner)||this.engine?.snapshot().runId!==runId)return;this.bundle=next;this.resultSaved=!!this.activeSaveRepository();this.resultFinalized=true;this.resultError=this.resultSaved?this.resultError:'仅内存模式，结果未保存。';}
    catch(error){if(this.ownsSaveTask(task,owner)){this.resultError=`结果尚未保存：${String(error)}`;this.notice=this.resultError;this.resultFinalized=true;}}
    finally{if(this.ownsSaveTask(task,owner)){this.screen='RESULTS';this.render();}this.finishSaveTask(task);}
  }
  private async retryResultSave():Promise<void>{if(this.engine?.phase==='SETTLING'&&!this.saveInFlight&&!this.resultSaved){this.resultFinalized=false;await this.commitResult();}}
  private async continueRun():Promise<void>{
    const recoverableFixtureFault=/FIXTURE_(?:CREATE_CHILD|SECOND_COMMIT)_ONCE/.test(this.engine?.lastTickFault??'');
    if(this.engine?.lastTickFault&&!recoverableFixtureFault){this.notice='本局发生物理事务异常并已冻结。请重新开始；原完整存档边界已保留。';this.render();return;}
    if(this.loading||!this.engine||!this.clock)return;const host=HostLifecycleCoordinator.snapshot();
    if(host.backgrounded||this.pauseOwners.has('HOST_HIDDEN')){this.notice='当前仍在后台，不能继续。';this.render();return;}
    if(this.pauseOwners.has('AD')||this.pauseOwners.has('MODAL')||(this.pauseOwners.has('TECHNICAL_ERROR')&&!recoverableFixtureFault)||this.pauseOwners.has('RESTORING')){this.notice='请先关闭弹窗或处理错误后再继续。';this.render();return;}
    if(recoverableFixtureFault)this.pauseOwners.delete('TECHNICAL_ERROR');
    if(host.resumeRequired){const ack=HostLifecycleCoordinator.confirmUserResume(host.hideEpoch,true,true,true);if(!ack.ok){this.notice=`暂时不能继续：${ack.reason}`;this.render();return;}}
    const resumed=this.engine.resume();if(!resumed.ok){this.notice=resumed.error.message;this.render();return;}
    this.pauseOwners.clear();this.clock.resume();this.audio?.resumeAfterUserGesture();this.screen='PLAYING';this.notice='已继续；后台时间不会补算。';this.saveDirty=true;this.render();
  }
  private togglePause():void{if(this.screen==='PLAYING'){this.engine?.pause('MANUAL');this.clock?.pause();this.pauseOwners.add('MANUAL');this.cancelPointer();this.screen='PAUSED';this.notice='已暂停。';this.saveDirty=true;void this.commitCheckpoint(true);this.render();}else if(this.screen==='PAUSED')void this.continueRun();}
  private resumeByUser():void{if(this.screen==='PAUSED')void this.continueRun();}
  private isModalScreen():boolean{return this.screen==='SETTINGS'||this.screen==='CONFIRM_RESTART'||this.screen==='CONFIRM_MENU'||this.screen==='REWARD'||this.screen==='REVIVE';}
  private openModal(screen:'SETTINGS'|'CONFIRM_RESTART'|'CONFIRM_MENU'):void{this.cancelPointer();if(screen==='SETTINGS')this.settingsReturnScreen=this.engine?'PAUSED':'MENU';this.pauseOwners.add('MODAL');if(this.engine){this.engine.pause('MODAL');this.clock?.pause();}this.screen=screen;this.render();if(screen==='SETTINGS'){const owner=this.ownerEpoch;void this.loadArtBatch(this.art.catalog.ids.filter(id=>id.startsWith('ui_'))).then(()=>{if(this.isOwner()&&owner===this.ownerEpoch&&this.screen==='SETTINGS')this.render();},()=>{if(this.isOwner()&&owner===this.ownerEpoch&&this.screen==='SETTINGS'){this.notice='部分设置图片加载失败，文字控件仍可操作。';this.render();}});}}
  private closeModal():void{this.pauseOwners.delete('MODAL');this.cancelPointer();this.screen=this.screen==='SETTINGS'?this.settingsReturnScreen:(this.engine?'PAUSED':'MENU');this.render();}
  private async restartConfirmed():Promise<void>{
    const owner=this.ownerEpoch;while(this.saveInFlight)await this.waitForSaveIdle();if(!this.isOwner()||owner!==this.ownerEpoch)return;
    this.engine?.pause('MANUAL');this.clock?.pause();this.engine?.dispose();this.engine=null;this.adapter=null;this.clock=null;
    this.world?.destroy();this.world=null;this.ownerEpoch++;this.screen='MENU';this.render();
    // Keep the durable envelope/revision as the compare-and-swap base. startNew atomically replaces it.
    await this.startNew();
  }
  private async returnToMenuConfirmed():Promise<void>{const owner=this.ownerEpoch;while(this.saveInFlight)await this.waitForSaveIdle();if(!this.isOwner()||owner!==this.ownerEpoch)return;if(this.engine&&!this.resultSaved){const ended=this.engine.abandon();if(ended){this.lastEvents.push(ended);this.processEvents();await this.commitResult();}while(this.saveInFlight)await this.waitForSaveIdle();if(!this.isOwner()||owner!==this.ownerEpoch||!this.resultSaved&&!!this.activeSaveRepository()){this.notice=this.resultError||'结果仍未保存，保留当前局面供重试。';this.render();return;}}this.engine?.dispose();this.engine=null;this.adapter=null;this.clock=null;this.world?.destroy();this.screen='MENU';this.render();}
  private render():void{
    if(!this.uiRoot?.isValid)return;this.buttons=[];this.buttonSkins.clear();this.previewGraphic=null;
    for(const child of [...this.uiRoot.children])child.destroy();this.labels.clear();
    if(this.artLoading){this.themeBackground(true);if(this.art.getLoadedVariant('ui_title_logo'))this.themeSprite('ui_title_logo',375,900,640,224);else this.text('loading-brand','奶茶挤挤',375,900,72,new Color(103,58,32));this.text('loading','正在准备杯子与小料…',375,480,28);this.button('loading-start','开始新局',135,330,480,104,()=>{this.pendingStartRequested=true;this.notice='已收到开始请求，准备完成后立即进入游戏。';this.render();});if(this.notice){this.themePanel('ui_panel_toast',375,200,670,96);this.text('loading-notice',this.notice,375,200,22);}this.drawButtons();return;}
    if(this.screen==='MENU'||this.screen==='SETTINGS'||this.screen==='ERROR'||!this.world?.isValid)this.themeBackground(this.screen==='MENU');
    if(this.screen==='MENU')this.renderMenu();else if(this.screen==='PLAYING')this.renderGame();else if(this.screen==='PAUSED')this.renderPause();else if(this.screen==='SETTINGS')this.renderSettings();else if(this.screen==='CONFIRM_RESTART'||this.screen==='CONFIRM_MENU')this.renderConfirm();else if(this.screen==='RESULTS')this.renderResults();else if(this.screen==='REWARD')this.renderReward();else if(this.screen==='REVIVE')this.renderRevive();else this.renderError();
    if(this.tutorialStep>0)this.renderTutorial();this.drawButtons();if(this.screen==='MENU')this.effects?.ensureCat(620,820);else this.effects?.hideCat();
  }
  private themeSprite(id:string,x:number,y:number,w:number,h:number,parent:Node=this.uiRoot!):Node|null{
    if(!this.art.getLoadedVariant(id))return null;
    const n=this.art.createSprite(parent,id,w,h,true);n.setPosition(x-375,y-667,0);return n;
  }
  private themeBackground(brand=false):void{
    const id=brand?'bg_brand':'bg_shop_base';const image=this.themeSprite(id,375,667,750,1334);if(image){image.name=`ScreenBackground:${id}`;this.coverBackground(image,id);return;}
    const size=presentationSize(),n=new Node('CreamBackground');this.uiRoot!.addChild(n);n.addComponent(UITransform).setContentSize(size.width,size.height);const g=n.addComponent(Graphics);g.fillColor=new Color(255,244,225);g.rect(-size.width/2,-size.height/2,size.width,size.height);g.fill();
  }
  private coverBackground(node:Node,id:string):void{
    const variant=this.art.getLoadedVariant(id);if(!variant)return;const size=presentationSize(),scale=Math.max(size.width/variant.size[0],size.height/variant.size[1]);
    const ui=node.getComponent(UITransform)!;const w=variant.size[0]*scale,h=variant.size[1]*scale;
    if(Math.abs(ui.width-w)>0.001||Math.abs(ui.height-h)>0.001)ui.setContentSize(w,h);
  }
  private syncViewportBackgrounds():void{
    if(this.fixedBackground?.isValid)this.coverBackground(this.fixedBackground,'bg_shop_base');
    const size=presentationSize();for(const node of this.uiRoot?.children??[]){
      if(node.name.startsWith('ScreenBackground:'))this.coverBackground(node,node.name.substring('ScreenBackground:'.length));
      else if(node.name==='ModalDim'||node.name==='CreamBackground'){const ui=node.getComponent(UITransform),g=node.getComponent(Graphics);if(ui&&g&&(ui.width!==size.width||ui.height!==size.height)){ui.setContentSize(size.width,size.height);g.clear();g.rect(-size.width/2,-size.height/2,size.width,size.height);g.fill();}}
    }
  }
  private themePanel(id:string,x:number,y:number,w:number,h:number,dim=false):void{
    if(dim){const size=presentationSize(),n=new Node('ModalDim');this.uiRoot!.addChild(n);n.addComponent(UITransform).setContentSize(size.width,size.height);const g=n.addComponent(Graphics);g.fillColor=new Color(62,34,21,130);g.rect(-size.width/2,-size.height/2,size.width,size.height);g.fill();}
    this.themeSprite(id,x,y,w,h);
  }
  private setButtonState(id:string,state:'normal'|'pressed'):void{
    const skin=this.buttonSkins.get(id);if(skin?.node.isValid)this.art.setSpriteAsset(skin.node,`ui_btn_${skin.family}_${state}`);
  }
  private renderMenu():void{
    this.themeSprite('ui_title_logo',375,1170,650,228);this.text('subtitle','经典杯 · 挤出一杯好心情',375,1038,28);
    this.themePanel('ui_panel_hud',375,962,460,74);this.text('record',`个人纪录  ${this.bundle.profile.bestScoresByRules?.[AppRuntime.rules?.design_rules_version??'']?.classic?.standard??0}`,375,962,30);
    const legacyRun=!!this.bundle.run&&this.bundle.run.rulesVersion!==AppRuntime.rules?.design_rules_version;
    if(this.bundle.run)this.button('continue',legacyRun?'旧版局已保留':'继续上局',135,354,480,100,()=>{if(legacyRun){this.notice='旧版局已保留，不能放入新杯；开始新杯前可随时返回。';this.render();}else void this.restoreRun();});
    this.button('new','开始新局',135,this.bundle.run?226:354,480,100,()=>legacyRun?this.openModal('CONFIRM_RESTART'):void this.startNew());
    this.button('settings','游戏设置',245,102,260,90,()=>this.openModal('SETTINGS'));
    if(legacyRun)this.text('legacy-save','旧局已保留，确认新杯后才替换旧局。',375,530,23);
    if(!this.persistent)this.text('storage','当前仅内存模式，关闭后可能无法续局',375,65,22);
    if(this.notice){this.themePanel('ui_panel_toast',375,485,670,96);this.text('notice',this.notice,375,485,23);}
  }
  private renderGame():void{
    const snap=this.engine?.snapshot();if(!snap)return;
    this.themePanel('ui_panel_hud',375,1265,700,88);this.text('score',`分数 ${snap.score}  ·  纪录 ${this.bundle.profile.bestScoresByRules?.[snap.rulesVersion]?.classic?.standard??0}`,375,1265,32);
    this.themePanel('ui_panel_hud',338,1175,600,76);this.text('next',`当前 ${this.levelName(snap.currentLevel)}  ·  最高 ${this.levelName(snap.maxLevel)}`,330,1175,25);
    this.themePanel('ui_panel_next',665,1135,110,110);this.themeSprite(ArtCatalog.ingredientId(AppRuntime.rules!.ingredients[snap.nextLevel-1].id),665,1135,76,76);
    this.text('danger',snap.dangerTicks?`快满了 · ${Math.max(1,3-Math.floor(snap.dangerTicks/60))}`:'同级相遇，合成更大颗',375,1100,25,snap.dangerTicks?new Color(185,54,43):new Color(103,63,38));
    const due=Math.max(0,snap.autoDrop.nextDueTick-snap.tick);this.themePanel('ui_panel_modal',375,250,620,142);this.text('preview',`自动落料 · ${Math.ceil(due/AppRuntime.rules!.physics.fixed_hz)}秒后下一颗 · 按住杯子左右移动`,375,250,22);const planned=snap.autoDrop.pendingSpawn,mark=new Node('AutoDropSpawnPreview');this.uiRoot!.addChild(mark);mark.setPosition(planned.xDu-375,Math.min(AppRuntime.rules!.cup.spawn_y_du,AppRuntime.rules!.viewport.height_du-130)-667,0);mark.addComponent(UITransform).setContentSize(12,12);const dot=mark.addComponent(Graphics);dot.fillColor=new Color(255,199,93,230);dot.circle(0,0,6);dot.fill();
    this.drawGameIndicators(snap);
    const shakeLeft=Math.max(0,2-snap.shake.baseUsed),extraLeft=Math.max(0,snap.shake.extraGranted-snap.shake.extraUsed),activeLeft=snap.shake.activeStartTick===null?0:Math.max(0,snap.shake.activeStartTick+48-snap.tick),cooldownLeft=Math.max(0,snap.shake.cooldownUntilTick-snap.tick);
    const rewardedView=this.rewarded?.getView();
    const shakeLabel=activeLeft>0?'晃杯中…':cooldownLeft>0?'晃杯冷却':shakeLeft>0?`晃杯 ${shakeLeft}`:extraLeft>0?`广告晃杯 ${extraLeft}`:rewardedView?.pendingAttempt?'奖励待确认':'看广告 +1 次';
    this.button('shake',shakeLabel,42,48,200,96,()=>{if(shakeLeft>0||extraLeft>0)this.enqueue('SHAKE');else this.openRewardedOffer();});this.button('pause','暂停',508,48,200,96,()=>this.togglePause());
    if(this.notice&&/失败|错误|异常|冲突|无法/.test(this.notice)){this.themePanel('ui_panel_toast',375,340,650,52);this.text('notice',this.notice,375,340,20);}
  }
  private renderPause():void{
    this.themePanel('ui_panel_modal',375,685,620,850,true);this.text('paused','休息一下',375,1010,44);
    this.button('resume','继续游戏',185,800,380,96,()=>void this.continueRun());this.button('settings','设置',185,670,380,96,()=>this.openModal('SETTINGS'));
    this.button('restart','重新开始',185,540,380,96,()=>this.openModal('CONFIRM_RESTART'));this.button('menu','返回菜单',185,410,380,96,()=>this.openModal('CONFIRM_MENU'));
    if(this.notice)this.text('notice',this.notice,375,330,22);
  }
  private renderGameBase():void{const s=this.engine?.snapshot();if(s)this.text('score',`分数 ${s.score}  ·  当前 ${this.levelName(s.currentLevel)} / 下份 ${this.levelName(s.nextLevel)}`,375,1260,30);}
  private drawGameIndicators(snap:import('../contracts/types').RunSnapshot):void{
    const rules=AppRuntime.rules!,cx=rules.viewport.width_du/2,cy=rules.viewport.height_du/2;
    const line=new Node('P1BDangerLine');this.uiRoot!.addChild(line);const lineGraphics=line.addComponent(Graphics);
    lineGraphics.lineWidth=4;lineGraphics.strokeColor=new Color(220,86,54,210);
    const cupX=rules.cup.center_x_du+snap.cupMotion.offsetXDu;const left=cupX-rules.cup.top_width_du/2-cx,right=cupX+rules.cup.top_width_du/2-cx,y=rules.cup.danger_line_y_du-cy;
    for(let x=left;x<right;x+=28){lineGraphics.moveTo(x,y);lineGraphics.lineTo(Math.min(right,x+17),y);}lineGraphics.stroke();
    const radius=rules.ingredients.find(i=>i.level===snap.currentLevel)?.radius_du??18;
    const marker=this.themeSprite(ArtCatalog.ingredientId(rules.ingredients[snap.currentLevel-1].id),this.previewX,rules.cup.spawn_y_du,2*radius/.9,2*radius/.9);
    this.previewGraphic=marker?.getComponent(Sprite)??null;
  }
  private updatePreviewPosition():void{const rules=AppRuntime.rules;if(!rules||!this.previewGraphic?.node?.isValid)return;this.previewGraphic.node.setPosition(this.previewX-rules.viewport.width_du/2,rules.cup.spawn_y_du-rules.viewport.height_du/2,0);}
  private renderSettings():void{
    this.themePanel('ui_panel_modal',375,730,650,1110,true);
    this.text('settings-title','设置',375,1170,48);
    const settings=this.bundle.profile.settings;
    this.drawVolume('music',this.bundle.profile.settings.musicGain,998);
    this.drawVolume('sfx',this.bundle.profile.settings.sfxGain,778);
    this.text('music-gain',`音乐音量  ${Math.round(settings.musicGain*100)}%`,375,1050,30);
    this.button('music-down','−',135,950,100,96,()=>this.changeGain('musicGain',-.1));this.button('music-up','+',515,950,100,96,()=>this.changeGain('musicGain',.1));
    this.text('sfx-gain',`音效音量  ${Math.round(settings.sfxGain*100)}%`,375,830,30);
    this.button('sfx-down','−',135,730,100,96,()=>this.changeGain('sfxGain',-.1));this.button('sfx-up','+',515,730,100,96,()=>this.changeGain('sfxGain',.1));
    this.button('motion',`弱动态：${this.reducedMotion?'开启':'关闭'}`,185,460,380,96,()=>{this.reducedMotion=!this.reducedMotion;this.persistSettings();this.render();});
    this.button('tutorial-replay','重看三步引导',185,340,380,96,()=>this.beginTutorial());
    this.button('back','返回',185,220,380,96,()=>this.closeModal());
    if(this.audioFailure)this.button('retry-audio',this.audioLoading?'正在重试…':'重试声音加载',185,130,380,96,()=>void this.loadAudioClips(true));
    const soundStatus=this.audioFailures.size?`声音资源缺失 ${this.audioFailures.size} 项，可点击重试`:this.audio?'声音已加载':'首次操作后自动加载声音';
    const saveStatus=this.persistent?'设置自动保存到本机':'仅内存模式：设置不保证跨关闭保留';
    this.themePanel('ui_panel_toast',375,105,670,104);this.text('settings-status',`${soundStatus}\n${saveStatus}`,375,105,21);
  }
  private drawVolume(kind:'music'|'sfx',gain:number,y:number):void{
    this.themeSprite('ui_slider_track_empty',375,y,264,25);
    const fill=this.themeSprite('ui_slider_fill_full',375,y,264,25);const sprite=fill?.getComponent(Sprite);
    if(sprite){sprite.type=Sprite.Type.FILLED;sprite.fillType=Sprite.FillType.HORIZONTAL;sprite.fillStart=0;sprite.fillRange=gain;}
    this.themeSprite('ui_slider_knob',251+248*gain,y,42,42);this.themeSprite(kind==='music'?'ui_icon_music_on':'ui_icon_sfx_on',100,y+52,40,40);
  }
  private changeGain(field:'musicGain'|'sfxGain',delta:number):void{const settings=this.bundle.profile.settings,pct=Math.max(0,Math.min(100,Math.round(settings[field]*100+delta*100)));this.bundle={...this.bundle,profile:{...this.bundle.profile,settings:{...settings,[field]:pct/100}}};this.audio?.setVolumes(this.bundle.profile.settings.musicGain,this.bundle.profile.settings.sfxGain);this.persistSettings();this.render();}
  private unlockAudioFromGesture():void{this.audioUnlockRequested=true;if(this.audio){this.audio.requestMusicFromGesture();return;}if(!this.audioLoading&&!this.audioFailures.size)void this.loadAudioClips();}
  private async loadAudioClips(retry=false):Promise<void>{
    if(this.audioLoading)return;this.audioLoading=true;if(retry)this.audioFailures.clear();
    const cues:Array<GameAudioCue|'bgm_classic'>=['bgm_classic','ui_tap','drop','collision_soft','merge_small','merge_large','shake_start','danger_tick','result'];
    const needed=cues.filter(cue=>!this.audioClips[cue]&&(retry||!this.audioFailures.has(cue)));
    try{
      const loaded=await Promise.all(needed.map(async cue=>{try{return{cue,clip:await this.loadAudioClip(cue),error:null};}catch(error){return{cue,clip:null,error:error instanceof Error?error:new Error(String(error))};}}));
      if(!this.isOwner()){for(const item of loaded)if(item.clip)resources.release(`audio/p1c/${item.cue}`,AudioClip);return;}
      if(!this.audio&&loaded.some(item=>item.clip))this.audio=new GameAudio(this.node,{},this.bundle.profile.settings.musicGain,this.bundle.profile.settings.sfxGain);
      for(const item of loaded){if(item.clip){this.audioClips[item.cue]=item.clip;this.audio?.addClip(item.cue,item.clip);}else{this.audioFailures.add(item.cue);this.releaseAudioClip(item.cue);}}
      this.audioFailure=this.audioFailures.size?Array.from(this.audioFailures).join('、'):'';
      if(this.audioUnlockRequested)this.audio?.requestMusicFromGesture();
    }catch(error){this.audioFailure=String(error);}
    finally{this.audioLoading=false;if(this.screen!=='PLAYING')this.render();}
  }
  private async loadAudioClip(cue:GameAudioCue|'bgm_classic'):Promise<AudioClip>{
    const path=`audio/p1c/${cue}`;
    const bundle=resources.getInfoWithPath(path,AudioClip)?resources:await this.loadClassicBundle();
    if(!bundle)throw new Error(`音频包缺失: ${cue}`);
    return await new Promise((resolve,reject)=>bundle.load(path,AudioClip,null,(error,clip)=>error||!clip?reject(error??new Error(`音频缺失: ${cue}`)):resolve(clip)));
  }
  private loadRequiredArt():Promise<void>{
    const rules=AppRuntime.rules;if(!rules)throw new Error('配置未初始化');
    return (async()=>{
      if(this.art.catalog.ids.includes('ui_title_logo')){await this.art.load('ui_title_logo',750);if(this.artLoading&&this.isOwner())this.render();}
      const ids=this.art.catalog.ids.filter(id=>id==='bg_brand'||id==='ui_title_logo'||id==='ui_panel_hud'||id==='ui_panel_toast'||id.startsWith('ui_btn_')||['ui_icon_play','ui_icon_continue','ui_icon_settings','ui_icon_warning','ui_icon_close','ui_icon_back'].includes(id));
      await this.loadArtBatch(ids);
    })();
  }
  private async loadArtBatch(ids:readonly string[]):Promise<void>{for(let start=0;start<ids.length;start+=4)await Promise.all(ids.slice(start,start+4).map(id=>this.art.load(id,id.startsWith('spr_ing_')?700:1000)));}
  private async loadGameArt():Promise<void>{await this.loadArtBatch(this.art.catalog.ids.filter(id=>!id.startsWith('bg_shop_extend_')));}
  private async retryArtAndStart():Promise<void>{
    if(this.artRetryTask)return this.artRetryTask;if(this.loading)return;const owner=this.ownerEpoch,generation=++this.artLoadGeneration;
    const task=(async()=>{this.loading=true;this.artLoading=true;this.notice='正在重试资源加载…';this.render();
      try{
        if(!this.art.catalog){await this.art.initialize();if(!this.isOwner()||owner!==this.ownerEpoch||generation!==this.artLoadGeneration)return;this.artReady=true;}
        await this.loadRequiredArt();if(!this.isOwner()||owner!==this.ownerEpoch||generation!==this.artLoadGeneration)return;
        this.artLoading=false;this.screen='MENU';this.notice=this.bundle.run?'资源已恢复。请选择继续上局或开始新局。':'';this.render();void this.loadAudioClips();
      }catch(error){if(this.isOwner()&&owner===this.ownerEpoch&&generation===this.artLoadGeneration){this.artLoading=false;this.screen='ERROR';this.notice=`资源重试失败：${String(error)}`;this.render();}}
      finally{if(this.isOwner()&&owner===this.ownerEpoch&&generation===this.artLoadGeneration){this.loading=false;this.artRetryTask=null;}}
    })();this.artRetryTask=task;return task;
  }
  private loadClassicBundle():Promise<AssetManager.Bundle|null>{
    if(this.classicBundle)return Promise.resolve(this.classicBundle);if(this.classicBundleLoad)return this.classicBundleLoad;
    const task=new Promise<AssetManager.Bundle|null>(resolve=>assetManager.loadBundle('classic',(error,bundle)=>resolve(error||!bundle?null:bundle))).then(bundle=>{this.classicBundle=bundle;return bundle;});
    this.classicBundleLoad=task;const clear=():void=>{if(this.classicBundleLoad===task)this.classicBundleLoad=null;};void task.then(clear,clear);return task;
  }
  private releaseAudioClip(cue:GameAudioCue|'bgm_classic'):void{if(this.classicBundle)this.classicBundle.release(`audio/p1c/${cue}`,AudioClip);else resources.release(`audio/p1c/${cue}`,AudioClip);}
  private beginTutorial():void{this.tutorialReturnScreen=this.screen;this.tutorialStep=1;this.cancelPointer();this.pauseOwners.add('MODAL');if(this.engine){this.engine.pause('MODAL');this.clock?.pause();}this.render();}
  private renderTutorial():void{
    this.buttons=[];
    const scrim=new Node('TutorialScrim');this.uiRoot!.addChild(scrim);const tr=scrim.addComponent(UITransform);tr.setContentSize(750,1334);const g=scrim.addComponent(Graphics);g.fillColor=new Color(35,28,22,185);g.rect(-375,-667,750,1334);g.fill();
    this.themePanel('ui_panel_modal',375,850,680,700);
    const copy=[['第 1 步 · 自动落料','小料会定时落下，按住杯子左右移动来接料。'],['第 2 步 · 同级会合成','相同等级的小料相遇会合成，留意杯内危险线。'],['第 3 步 · 晃杯与暂停','每局可晃杯两次；暂停后明确继续，稍等一秒再落料。']][this.tutorialStep-1];
    this.text('tutorial-title',copy[0],375,1080,33);this.text('tutorial-copy',copy[1],375,950,27);this.labels.get('tutorial-copy')?.node.getComponent(UITransform)?.setContentSize(560,125);this.themeSprite(this.tutorialStep===1?'ui_tutorial_hand_move':this.tutorialStep===2?'fx_merge_ring':'ui_icon_shake',375,805,130,130);
    this.button('tutorial-next',this.tutorialStep===3?'开始这杯':'下一步',80,650,270,96,()=>{if(this.tutorialStep<3){this.tutorialStep++;this.render();}else void this.finishTutorial(true);});
    this.button('tutorial-skip','跳过并开始',400,650,270,96,()=>void this.finishTutorial(true));
  }
  private async finishTutorial(markComplete:boolean):Promise<void>{
    this.tutorialStep=0;this.pauseOwners.delete('MODAL');
    if(markComplete)this.bundle={...this.bundle,profile:{...this.bundle.profile,tutorialRulesVersion:AppRuntime.rules?.design_rules_version,settings:{...this.bundle.profile.settings,tutorialCompleted:true}}};
    const target=this.tutorialReturnScreen;this.screen=target;
    if(target==='PLAYING'&&this.engine&&this.clock){const host=HostLifecycleCoordinator.snapshot();if(!host.backgrounded&&!host.resumeRequired){const resumed=this.engine.resume();if(resumed.ok){this.pauseOwners.clear();this.clock.resume();}}else{this.screen='PAUSED';this.pauseOwners.add(host.backgrounded?'HOST_HIDDEN':'RESUME_REQUIRED');}}
    this.render();if(markComplete)void this.persistSettings();
  }
  private showMergeFeedback(position:PointDu,score:number):void{
    const x=position.x-375,y=position.y-667;this.showTextFeedback(`+${score}`,x,y,new Color(112,57,25));
    const ring=this.themeSprite('fx_merge_ring',position.x,position.y,110,110);if(!ring)return;ring.name=`MergeRing-${++this.feedbackSequence}`;const opacity=ring.addComponent(UIOpacity);
    const end=this.reducedMotion?0.14:0.22;tween(ring).to(end,{scale:new Vec3(this.reducedMotion?1.25:1.7,this.reducedMotion?1.25:1.7,1)}).start();tween(opacity).to(end,{opacity:0}).call(()=>ring.destroy()).start();
  }
  private showTextFeedback(value:string,x:number,y:number,color:Color):void{
    if(!this.uiRoot?.isValid)return;const n=new Node(`Feedback-${++this.feedbackSequence}`);this.uiRoot.addChild(n);n.setPosition(x,y,0);n.addComponent(UITransform).setContentSize(240,64);const label=n.addComponent(Label);label.string=value;label.fontSize=32;label.lineHeight=38;label.color=color;label.isBold=true;const opacity=n.addComponent(UIOpacity);
    const duration=this.reducedMotion?0.12:0.48;tween(n).to(duration,{position:new Vec3(x,y+(this.reducedMotion?8:24),0)}).start();tween(opacity).delay(duration*.45).to(duration*.55,{opacity:0}).call(()=>n.destroy()).start();
  }
  private readContactFeedback():void{
    if(!this.adapter||!this.engine)return;const tick=this.engine.tick,live=new Set(this.engine.snapshot().ingredients.map(item=>item.entityId));
    for(const id of this.contactObjectTicks.keys())if(!live.has(id))this.contactObjectTicks.delete(id);
    const next=new Set<string>(),minimumSpeed=.5*(AppRuntime.rules?.viewport.du_per_spec_physics_unit??100);
    for(const pair of this.adapter.getContacts()){
      next.add(pair.contactId);if(this.contactPairs.has(pair.contactId)||Math.abs(pair.normalSpeed)<minimumSpeed||tick-this.lastContactFeedbackTick<10)continue;
      const objects=[pair.firstId,pair.secondId].filter((id):id is number=>id!==null&&live.has(id));
      if(!objects.length||objects.some(id=>tick-(this.contactObjectTicks.get(id)??-60)<8))continue;
      this.lastContactFeedbackTick=tick;const fxItem=this.engine.snapshot().ingredients.find(i=>objects.includes(i.entityId));if(fxItem)void this.effects?.play(pair.secondId===null?'drop':'collision',fxItem.positionDu.x,fxItem.positionDu.y,`${tick}:${pair.contactId}`,this.reducedMotion);this.audio?.play('collision_soft');for(const id of objects)this.contactObjectTicks.set(id,tick);
      for(const id of objects){const visual=this.world?.getChildByName(`P1BIngredientVisual-${id}`);if(!visual?.isValid)continue;Tween.stopAllByTarget(visual);const squeeze=this.reducedMotion?0.96:0.92;tween(visual).to(.06,{scale:new Vec3(1.04,squeeze,1)}).to(.08,{scale:new Vec3(1,1,1)}).start();}
    }
    this.contactPairs=next;
  }
  private renderConfirm():void{this.themePanel('ui_panel_modal',375,885,660,470,true);const legacyRun=this.screen==='CONFIRM_RESTART'&&!this.engine&&!!this.bundle.run&&this.bundle.run.rulesVersion!==AppRuntime.rules?.design_rules_version;this.text('confirm',legacyRun?'玩法规则已更新。取消会完整保留旧局；确认后新局使用窄杯自动落料，旧纪录与设置保留。':'确认重新开始？未保存进度将按最近完整保存恢复。',375,930,26);
    this.button('yes','确认',60,790,270,96,()=>this.screen==='CONFIRM_RESTART'?void this.restartConfirmed():void this.returnToMenuConfirmed());
    this.button('no','取消',420,790,270,96,()=>this.closeModal());}
  private renderResults():void{this.themePanel('ui_panel_results',375,720,650,1000,true);const r=this.bundle.lastResult;const s=this.engine?.snapshot();if((r?.score??s?.score??0)>this.runBestScoreAtStart)this.themeSprite('ui_badge_record',375,1140,170,85);this.text('result-title',r?.reason==='SPILLED'?'小料洒出来了':'这杯加满了',375,1050,44);
    this.text('result-score',`得分 ${r?.score??s?.score??0}  ·  最高等级 ${r?.maxLevel??s?.maxLevel??1}`,375,940,30);
    this.text('result-drops',`投放 ${r?.dropIndex??s?.dropIndex??0} 次  ·  晃杯 ${r?.baseUsed??s?.shake.baseUsed??0}/2`,375,875,24);
    this.text('save-status',this.resultSaved?'已保存':this.resultError||'正在保存结算…',375,790,22,this.resultSaved?new Color(49,114,72):new Color(160,74,41));
    this.button('again','再来一杯',160,650,430,96,()=>void this.restartConfirmed());this.button('menu','回菜单',160,510,430,96,()=>{this.screen='MENU';this.engine?.dispose();this.engine=null;this.clock=null;this.world?.destroy();this.render();});
    if(!this.resultSaved&&this.activeSaveRepository())this.button('retry-save','重试保存',160,370,430,96,()=>void this.retryResultSave());}
  private renderError():void{const physics=this.notice.includes('PHYSICS_');this.themePanel('ui_panel_modal',375,780,670,850,true);this.themeSprite('ui_icon_warning',375,1130,80,80);this.text('error',physics?'本局暂时遇到问题':'暂时无法开始',375,990,40);this.text('error-detail',physics?this.notice:/图片|加载/.test(this.notice)?'图片暂时没加载完成，请点击重试。\n已有存档会保留。':this.notice||'请重试或重新打开游戏。',375,860,26);this.labels.get('error-detail')?.node.getComponent(UITransform)?.setContentSize(560,150);
    if(physics){if(this.engine&&this.recoveryUsedRunId!==this.engine.snapshot().runId&&(this.engine.recoveryCheckpoint||this.activeSaveRepository()))this.button('retry-checkpoint','恢复本局',160,650,430,96,()=>void this.retryTechnicalRecovery());this.button('error-menu','返回菜单',160,510,430,96,()=>{this.screen='MENU';this.engine?.dispose();this.engine=null;this.clock=null;this.world?.destroy();this.render();});this.button('physics-details','查看错误详情',160,390,430,72,()=>{this.showPhysicsDiagnostics=!this.showPhysicsDiagnostics;this.render();});if(this.showPhysicsDiagnostics){const fault=(this.engine?.lastTickFault??'无可用错误摘要').slice(0,240);this.text('physics-diagnostic',`构建 ${AppRuntime.buildId}\n${fault}`,375,290,18);this.labels.get('physics-diagnostic')?.node.getComponent(UITransform)?.setContentSize(560,140);}return;}
    this.button('retry-load','重试资源加载',160,680,430,96,()=>void this.retryArtAndStart());if(this.artReady)this.button('memory-new','仅内存新局',160,540,430,96,()=>void this.startNew(true));}
  private async retryTechnicalRecovery():Promise<void>{
    const failedRunId=this.engine?.snapshot().runId;if(!failedRunId||this.recoveryUsedRunId===failedRunId)return;
    if(this.loading)return;this.loading=true;const owner=this.ownerEpoch;
    try{
      while(this.saveInFlight)await this.waitForSaveIdle();if(!this.isOwner()||owner!==this.ownerEpoch)return;
      let snapshot=this.engine?.recoveryCheckpoint??null;
      if(!snapshot){const repository=this.activeSaveRepository();if(repository){const loaded=await repository.readBundle();if(!this.isOwner()||owner!==this.ownerEpoch)return;const saved=loaded.ok?loaded.data.envelope:null;if(saved?.payload.run?.runId===failedRunId){snapshot=saved.payload.run;this.bundle=saved.payload;this.bundleRevision=saved.revision;}}}
      if(!snapshot||snapshot.runId!==failedRunId){this.notice='本次页面内没有可恢复的完整局面，请返回菜单重新开始。错误编号 PHYSICS_CHECKPOINT_UNAVAILABLE';this.render();return;}
      snapshot=SaveCodec.sealSnapshot(snapshot);const checked=SaveValidator.snapshot(snapshot);if(!checked.valid)throw new Error(`CHECKPOINT_INVALID:${checked.code}`);
      this.engine?.dispose();this.engine=null;this.adapter=null;const adapter=this.createWorld();let engine:RunEngine;
      try{engine=new RunEngine(adapter,AppRuntime.rules!,snapshot.runId,snapshot.rng.state,snapshot,this.reviveOptions());}catch(error){adapter.dispose();throw error;}
      this.adapter=adapter;this.engine=engine;this.baseTick=snapshot.tick;this.clock=new FixedClock(AppRuntime.rules!.physics.fixed_hz,AppRuntime.rules!.physics.max_catchup_steps,()=>this.advanceRunTick());this.clock.pause();
      this.bundle={...this.bundle,profile:{...this.bundle.profile,activeRunId:failedRunId},run:engine.snapshot()};this.recoveryUsedRunId=failedRunId;this.pauseOwners.clear();this.bindRewardedShake();this.bindSpillRevive();this.screen=engine.spillPending?'REVIVE':'PAUSED';this.notice=engine.spillPending?'已恢复洒出局面：可观看广告复活一次，或结束本局。':'已恢复本页最近完整局面；点击“继续游戏”后再操作。';this.render();
    }catch(error){this.clock?.pause();this.screen='ERROR';this.notice=`恢复未完成，请返回菜单；已有存档未覆盖。错误编号 PHYSICS_RECOVERY_FAILED ${String(error).slice(0,120)}`;this.render();}
    finally{if(this.isOwner()&&owner===this.ownerEpoch)this.loading=false;}
  }
  private drawButtons():void{for(const b of this.buttons){
    const n=new Node(`P1BButton-${b.id}`);this.uiRoot!.addChild(n);n.setPosition(b.rect.x-375+b.rect.w/2,b.rect.y-667+b.rect.h/2,0);n.addComponent(UITransform).setContentSize(b.rect.w,b.rect.h);
    const primary=['new','continue','resume','yes','again','tutorial-next','drop'].includes(b.id),circle=b.rect.w<=110,family=circle?'icon':primary?'primary':'secondary',skin=`ui_btn_${family}_${b.enabled===false?'disabled':'normal'}`;
    if(this.art.getLoadedVariant(skin)){const image=this.art.createSprite(n,skin,b.rect.w,b.rect.h,true);image.name='ButtonSkin';this.buttonSkins.set(b.id,{node:image,family});}
    else{const g=n.addComponent(Graphics);g.fillColor=new Color(255,207,75);g.roundRect(-b.rect.w/2,-b.rect.h/2,b.rect.w,b.rect.h,24);g.fill();}
    const icons:Record<string,string>={new:'play',continue:'continue',resume:'continue',settings:'settings',restart:'restart',again:'restart',menu:'home',pause:'pause',shake:'shake',back:'back',yes:'check',no:'close',motion:'reduced_motion','tutorial-replay':'info'};
    const icon=icons[b.id];if(icon&&!circle&&this.art.getLoadedVariant('ui_icon_'+icon)){const image=this.art.createSprite(n,'ui_icon_'+icon,38,38,true);image.setPosition(-b.rect.w/2+43,0,0);}
    const lnode=new Node('Label');n.addChild(lnode);lnode.addComponent(UITransform).setContentSize(b.rect.w-(icon?78:20),b.rect.h-12);lnode.setPosition(icon?19:0,0,0);
    const l=lnode.addComponent(Label);l.string=b.label;l.fontSize=circle?34:28;l.lineHeight=34;l.color=new Color(103,58,32);l.isBold=true;l.overflow=Label.Overflow.SHRINK;l.enableWrapText=true;
  }}
  private text(id:string,value:string,x:number,y:number,size:number,color=new Color(66,48,38)):void{const n=new Node(`P1BText-${id}`);this.uiRoot!.addChild(n);n.setPosition(x-375,y-667,0);n.addComponent(UITransform).setContentSize(700,60);const label=n.addComponent(Label);label.string=value;label.fontSize=size;label.lineHeight=size+8;label.color=color;label.isBold=true;label.overflow=Label.Overflow.SHRINK;label.enableWrapText=true;this.labels.set(id,label);}
  private button(id:string,label:string,x:number,y:number,w:number,h:number,action:()=>void):void{this.buttons.push({id,label,rect:{x,y,w,h},action});}
  private refreshHud():void{if(this.screen!=='PLAYING')return;const snap=this.engine?.snapshot();if(!snap)return;const score=this.labels.get('score'),next=this.labels.get('next'),danger=this.labels.get('danger');const bucket=snap.boardType==='assisted'?'assisted':'standard';if(score)score.string=`分数 ${snap.score}  ·  纪录 ${this.bundle.profile.bestScoresByRules?.[snap.rulesVersion]?.classic?.[bucket]??0}`;if(next)next.string=`当前 ${this.levelName(snap.currentLevel)}  ·  最高 ${this.levelName(snap.maxLevel)}`;if(danger)danger.string=snap.dangerTicks?`快满了 · ${Math.max(1,3-Math.floor(snap.dangerTicks/60))}`:'同级相遇，合成更大颗';const durationTicks=Math.round(AppRuntime.rules!.shake.duration_seconds*AppRuntime.rules!.physics.fixed_hz),shakeLeft=Math.max(0,2-snap.shake.baseUsed),extraLeft=Math.max(0,snap.shake.extraGranted-snap.shake.extraUsed),activeLeft=snap.shake.activeStartTick===null?0:Math.max(0,snap.shake.activeStartTick+durationTicks-snap.tick),cooldownLeft=Math.max(0,snap.shake.cooldownUntilTick-snap.tick);const shakeLabel=activeLeft>0?'晃杯中':cooldownLeft>0?'稍等片刻':shakeLeft>0?`晃杯 ${shakeLeft}`:extraLeft>0?`奖励晃杯 ${extraLeft}`:this.rewarded?.policy.enabled&&this.rewardView()?.block===null?'看广告 +1 次':'本局次数已用完';const button=this.uiRoot?.getChildByName('P1BButton-shake')?.getChildByName('Label')?.getComponent(Label);if(button)button.string=shakeLabel;}
  private enqueue(kind:'DROP'|'SHAKE',x?:number):void{if(!this.engine||this.screen!=='PLAYING')return;const snap=this.engine.snapshot();if(kind==='SHAKE'&&snap.shake.baseUsed>=2&&Math.max(0,snap.shake.extraGranted-snap.shake.extraUsed)===0){this.openRewardedOffer();return;}const commandId=this.makeUuid();const command:any={kind,runId:snap.runId,commandId,sequence:snap.nextCommandSequence,tick:snap.tick+1};if(kind==='DROP')command.xDu=x??this.previewX;else command.source=snap.shake.baseUsed<2?'base':'rewarded_ad';
    const result=this.engine.dispatch({command,ownerEpoch:snap.epoch});if(!result.ok){this.notice=result.error.message;this.render();return;}}
  private onTouchStart(event:any):void{this.ignoreMouseUntil=Date.now()+600;this.beginPointer(event,event.getID?.()??0);}
  private onTouchMove(event:any):void{this.updatePressedState(event);if(this.pointerKind==='cup'&&this.primaryPointer===(event.getID?.()??0))this.moveCup(event);}
  private onTouchEnd(event:any):void{if(this.primaryPointer===(event.getID?.()??0))this.endPointer(event);}
  private onTouchCancel(event:any):void{if(this.primaryPointer===(event.getID?.()??0))this.cancelPointer();}
  private onMouseDown(event:any):void{if(Date.now()<this.ignoreMouseUntil)return;this.beginPointer(event,-1);}
  private onMouseMove(event:any):void{if(Date.now()<this.ignoreMouseUntil)return;this.updatePressedState(event);if(this.pointerKind==='cup'&&this.primaryPointer===-1)this.moveCup(event);}
  private onMouseUp(event:any):void{if(Date.now()<this.ignoreMouseUntil)return;if(this.primaryPointer===-1)this.endPointer(event);}
  private updatePressedState(event:any):void{if(this.pointerKind!=='ui'||!this.startedInButton)return;const b=this.buttons.find(v=>v.id===this.startedInButton),p=this.point(event);if(b)this.setButtonState(b.id,this.contains(b.rect,p.x,p.y)?'pressed':'normal');}
  private inDropBand(p:{x:number;y:number}):boolean{return p.x>=80&&p.x<=670&&p.y>=180&&p.y<=320;}
  private beginPointer(event:any,id:number):void{if(this.primaryPointer!==null)return;const p=this.point(event);const hit=this.buttons.find(b=>this.contains(b.rect,p.x,p.y));this.primaryPointer=id;
    if(hit){this.pointerKind='ui';this.startedInButton=hit.id;void this.effects?.play('tap',p.x,p.y,`button:${hit.id}`,this.reducedMotion);if(hit.enabled!==false)this.setButtonState(hit.id,'pressed');return;}if(this.screen==='PLAYING'&&this.hitCup(p)){this.pointerKind='cup';const snap=this.engine!.snapshot();this.cupPointerStartX=p.x;this.cupPointerStartOffset=snap.cupMotion.offsetXDu;return;}this.pointerKind='ui';this.startedInButton=null;}
  private hitCup(p:{x:number;y:number}):boolean{const cup=AppRuntime.rules!.cup,cx=cup.center_x_du+(this.engine?.snapshot().cupMotion.offsetXDu??0),x=Math.abs(p.x-cx);if(p.y>=180&&p.y<=340)return x<=cup.bottom_width_du/2+16;if(p.y<360||p.y>720)return false;const half=cup.bottom_width_du/2+(p.y-360)*(cup.top_width_du-cup.bottom_width_du)/(2*640);return x<=half+16;}
  private moveCup(event:any):void{const p=this.point(event);this.engine?.setCupTarget(this.cupPointerStartOffset+(p.x-this.cupPointerStartX)*(AppRuntime.rules?.cup_motion.input_gain??1));}
  private moveDrop(event:any):void{const p=this.point(event);if(this.inDropBand(p)){this.previewX=this.clampPreview(this.dropStartPreviewX+(p.x-this.dropStartX)*2);this.updatePreviewPosition();}}
  private endPointer(event:any):void{const p=this.point(event);if(this.pointerKind==='ui'&&this.startedInButton){const hit=this.buttons.find(b=>b.id===this.startedInButton&&this.contains(b.rect,p.x,p.y));this.setButtonState(this.startedInButton,'normal');if(hit&&hit.enabled!==false){this.unlockAudioFromGesture();this.audio?.play('ui_tap');hit.action();}}
    else if(this.pointerKind==='cup'&&this.screen==='PLAYING'){this.moveCup(event);this.engine?.releaseCup();this.unlockAudioFromGesture();}
    else if(this.pointerKind==='drop'&&this.screen==='PLAYING'&&this.inDropBand(p)){const overUi=this.buttons.some(b=>this.contains(b.rect,p.x,p.y));
      if(!overUi){this.previewX=this.clampPreview(this.dropStartPreviewX+(p.x-this.dropStartX)*2);this.updatePreviewPosition();this.unlockAudioFromGesture();if(this.mode==='drag_release')this.enqueue('DROP',this.previewX);}}
    this.primaryPointer=null;this.pointerKind=null;this.startedInButton=null;}
  private cancelPointer():void{if(this.startedInButton)this.setButtonState(this.startedInButton,'normal');if(this.pointerKind==='cup')this.engine?.cancelCupInput(false);this.primaryPointer=null;this.pointerKind=null;this.startedInButton=null;this.dropStartX=0;this.dropStartPreviewX=this.previewX;}
  private point(event:any):{x:number;y:number}{
    // getUILocation() already removes the pixel scale. Only remove the centered
    // decorative margins; do not apply UITransform or a second scale conversion.
    const loc=event.getUILocation?.()??event.getLocation?.()??new Vec2();
    return gameUiPoint(loc,AppRuntime.rules!.viewport);
  }
  private contains(r:Rect,x:number,y:number):boolean{return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
  private clampPreview(x:number):number{const r=AppRuntime.rules!.ingredients.find(i=>i.level===this.engine?.snapshot().currentLevel)?.radius_du??18;const cup=AppRuntime.rules!.cup;return Math.max(cup.center_x_du-cup.top_width_du/2+r,Math.min(cup.center_x_du+cup.top_width_du/2-r,x));}
  private async restoreRun():Promise<void>{if(this.loading||!this.bundle.run)return;this.runBestScoreAtStart=this.bundle.profile.bestScoresByRules?.[this.bundle.run.rulesVersion]?.classic?.standard??this.bundle.profile.bestScores[this.bundle.run.stageId]?.standard??0;if(this.bundle.run.rulesVersion!==AppRuntime.rules?.design_rules_version){this.notice='这是旧杯型的未完成局，已保留但不会载入新杯。确认开始新杯后才替换。';this.render();return;}this.loading=true;this.screen='PAUSED';this.render();const owner=++this.ownerEpoch;
    try{const stored=await this.repo.readBundle();if(!this.isOwner()||owner!==this.ownerEpoch)return;if(!stored.ok)throw new Error(stored.error.message);if(!stored.data.envelope)throw new Error('没有可续局档案');this.bundle=stored.data.envelope.payload;this.bundleRevision=stored.data.envelope.revision;
      await this.loadGameArt();if(!this.isOwner()||owner!==this.ownerEpoch)return;const rules=AppRuntime.rules!;const run=this.bundle.run!;this.adapter=this.createWorld();this.engine=new RunEngine(this.adapter,rules,run.runId,run.rng.state,run,this.reviveOptions());this.engine.setTimingDiagnostics(false);this.baseTick=run.tick;this.clock=new FixedClock(rules.physics.fixed_hz,rules.physics.max_catchup_steps,()=>this.advanceRunTick());this.clock.pause();this.pauseOwners=new Set(['RESTORING']);
      this.pauseOwners.delete('RESTORING');if(HostLifecycleCoordinator.snapshot().resumeRequired)this.pauseOwners.add('RESUME_REQUIRED');this.screen=this.engine.spillPending?'REVIVE':'PAUSED';this.notice=this.engine.spillPending?'已恢复洒出局面：可观看广告复活一次，或结束本局。':'已从最近完整保存恢复；点击“继续”后才推进。';this.bindRewardedShake();this.bindSpillRevive();this.render();
    }catch(error){if(this.isOwner()&&owner===this.ownerEpoch){this.screen='ERROR';this.notice=`续局失败：${String(error)}`;this.render();}}finally{if(this.isOwner()&&owner===this.ownerEpoch)this.loading=false;}}
  private async persistSettings():Promise<void>{const repository=this.activeSaveRepository();if(!repository){this.notice='设置仅保存在当前页面内存中。';return;}if(this.saveInFlight){this.settingsDirty=true;return;}const task=this.beginSaveTask();if(task===null){this.settingsDirty=true;return;}const owner=this.ownerEpoch,expectedRevision=this.bundleRevision,expectedRunId=this.bundle.run?.runId??null;
    const profile={...this.bundle.profile,settings:{...this.bundle.profile.settings,dropMode:this.mode,reducedMotion:this.reducedMotion},revision:this.bundle.profile.revision+1};const next={...this.bundle,profile};
    try{const r=await repository.commitBundle(expectedRevision,expectedRunId,next);if(!this.ownsSaveTask(task,owner))return;if(r.ok){this.bundle=next;this.bundleRevision=r.data.revision;}else{this.notice=`设置未保存：${r.error.message}`;}}
    catch(error){if(this.ownsSaveTask(task,owner))this.notice=`设置未保存：${String(error)}`;}
    finally{if(this.ownsSaveTask(task,owner)&&this.screen!=='PLAYING')this.render();this.finishSaveTask(task);}}
  
  
  
  private advanceRunTick():boolean{const events=this.engine?.advanceOneTick()??[];if(this.engine){this.readContactFeedback();if(this.engine.phase==='SETTLING'||this.engine.spillPending)this.clock?.pause();if(this.engine.lastTickFault){this.clock?.pause();this.pauseOwners.add('TECHNICAL_ERROR');this.cancelPointer();this.screen='ERROR';const rollbackFailed=this.engine.lastTickFault.includes('|ROLLBACK:');this.notice=rollbackFailed?'本局恢复未完成，原存档保持不变。错误编号 PHYSICS_ROLLBACK_FAILED':'本局遇到问题，已恢复到上一个完整物理步。错误编号 PHYSICS_TICK_ROLLED_BACK';if(rollbackFailed)this.saveDirty=false;else{this.saveDirty=true;void this.commitCheckpoint(true);}this.render();return false;}
      }
    this.lastEvents.push(...events);return true;}
  
  
  private levelName(level:Level):string{return AppRuntime.rules!.ingredients.find(i=>i.level===level)?.name??`等级${level}`;}
  private makeUuid():string{const c=globalThis.crypto;if(c?.randomUUID)return c.randomUUID();const bytes=new Uint8Array(16);if(c?.getRandomValues)c.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
  // Run IDs and initial gameplay seeds are local identities, never account or authentication tokens.
  private seed():number{const a=new Uint32Array(1);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);else a[0]=Math.floor(Math.random()*0x100000000);return a[0]||1;}
  private enterTechnicalError(message:string):void{this.clock?.pause();this.engine?.pause('TECHNICAL_ERROR');this.pauseOwners.add('TECHNICAL_ERROR');this.screen='ERROR';this.notice=`物理/运行错误已冻结现场：${message}`;void this.commitCheckpoint(true);this.render();}
}
