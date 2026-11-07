import type { LocalProfile, LocalSaveBundle, LocalSaveBundleV1, LocalSaveEnvelope, LocalSaveEnvelopeV1, RunSnapshot, StageId, TerminalReason } from '../contracts/types';
import { SaveCodec } from './SaveCodec';

export interface Validation { valid:boolean; code:string|null; message:string|null }
const ok=():Validation=>({valid:true,code:null,message:null});
const bad=(code:string,message:string):Validation=>({valid:false,code,message});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v:Record<string,unknown>,allowed:readonly string[]):boolean=>Object.keys(v).every(k=>allowed.includes(k));
const integer=(v:unknown,min:number,max=Number.MAX_SAFE_INTEGER):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const dayKey=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
const stages:readonly StageId[]=['classic','coconut_green','taro_boba','brown_sugar','mochi_special'];
const reasons:readonly TerminalReason[]=['CUP_FULL','SPILLED','BUDGET_EXHAUSTED','ABANDONED','TECHNICAL_ERROR'];
const rulesVersions:readonly string[]=['design-v0.1','design-v0.2-short-cup-01','design-v0.3-cup-auto-01','design-v0.4-mobile-feel-ads-01','design-v0.5-natural-spawn-01','design-v0.6-cup-bump-01','design-v0.7-guarded-bump-01'];
const levels=(v:unknown):v is number=>integer(v,1,9);
const boards=(v:unknown):v is string=>v==='standard'||v==='assisted';
const common=['saveSchemaVersion','rulesVersion','appVersion','runId','epoch','revision','stageId','mode','boardType','state','tick','nextEntityId','nextCommandSequence','score','maxLevel','dropIndex','currentLevel','nextLevel','lastDropTick','settleStartedTick','challenge','rng','ingredients','shake','dangerTicks','terminalReason','checksum'];

