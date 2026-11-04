/** 纯调用示例；按你的真实游戏模块接线，不要直接把这里当新玩法。 */
import { _decorator, Component, Node } from 'cc';
import { MilkTeaV2Effects } from './MilkTeaV2Effects';
const { ccclass, property } = _decorator;
@ccclass('Example_Animation_Events')
export class Example_Animation_Events extends Component {
    @property({type: MilkTeaV2Effects}) effects: MilkTeaV2Effects | null = null;
    // 在原有物理 collision callback 触发时：
    public onLanding(spriteVisual: Node): void { this.effects?.playDropLanding(spriteVisual); }
    public onTouchTwoIngredients(aVisual: Node, bVisual: Node): void { this.effects?.playCollision(aVisual,bVisual); }
    // 合成业务判断已完成后，旧视觉需由外部清理：
    public onActualMerge(aVisual: Node,bVisual:Node,newVisual: Node, comboCount: number): void {
        this.effects?.playMerge(aVisual,bVisual,newVisual,()=>{
            // 本处仅处置临时动画克隆；若 a/b 是真实游戏节点，改由原订单/物理管理器处理。
            this.effects?.playCombo(comboCount);
        });
    }
    public onActualShakeUsed(): void { this.effects?.playCupShake(); }
    public onWarningStateChanged(active: boolean): void { this.effects?.setDangerActive(active); }
    public onResultsConfirmed(score:number,stars:number):void { this.effects?.playResult(score,stars); }
}
