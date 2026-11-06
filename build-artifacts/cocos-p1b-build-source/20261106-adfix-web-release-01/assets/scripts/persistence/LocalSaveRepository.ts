import { cloneState } from '../core/CloneState';
import type { CommitReceipt, IBundleSaveRepository, LocalSaveBundle, LocalSaveEnvelope, Result, SaveReadResult, UUID } from '../contracts/types';
import { SaveCodec } from './SaveCodec';
import { SaveMigration } from './SaveMigration';
import { SaveValidator } from './SaveValidator';

type StorageLike={getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void};
const fail=(code:string,message:string,retryable=false):Result<never>=>({ok:false,error:{code,message,retryable}});
const pass=<T>(data:T):Result<T>=>({ok:true,data});
const defaultBundle=():LocalSaveBundle=>({profile:{schemaVersion:3,settings:{musicGain:.35,sfxGain:.7,reducedMotion:false,dropMode:'drag_release',tutorialCompleted:false},discoveredLevels:[],unlockedStageIds:['classic'],bestScores:{},activeRunId:null,revision:0,firstNaturalRunCompleted:false,rewardedShake:{dayKey:null,dailyGranted:0,pendingAttempt:null,receipts:[]},rewardedRevive:{dayKey:null,dailyGranted:0,pendingAttempt:null,receipts:[]}},run:null,lastResult:null});