/** Strict, exception-safe validation for data crossing the browser storage boundary. */
export class SaveValidator {
  static envelope(value:unknown):value is LocalSaveEnvelope {
    try {
      if(!object(value)||!keys(value,['schemaVersion','revision','payload','checksum'])||value.schemaVersion!==2||!integer(value.revision,0)||typeof value.checksum!=='string'||!/^[0-9a-f]{64}$/.test(value.checksum))return false;
      const payload=this.bundle(value.payload);if(!payload.valid)return false;
      return SaveCodec.verifyEnvelopeV2(value as unknown as LocalSaveEnvelope);
    } catch { return false; }
  }
  /** Schema-1 envelope (v2 runs / v1 profile) accepted only so the repository can migrate it. */
  static legacyEnvelope(value:unknown):value is LocalSaveEnvelopeV1 {
    try {
      if(!object(value)||!keys(value,['schemaVersion','revision','payload','checksum'])||value.schemaVersion!==1||!integer(value.revision,0)||typeof value.checksum!=='string'||!/^[0-9a-f]{64}$/.test(value.checksum))return false;
      const payload=this.legacyBundle(value.payload);if(!payload.valid)return false;
      return SaveCodec.verifyEnvelope(value as unknown as LocalSaveEnvelopeV1);
    } catch { return false; }
  }
  static bundle(value:unknown):Validation {
    try {
      if(!object(value)||!keys(value,['profile','run','lastResult']))return bad('SAVE_BUNDLE_INVALID','档案结构无效');
      const profile=this.profile(value.profile);if(!profile.valid)return profile;
      if(value.run!==null){const result=this.snapshot(value.run);if(!result.valid)return result;}
      const run=value.run as RunSnapshot|null;
      if((run?.runId??null)!==(value.profile as LocalProfile).activeRunId)return bad('SAVE_OWNER_MISMATCH','活动局与玩家档案owner不一致');
      if(value.lastResult!==null){const result=value.lastResult;
        if(!object(result)||!keys(result,['runId','reason','score','maxLevel','dropIndex','baseUsed','extraUsed','boardType','rulesVersion'])||!uuid(result.runId)||!reasons.includes(result.reason as TerminalReason)||!integer(result.score,0)||!levels(result.maxLevel)||!integer(result.dropIndex,0)||!integer(result.baseUsed,0,2)||!integer(result.extraUsed,0,5)||!boards(result.boardType)||(result.extraUsed>0&&result.boardType!=='assisted')||result.rulesVersion!==undefined&&typeof result.rulesVersion!=='string')return bad('SAVE_RESULT_INVALID','结算摘要无效');}
      return ok();
    } catch { return bad('SAVE_BUNDLE_INVALID','档案结构无效'); }
  }
  /** Schema-1 payload shape; used by migration before it writes the current bundle. */
  static legacyBundle(value:unknown):Validation {
    try {
      if(!object(value)||!keys(value,['profile','run','lastResult']))return bad('SAVE_BUNDLE_INVALID','档案结构无效');
      const profile=this.legacyProfile(value.profile);if(!profile.valid)return profile;
      if(value.run!==null){const schema=(value.run as Record<string,unknown>).saveSchemaVersion;if(schema!==1&&schema!==2&&schema!==3)return bad('SAVE_RUN_HEADER','旧版运行快照版本不支持');const result=this.legacySnapshot(value.run,schema);if(!result.valid)return result;}
      const run=value.run as {runId?:unknown}|null;
      if((run?.runId??null)!==(value.profile as {activeRunId?:unknown}).activeRunId)return bad('SAVE_OWNER_MISMATCH','活动局与玩家档案owner不一致');
      if(value.lastResult!==null){const result=value.lastResult;
        if(!object(result)||!keys(result,['runId','reason','score','maxLevel','dropIndex','baseUsed','extraUsed','rulesVersion'])||!uuid(result.runId)||!reasons.includes(result.reason as TerminalReason)||!integer(result.score,0)||!levels(result.maxLevel)||!integer(result.dropIndex,0)||!integer(result.baseUsed,0,2)||result.extraUsed!==0||result.rulesVersion!==undefined&&typeof result.rulesVersion!=='string')return bad('SAVE_RESULT_INVALID','结算摘要无效');}
      return ok();
    } catch { return bad('SAVE_BUNDLE_INVALID','档案结构无效'); }
  }
  private static profileShape(value:unknown,schema:1|2|3):Validation {
    try {
      const extra=schema===1?[]:schema===2?['firstNaturalRunCompleted','rewardedShake']:['firstNaturalRunCompleted','rewardedShake','rewardedRevive'];
    if(!object(value)||!keys(value,['schemaVersion','settings','discoveredLevels','unlockedStageIds','bestScores','activeRunId','revision','bestScoresByRules','tutorialRulesVersion',...extra])||value.schemaVersion!==schema||!integer(value.revision,0))return bad('SAVE_PROFILE_INVALID','玩家档案字段无效');
    const s=value.settings;
    if(!object(s)||!keys(s,['musicGain','sfxGain','reducedMotion','dropMode','tutorialCompleted'])||!finite(s.musicGain)||s.musicGain<0||s.musicGain>1||!finite(s.sfxGain)||s.sfxGain<0||s.sfxGain>1||typeof s.reducedMotion!=='boolean'||!['drag_release','tap_confirm'].includes(String(s.dropMode))||typeof s.tutorialCompleted!=='boolean')return bad('SAVE_SETTINGS_INVALID','设置字段无效');
    if(!Array.isArray(value.discoveredLevels)||value.discoveredLevels.some(x=>!levels(x))||new Set(value.discoveredLevels).size!==value.discoveredLevels.length)return bad('SAVE_DISCOVERY_INVALID','已发现等级无效');
    if(!Array.isArray(value.unlockedStageIds)||value.unlockedStageIds.length===0||value.unlockedStageIds.some(x=>!stages.includes(x as StageId))||new Set(value.unlockedStageIds).size!==value.unlockedStageIds.length)return bad('SAVE_STAGE_INVALID','解锁阶段无效');
    if(value.activeRunId!==null&&!uuid(value.activeRunId))return bad('SAVE_ACTIVE_RUN_INVALID','活动局标识无效');
    if(!object(value.bestScores)||!keys(value.bestScores,stages))return bad('SAVE_BEST_SCORES_INVALID','最佳成绩结构无效');
    for(const stage of Object.keys(value.bestScores)){const best=value.bestScores[stage];if(!object(best)||!keys(best,['standard','assisted'])||Object.values(best).some(score=>!integer(score,0)))return bad('SAVE_BEST_SCORES_INVALID','最佳成绩结构无效');}
    if(value.tutorialRulesVersion!==undefined&&value.tutorialRulesVersion!==null&&typeof value.tutorialRulesVersion!=='string')return bad('SAVE_PROFILE_INVALID','教程规则标识无效');
    if(schema>=2){
      if(typeof value.firstNaturalRunCompleted!=='boolean')return bad('SAVE_PROFILE_INVALID','自然首局完成标记无效');
      const ledger=value.rewardedShake;
      if(!object(ledger)||!keys(ledger,['dayKey','dailyGranted','pendingAttempt','receipts'])||(ledger.dayKey!==null&&!dayKey(ledger.dayKey))||!integer(ledger.dailyGranted,0,365))return bad('SAVE_REWARD_LEDGER_INVALID','奖励账本字段无效');
      const pending=ledger.pendingAttempt;
      if(pending!==null&&(!object(pending)||!keys(pending,['attemptId','runId','policyVersion','amount','dayKey','startedAt'])||!uuid(pending.attemptId)||!uuid(pending.runId)||typeof pending.policyVersion!=='string'||pending.policyVersion.length===0||pending.amount!==1||!dayKey(pending.dayKey)||!integer(pending.startedAt,0)))return bad('SAVE_REWARD_LEDGER_INVALID','待确认奖励记录无效');
      if(!Array.isArray(ledger.receipts)||ledger.receipts.length>64)return bad('SAVE_REWARD_LEDGER_INVALID','奖励凭证列表无效');
      const attempts=new Set<string>();
      for(const receipt of ledger.receipts){
        if(!object(receipt)||!keys(receipt,['attemptId','runId','rewardKind','amount','policyVersion','dayKey','status','grantedAt'])||!uuid(receipt.attemptId)||attempts.has(receipt.attemptId)||!uuid(receipt.runId)||receipt.rewardKind!=='extra_shake'||receipt.amount!==1||typeof receipt.policyVersion!=='string'||receipt.policyVersion.length===0||!dayKey(receipt.dayKey)||receipt.status!=='COMMITTED'||!integer(receipt.grantedAt,0))return bad('SAVE_REWARD_LEDGER_INVALID','奖励凭证无效');
        attempts.add(receipt.attemptId);
      }
      if(schema===3){
        const revive=value.rewardedRevive;
        if(!object(revive)||!keys(revive,['dayKey','dailyGranted','pendingAttempt','receipts'])||(revive.dayKey!==null&&!dayKey(revive.dayKey))||!integer(revive.dailyGranted,0,365))return bad('SAVE_REWARD_LEDGER_INVALID','复活奖励账本字段无效');
        const revivePending=revive.pendingAttempt;
        if(revivePending!==null&&(!object(revivePending)||!keys(revivePending,['attemptId','runId','failureId','policyVersion','amount','dayKey','startedAt'])||!uuid(revivePending.attemptId)||!uuid(revivePending.runId)||!uuid(revivePending.failureId)||typeof revivePending.policyVersion!=='string'||revivePending.policyVersion.length===0||revivePending.amount!==1||!dayKey(revivePending.dayKey)||!integer(revivePending.startedAt,0)))return bad('SAVE_REWARD_LEDGER_INVALID','待确认复活记录无效');
        if(!Array.isArray(revive.receipts)||revive.receipts.length>64)return bad('SAVE_REWARD_LEDGER_INVALID','复活凭证列表无效');
        const reviveAttempts=new Set<string>();
        for(const receipt of revive.receipts){
          if(!object(receipt)||!keys(receipt,['attemptId','runId','failureId','rewardKind','amount','policyVersion','dayKey','status','grantedAt'])||!uuid(receipt.attemptId)||reviveAttempts.has(receipt.attemptId)||!uuid(receipt.runId)||!uuid(receipt.failureId)||receipt.rewardKind!=='spill_revive'||receipt.amount!==1||typeof receipt.policyVersion!=='string'||receipt.policyVersion.length===0||!dayKey(receipt.dayKey)||receipt.status!=='COMMITTED'||!integer(receipt.grantedAt,0))return bad('SAVE_REWARD_LEDGER_INVALID','复活凭证无效');
          reviveAttempts.add(receipt.attemptId);
        }
      }
    }
    return ok();
    } catch { return bad('SAVE_PROFILE_INVALID','玩家档案结构无效'); }
  }
  static profile(value:unknown):Validation { return this.profileShape(value,3); }
  static profileV2(value:unknown):Validation { return this.profileShape(value,2); }
  static legacyProfile(value:unknown):Validation { return this.profileShape(value,1); }
  private static runCommon(value:Record<string,unknown>):Validation {
    try {
      const s=value as unknown as RunSnapshot;
      if(!uuid(s.runId)||!integer(s.epoch,0)||!integer(s.revision,0))return bad('SAVE_RUN_HEADER','运行快照头无效或版本不兼容');
      if(!stages.includes(s.stageId)||s.mode!=='classic'||!boards(s.boardType)||!['PLAYING','PAUSED','SETTLING','RESULTS'].includes(s.state))return bad('SAVE_RULES_UNSUPPORTED','本地经典档规则不兼容');
      if(!integer(s.tick,0)||!integer(s.nextEntityId,1)||!integer(s.nextCommandSequence,1)||!integer(s.score,0)||!levels(s.maxLevel)||!integer(s.dropIndex,0)||!levels(s.currentLevel)||!levels(s.nextLevel))return bad('SAVE_RUN_COUNTER','运行计数无效');
      if(s.lastDropTick!==null&&(!integer(s.lastDropTick,0)||s.lastDropTick>s.tick)||s.settleStartedTick!==null&&(!integer(s.settleStartedTick,0)||s.settleStartedTick>s.tick))return bad('SAVE_ID_OR_DROP_TICK','实体ID或逻辑步无效');
      if(s.terminalReason!==null&&!reasons.includes(s.terminalReason))return bad('SAVE_TERMINAL_INVALID','终局原因无效');
      if((s.state==='SETTLING'||s.state==='RESULTS')&&s.terminalReason===null||(['PLAYING','PAUSED'].includes(s.state)&&s.terminalReason!==null))return bad('SAVE_TERMINAL_INVALID','终局状态与原因不一致');
      if(s.challenge!==null)return bad('SAVE_RULES_UNSUPPORTED','本地经典档不接受挑战状态');
      if(!object(s.rng)||!keys(s.rng,['algorithm','state','drawCount'])||s.rng.algorithm!=='xorshift32_v1_nonzero_seed'||!integer(s.rng.state,1,0xffffffff)||!integer(s.rng.drawCount,0)||s.rng.drawCount!==s.dropIndex+2)return bad('SAVE_RNG_INVALID','随机流状态无效');
      if(!integer(s.dangerTicks,0,180)||!Array.isArray(s.ingredients))return bad('SAVE_RULE_STATE_INVALID','危险或实体列表无效');
      const ids=new Set<number>();let maxId=0;
      for(const item of s.ingredients){if(!object(item)||!keys(item,['entityId','level','positionDu','velocityDuPerSecond','angleRadians','angularVelocity','bornTick','dangerEligible','hasEnteredCup','spillTicks','sleeping'])||!integer(item.entityId,1)||ids.has(item.entityId)||!levels(item.level))return bad('SAVE_ENTITY_ID','实体ID或等级无效');ids.add(item.entityId);maxId=Math.max(maxId,item.entityId);
        for(const point of [item.positionDu,item.velocityDuPerSecond])if(!object(point)||!keys(point,['x','y'])||!finite(point.x)||!finite(point.y))return bad('SAVE_ENTITY_NONFINITE','实体向量字段无效');
        if(!finite(item.angleRadians)||!finite(item.angularVelocity)||!integer(item.bornTick,0,s.tick)||typeof item.dangerEligible!=='boolean'||typeof item.hasEnteredCup!=='boolean'||!integer(item.spillTicks,0,30)||typeof item.sleeping!=='boolean')return bad('SAVE_ENTITY_LOGIC','实体逻辑字段无效');}
      if(s.nextEntityId<=maxId||s.maxLevel<Math.max(1,...s.ingredients.map(item=>item.level))||(s.dropIndex===0)!==(s.lastDropTick===null))return bad('SAVE_ID_OR_DROP_TICK','ID、最高等级或投放步跨字段不一致');
      if(typeof s.checksum!=='string'||!/^[0-9a-f]{64}$/.test(s.checksum)||!SaveCodec.verifySnapshot(s))return bad('SAVE_RUN_CHECKSUM','运行快照checksum缺失或不匹配');
      return ok();
    } catch { return bad('SAVE_RUN_INVALID','运行快照结构无效'); }
  }
  private static motionAndAuto(value:Record<string,unknown>,s:RunSnapshot):Validation {
    const motion=value.cupMotion,automatic=value.autoDrop;
    if(!object(motion)||!keys(motion,['offsetXDu','velocityXDuPerSecond','targetOffsetXDu','control'])||!finite(motion.offsetXDu)||Math.abs(motion.offsetXDu)>110||!finite(motion.velocityXDuPerSecond)||Math.abs(motion.velocityXDuPerSecond)>1200||!finite(motion.targetOffsetXDu)||Math.abs(motion.targetOffsetXDu)>110||!['IDLE','DRAGGING','SETTLING'].includes(String(motion.control))||!object(automatic)||!(keys(automatic,['nextDueTick'])||keys(automatic,['nextDueTick','pendingSpawn']))||!integer(automatic.nextDueTick,0))return bad('SAVE_CUP_AUTO_INVALID','移杯或自动落料状态无效');
    return ok();
  }
  static snapshot(value:unknown):Validation {
    try {
      if(!object(value))return bad('SAVE_RUN_HEADER','运行快照结构无效');
      if(!keys(value,[...common,'cupMotion','autoDrop','spawnRng','revive'])||value.saveSchemaVersion!==6||!rulesVersions.includes(String(value.rulesVersion))||value.appVersion!=='0.1.0')return bad('SAVE_RUN_HEADER','运行快照头无效或版本不兼容');
      const s=value as unknown as RunSnapshot,shake=s.shake;
      if(!object(shake)||!keys(shake,['baseUsed','extraGranted','extraUsed','activeStartTick','cooldownUntilTick','guardMembers','guardStableTicks','guardReleased'])||!integer(shake.baseUsed,0,2)||!integer(shake.extraGranted,0,5)||!integer(shake.extraUsed,0,5)||shake.extraUsed>shake.extraGranted||(shake.activeStartTick!==null&&!integer(shake.activeStartTick,0,s.tick))||!integer(shake.cooldownUntilTick,0)||typeof shake.guardReleased!=='boolean'||!integer(shake.guardStableTicks,0,96)||!Array.isArray(shake.guardMembers)||shake.guardMembers.length>64||shake.guardMembers.some(x=>!integer(x,0,s.nextEntityId))||new Set(shake.guardMembers).size!==shake.guardMembers.length)return bad('SAVE_RULE_STATE_INVALID','危险或颠杯状态越界');
      if(!shake.guardReleased&&shake.activeStartTick===null)return bad('SAVE_RULE_STATE_INVALID','颠杯护栏状态与动作窗口不一致');
      const revive=s.revive,expectedAssisted=shake.extraUsed>0||revive?.used===1;
      if(!object(revive)||!keys(revive,['used','pendingFailure','committedReceiptId'])||integer(revive.used,0,1)===false)return bad('SAVE_RULE_STATE_INVALID','复活账本无效');
      if(revive.pendingFailure!==null){
        const p=revive.pendingFailure;
        if(!object(p)||!keys(p,['version','failureId','detectedTick','reason','spilledEntityIds','clearanceDu','candidateHash','retainedEntityIds'])||p.version!==1||p.reason!=='SPILLED'||!uuid(p.failureId)||!integer(p.detectedTick,0,s.tick)||!Array.isArray(p.spilledEntityIds)||!Array.isArray(p.retainedEntityIds)||p.retainedEntityIds.some(x=>!integer(x,1))||!integer(p.clearanceDu,0,200)||typeof p.candidateHash!=='string'||!/^[0-9a-f]{64}$/.test(p.candidateHash)||s.state!=='PAUSED'||s.terminalReason!==null)return bad('SAVE_RULE_STATE_INVALID','待复活数据无效');
      }else if(revive.committedReceiptId!==null&&!uuid(revive.committedReceiptId))return bad('SAVE_RULE_STATE_INVALID','复活凭证无效');
      if(expectedAssisted&&s.boardType!=='assisted'||!expectedAssisted&&s.boardType==='assisted')return bad('SAVE_RULE_STATE_INVALID','辅助局与奖励计数不一致');
      const base=this.runCommon(value);if(!base.valid)return base;
      if(!object(value.spawnRng)||!keys(value.spawnRng,['algorithm','state','drawCount'])||value.spawnRng.algorithm!=='spawn-xorshift32-v1'||!integer(value.spawnRng.state,1,0xffffffff)||!integer(value.spawnRng.drawCount,0,Number.MAX_SAFE_INTEGER)||!object(value.autoDrop)||!keys(value.autoDrop,['nextDueTick','pendingSpawn']))return bad('SAVE_SPAWN_INVALID','自然落料随机流状态无效');
      const motion=this.motionAndAuto(value,s);if(!motion.valid)return motion;
      const pending=(value.autoDrop as any).pendingSpawn;
      if(!object(pending)||!keys(pending,['level','xDu','vxDuPerSecond','angularVelocity'])||!levels(pending.level)||pending.level!==s.currentLevel||!finite(pending.xDu)||Math.abs(pending.xDu-375)>20||!finite(pending.vxDuPerSecond)||Math.abs(pending.vxDuPerSecond)>12||pending.angularVelocity!==0)return bad('SAVE_SPAWN_INVALID','待落料描述符无效');
      return ok();
    } catch { return bad('SAVE_RUN_INVALID','运行快照结构无效'); }
  }
  /** Schema-5 run snapshot accepted only as migration input (pre-guard bump saves). */
  static legacySnapshotV5(value:unknown):Validation {
    try {
      if(!object(value))return bad('SAVE_RUN_HEADER','运行快照结构无效');
      if(!keys(value,[...common,'cupMotion','autoDrop','spawnRng','revive'])||value.saveSchemaVersion!==5||!rulesVersions.includes(String(value.rulesVersion))||value.appVersion!=='0.1.0')return bad('SAVE_RUN_HEADER','运行快照头无效或版本不兼容');
      const s=value as unknown as RunSnapshot,shake=s.shake;
      if(!object(shake)||!keys(shake,['baseUsed','extraGranted','extraUsed','activeStartTick','cooldownUntilTick'])||!integer(shake.baseUsed,0,2)||!integer(shake.extraGranted,0,5)||!integer(shake.extraUsed,0,5)||shake.extraUsed>shake.extraGranted||(shake.activeStartTick!==null&&!integer(shake.activeStartTick,0,s.tick))||!integer(shake.cooldownUntilTick,0))return bad('SAVE_RULE_STATE_INVALID','危险或颠杯状态越界');
      const revive=s.revive,expectedAssisted=shake.extraUsed>0||revive?.used===1;
      if(!object(revive)||!keys(revive,['used','pendingFailure','committedReceiptId'])||integer(revive.used,0,1)===false)return bad('SAVE_RULE_STATE_INVALID','复活账本无效');
      if(expectedAssisted&&s.boardType!=='assisted'||!expectedAssisted&&s.boardType==='assisted')return bad('SAVE_RULE_STATE_INVALID','辅助局与奖励计数不一致');
      const base=this.runCommon(value);if(!base.valid)return base;
      if(!object(value.spawnRng)||!keys(value.spawnRng,['algorithm','state','drawCount'])||value.spawnRng.algorithm!=='spawn-xorshift32-v1'||!integer(value.spawnRng.state,1,0xffffffff)||!integer(value.spawnRng.drawCount,0,Number.MAX_SAFE_INTEGER)||!object(value.autoDrop)||!keys(value.autoDrop,['nextDueTick','pendingSpawn']))return bad('SAVE_SPAWN_INVALID','自然落料随机流状态无效');
      const motion=this.motionAndAuto(value,s);if(!motion.valid)return motion;
      return ok();
    } catch { return bad('SAVE_RUN_INVALID','运行快照结构无效'); }
  }

