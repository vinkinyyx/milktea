import {renderSkeleton} from '../P3-A_V1/engine/gen_skeleton.mjs';
import {renderLockedOverlay} from '../P3-A_V1/engine/gen_locked_overlay.mjs';
import {renderErrorEmpty} from '../P3-A_V1/engine/gen_error_empty.mjs';
const calls=[];
const ctx={save(){calls.push('save')},restore(){calls.push('restore')},beginPath(){calls.push('path')},roundRect(...a){calls.push(['rect',...a])},fill(){calls.push('fill')},fillText(...a){calls.push(['text',...a])},set fillStyle(v){this._fill=v},get fillStyle(){return this._fill},set font(v){this._font=v},set textAlign(v){this._align=v}};
renderSkeleton(ctx,10,20,300,360,0);renderLockedOverlay(ctx,10,20,300,360,.4);renderErrorEmpty(ctx,10,20,300,360,{message:'网络异常'});
if(calls.filter(x=>x==='save').length!==3 || calls.filter(x=>x==='restore').length!==3 || calls.filter(x=>x==='fill').length!==6)throw Error('unbalanced render state');
console.log('PASS P3-A 3 modules Canvas smoke: 3 save/restore and 6 fills');