export class LocalSaveRepository implements IBundleSaveRepository {
  static readonly prefix='milktea.p1b.local.v1';
  static readonly keys={A:`${LocalSaveRepository.prefix}.slotA`,B:`${LocalSaveRepository.prefix}.slotB`,pointer:`${LocalSaveRepository.prefix}.pointer`};
  private readonly memory=new Map<string,string>(); private storage:StorageLike|null=null; private leaseMode:'persistent'|'memory-only'='memory-only';
  private leaseRelease:(()=>void)|null=null; private failOnce:string|null=null;
  private static readonly tapWriters=new Set<string>();
  private tapStorage=false;
  constructor(private readonly debugNamespace?:string,storage?:StorageLike){
    const tap=(globalThis as any).tap;
    if(!storage&&tap&&typeof tap.getStorageSync==='function'&&typeof tap.setStorageSync==='function'&&typeof tap.removeStorageSync==='function'){
      this.tapStorage=true;
      this.storage={getItem:key=>{const value=tap.getStorageSync(key);return value==null||value===''?null:typeof value==='string'?value:JSON.stringify(value);},setItem:(key,value)=>tap.setStorageSync(key,value),removeItem:key=>tap.removeStorageSync(key)};
    }else{try{this.storage=storage??(typeof localStorage!=='undefined'?localStorage:null);}catch{this.storage=null;}}
  }
  injectFaultOnce(point:string):void{this.failOnce=point;}
  async acquireWriteLease():Promise<Result<{release():void;mode:'persistent'|'memory-only'}>>{
    if(this.leaseRelease)return fail('SAVE_LEASE_HELD','本页面已持有存档写租约');
    const lockName=this.debugNamespace?`${LocalSaveRepository.prefix}.debug.${this.debugNamespace}.writer`:`${LocalSaveRepository.prefix}.writer`;
    // Tap minigames have one JS game context, not competing browser tabs.
    if(this.tapStorage&&this.storage){
      if(LocalSaveRepository.tapWriters.has(lockName))return fail('SAVE_WRITER_EXISTS','当前小游戏已有存档写入者',true);
      LocalSaveRepository.tapWriters.add(lockName);this.leaseMode='persistent';
      const release=()=>{if(this.leaseRelease!==release)return;LocalSaveRepository.tapWriters.delete(lockName);this.leaseRelease=null;this.leaseMode='memory-only';};
      this.leaseRelease=release;return pass({mode:'persistent',release});
    }
    const locks=(globalThis as any).navigator?.locks;
    if(!locks?.request||!this.storage){this.leaseMode='memory-only';return pass({mode:'memory-only',release:()=>{}});}
    let acquired:(()=>void)|null=null;let rejectAcquire:((reason:unknown)=>void)|null=null;
    const ready=new Promise<void>((resolve,reject)=>{acquired=resolve;rejectAcquire=reject;});
    const hold=new Promise<void>(resolve=>{this.leaseRelease=resolve;});
    void locks.request(lockName,{mode:'exclusive',ifAvailable:true},async(lock:any)=>{
      if(!lock){this.leaseRelease=null;rejectAcquire?.(new Error('SAVE_WRITER_EXISTS'));return;}
      this.leaseMode='persistent';acquired?.();await hold;this.leaseRelease=null;
    }).catch((error:unknown)=>{this.leaseRelease=null;rejectAcquire?.(error);});
    try{await ready;return pass({mode:'persistent',release:()=>this.leaseRelease?.()});}
    catch(error){return fail('SAVE_WRITER_EXISTS',String(error),true);}
  }
  async readBundle():Promise<SaveReadResult>{
    let a:ReturnType<LocalSaveRepository['readSlot']>,b:ReturnType<LocalSaveRepository['readSlot']>;
    try{a=this.readSlot('A');b=this.readSlot('B');}catch(error){return fail('STORAGE_IO_ERROR',`读取存档失败：${String(error)}`,true);}
    if(a.unknownVersion||b.unknownVersion)return fail('SAVE_VERSION_UNSUPPORTED','发现较新或不支持的存档版本；为保护原档，已禁止回退与写入');
    if(a.ioError||b.ioError)return fail('STORAGE_IO_ERROR',`读取存档失败：${a.ioError??b.ioError}`,true);
    if(a.error&&b.error)return fail('STORAGE_CORRUPT',`双槽均不可恢复：A=${a.error}；B=${b.error}`);
    if(a.envelope&&b.envelope&&a.envelope.revision===b.envelope.revision&&SaveCodec.canonicalJson(a.envelope.payload)!==SaveCodec.canonicalJson(b.envelope.payload))return fail('SAVE_REVISION_CONFLICT','相同revision存在不同有效档；原始槽均保留');
    const selected=!a.envelope?b.envelope:!b.envelope?a.envelope:a.envelope.revision>=b.envelope.revision?a.envelope:b.envelope;
    const slot=selected===a.envelope?'A':selected===b.envelope?'B':null;
    const warning=a.error||b.error?`一槽损坏，已回退到另一完整槽；坏槽字节保留。${a.error??b.error}`:undefined;
    if(!selected)return {ok:true,data:{envelope:null,recoveredFromSlot:null}};
    return {ok:true,data:{envelope:selected,recoveredFromSlot:slot,warning}};
  }
  async commitBundle(expectedRevision:number,expectedRunId:UUID|null,next:LocalSaveBundle):Promise<Result<CommitReceipt>>{
    if(this.leaseMode!=='persistent')return fail('SAVE_MEMORY_ONLY','当前浏览器缺少可靠跨标签锁，存档仅在内存可用',true);
    const read=await this.readBundle();if(!read.ok)return read;
    const current=read.data.envelope;const revision=current?.revision??0;const runId=current?.payload.run?.runId??null;
    if(revision!==expectedRevision||runId!==expectedRunId)return fail('CONFLICT_REVISION','存档已由新操作更新，请先重新读取');
    let normalized:LocalSaveBundle;
    try{normalized={...cloneState(next),run:next.run?SaveCodec.sealSnapshot(next.run):null};}catch(error){return fail('SAVE_NORMALIZE_FAILED',`档案规范化失败：${String(error)}`);}
    const valid=SaveValidator.bundle(normalized);if(!valid.valid)return fail(valid.code!,valid.message!);
    const envelope=SaveCodec.createEnvelopeV2(revision+1,normalized);const active=read.data.recoveredFromSlot;const target=active==='A'?'B':'A';const key=this.key(target);
    try{
      const prior=this.getItem(key);
      if(prior!==null){const existing=this.readSlot(target);if(existing.error){
        const backup=this.key(`backup-${target}` as any);
        if(this.getItem(backup)===null)this.setItem(backup,prior);
        if(this.getItem(backup)!==prior)return fail('SAVE_CORRUPT_BACKUP_FAILED','损坏槽原始字节备份失败，拒绝覆盖');
      }}
      if(this.fault('write-before'))throw new Error('INJECTED_WRITE_BEFORE');
      const text=SaveCodec.canonicalJson(envelope);const split=this.fault('partial-slot')?Math.max(1,Math.floor(text.length/2)):text.length;
      this.setItem(key,text.slice(0,split));if(split!==text.length)throw new Error('INJECTED_PARTIAL_SLOT');
      if(this.fault('slot-complete'))return this.resolveAmbiguousCommit(envelope,target,'INJECTED_SLOT_COMPLETE');
      const stored=this.getItem(key);if(!stored)throw new Error('SAVE_READBACK_EMPTY');
      const parsed=JSON.parse(stored);if(this.fault('readback'))throw new Error('INJECTED_READBACK');
      if(!SaveValidator.envelope(parsed)||parsed.checksum!==envelope.checksum)throw new Error('SAVE_READBACK_INVALID');
      if(this.fault('pre-pointer'))throw new Error('INJECTED_PRE_POINTER');
      try{if(this.fault('pointer'))throw new Error('INJECTED_POINTER');this.setItem(this.key('pointer'),target);}
      catch(error){return pass({revision:envelope.revision,committed:true,pointerUpdated:false,warning:`档案已提交，但指针未更新：${String(error)}`});}
      return pass({revision:envelope.revision,committed:true,pointerUpdated:true});
    }catch(error){return this.resolveAmbiguousCommit(envelope,target,String(error));}
  }
  exportRaw():Record<string,string|null>{return {A:this.getItem(this.key('A')),B:this.getItem(this.key('B')),pointer:this.getItem(this.key('pointer'))};}
  clearDebugNamespace():void{if(!this.debugNamespace)return;for(const k of Object.keys(this.exportRaw()))this.removeItem(this.key(k as 'A'|'B'|'pointer'));}
  private fault(point:string):boolean{if(this.failOnce!==point)return false;this.failOnce=null;return true;}
  private key(slot:'A'|'B'|'pointer'|'backup-A'|'backup-B'):string{if(this.debugNamespace)return `milktea.p1b.debug.${this.debugNamespace}.${slot}`;if(slot==='backup-A'||slot==='backup-B')return `${LocalSaveRepository.prefix}.${slot}`;return LocalSaveRepository.keys[slot];}
  private readSlot(slot:'A'|'B'):{envelope:LocalSaveEnvelope|null;error:string|null;unknownVersion?:boolean;ioError?:string;migrated?:boolean}{
    let raw:string|null;try{raw=this.getItem(this.key(slot));}catch(error){return {envelope:null,error:null,ioError:String(error)};}
    if(raw===null)return {envelope:null,error:null};
    try{if(raw.length>2_000_000)return {envelope:null,error:'SAVE_TOO_LARGE'};const parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object'&&Number.isInteger(parsed.schemaVersion)&&parsed.schemaVersion!==1&&parsed.schemaVersion!==2)return {envelope:null,error:'SAVE_VERSION_UNSUPPORTED',unknownVersion:true};
      if(SaveValidator.envelope(parsed))return {envelope:parsed,error:null};
      if(parsed?.schemaVersion===2&&parsed.payload?.run===null&&SaveCodec.verifyEnvelopeV2(parsed)&&SaveValidator.profileV2(parsed.payload.profile)){
        const payload={...parsed.payload,profile:SaveMigration.profileV2(parsed.payload.profile),run:null};
        return {envelope:SaveCodec.createEnvelopeV2(parsed.revision,payload),error:null,migrated:true};
      }
      if(parsed?.schemaVersion===2&&parsed.payload?.run?.saveSchemaVersion===4&&SaveCodec.verifyEnvelopeV2(parsed)&&SaveValidator.profileV2(parsed.payload.profile)&&SaveValidator.legacySnapshotV4(parsed.payload.run).valid){
        const payload={...parsed.payload,profile:SaveMigration.profileV2(parsed.payload.profile),run:SaveMigration.runV4(parsed.payload.run)};
        return {envelope:SaveCodec.createEnvelopeV2(parsed.revision,payload),error:null,migrated:true};
      }
      if(parsed?.schemaVersion===2&&parsed.payload?.run?.saveSchemaVersion===3&&SaveCodec.verifyEnvelopeV2(parsed)&&SaveValidator.profileV2(parsed.payload.profile)&&SaveValidator.legacySnapshot(parsed.payload.run,3).valid){
        const payload={...parsed.payload,profile:SaveMigration.profileV2(parsed.payload.profile),run:SaveMigration.runV3(parsed.payload.run)};
        return {envelope:SaveCodec.createEnvelopeV2(parsed.revision,payload),error:null,migrated:true};
      }
      if(SaveValidator.legacyEnvelope(parsed)){
        const migrated=SaveMigration.bundle(parsed.payload);
        const envelope=SaveCodec.createEnvelopeV2(parsed.revision,migrated);
        return {envelope,error:null,migrated:true};
      }
      return {envelope:null,error:'SAVE_INVALID'};}
    catch(error){return {envelope:null,error:`SAVE_PARSE:${String(error)}`};}}
  private resolveAmbiguousCommit(envelope:LocalSaveEnvelope,slot:'A'|'B',cause:string):Result<CommitReceipt>{
    try{const raw=this.getItem(this.key(slot));if(raw!==null){const parsed=JSON.parse(raw);if(SaveValidator.envelope(parsed)&&parsed.revision===envelope.revision&&parsed.checksum===envelope.checksum)return pass({revision:envelope.revision,committed:true,pointerUpdated:false,warning:`写入后发生异常，但operation内容核对确认已提交：${cause}`});}
      const other=this.readSlot(slot==='A'?'B':'A');if(other.envelope?.revision===envelope.revision&&other.envelope.checksum===envelope.checksum)return pass({revision:envelope.revision,committed:true,pointerUpdated:false,warning:`异常后由双槽核对确认已提交：${cause}`});
      return fail('SAVE_COMMIT_UNCERTAIN',`写入异常且无法确认提交状态，禁止盲目重试：${cause}`,false);
    }catch(error){return fail('SAVE_COMMIT_UNCERTAIN',`写入异常且读取核对失败，禁止盲目重试：${String(error)}`,false);}
  }
  private getItem(key:string):string|null{return this.storage?.getItem(key)??this.memory.get(key)??null;}
  private setItem(key:string,value:string):void{if(this.storage)this.storage.setItem(key,value);else this.memory.set(key,value);}
  private removeItem(key:string):void{if(this.storage)this.storage.removeItem(key);else this.memory.delete(key);}
  static emptyBundle():LocalSaveBundle{return defaultBundle();}
}