  /** Schema-4 run snapshot accepted only as migration input (pre-spill-revive saves). */
  static legacySnapshotV4(value:unknown):Validation {
    try {
      if(!object(value))return bad('SAVE_RUN_HEADER','运行快照结构无效');
      if(!keys(value,[...common,'cupMotion','autoDrop','spawnRng'])||value.saveSchemaVersion!==4||!rulesVersions.includes(String(value.rulesVersion))||value.appVersion!=='0.1.0')return bad('SAVE_RUN_HEADER','运行快照头无效或版本不兼容');
      const s=value as unknown as RunSnapshot,shake=s.shake;
      if(!object(shake)||!keys(shake,['baseUsed','extraGranted','extraUsed','activeStartTick','cooldownUntilTick'])||!integer(shake.baseUsed,0,2)||!integer(shake.extraGranted,0,5)||!integer(shake.extraUsed,0,5)||shake.extraUsed>shake.extraGranted||(shake.activeStartTick!==null&&!integer(shake.activeStartTick,0,s.tick))||!integer(shake.cooldownUntilTick,0))return bad('SAVE_RULE_STATE_INVALID','危险或颠杯状态越界');
      if(shake.extraUsed>0&&s.boardType!=='assisted'||shake.extraUsed===0&&s.boardType==='assisted')return bad('SAVE_RULE_STATE_INVALID','辅助局与额外颠杯计数不一致');
      const base=this.runCommon(value);if(!base.valid)return base;
      if(!object(value.spawnRng)||!keys(value.spawnRng,['algorithm','state','drawCount'])||value.spawnRng.algorithm!=='spawn-xorshift32-v1'||!integer(value.spawnRng.state,1,0xffffffff)||!integer(value.spawnRng.drawCount,0,Number.MAX_SAFE_INTEGER)||!object(value.autoDrop)||!keys(value.autoDrop,['nextDueTick','pendingSpawn']))return bad('SAVE_SPAWN_INVALID','自然落料随机流状态无效');
      const motion=this.motionAndAuto(value,s);if(!motion.valid)return motion;
      return ok();
    } catch { return bad('SAVE_RUN_INVALID','运行快照结构无效'); }
  }

  static legacySnapshot(value:unknown,schema:1|2|3):Validation {
    try {
      if(!object(value))return bad('SAVE_RUN_HEADER','运行快照结构无效');
      const allowed=schema===1?common:[...common,'cupMotion','autoDrop'];
      if(!keys(value,allowed)||value.saveSchemaVersion!==schema||!rulesVersions.includes(String(value.rulesVersion))||value.appVersion!=='0.1.0')return bad('SAVE_RUN_HEADER','运行快照头无效或版本不兼容');
      const s=value as unknown as RunSnapshot,shake=s.shake;
      if(!object(shake)||!keys(shake,['baseUsed','extraUsed','activeStartTick','cooldownUntilTick'])||!integer(shake.baseUsed,0,2)||shake.extraUsed!==0||s.boardType!=='standard'||(shake.activeStartTick!==null&&!integer(shake.activeStartTick,0,s.tick))||!integer(shake.cooldownUntilTick,0))return bad('SAVE_RULE_STATE_INVALID','危险或颠杯状态越界');
      const base=this.runCommon(value);if(!base.valid)return base;
      if(schema>=2){const motion=this.motionAndAuto(value,s);if(!motion.valid)return motion;}
      return ok();
    } catch { return bad('SAVE_RUN_INVALID','运行快照结构无效'); }
  }
}
