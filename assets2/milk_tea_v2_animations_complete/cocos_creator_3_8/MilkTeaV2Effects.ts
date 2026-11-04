/**
 * 奶茶挤挤 V2.0 动效控制器 / Cocos Creator 3.8 TypeScript integration example.
 * 重要：本类仅做视觉反馈，不负责碰撞判定、合成结算、物理驱动及广告逻辑。
 * 所有传入的 ingredient 节点应该是【视觉子节点】，不要直接缩放含 Rigidbody2D/Collider2D 的父节点。
 */
import { _decorator, Component, Node, Label, UIOpacity, Vec3, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

const easingFast = 'cubicOut' as const;
const cloneScale = (n: Node): Vec3 => n.scale.clone();
const scaleMul = (base: Vec3, x: number, y = x): Vec3 => new Vec3(base.x * x, base.y * y, base.z);

function opacityOf(node: Node): UIOpacity {
    let o = node.getComponent(UIOpacity);
    if (!o) o = node.addComponent(UIOpacity);
    return o;
}

@ccclass('MilkTeaV2Effects')
export class MilkTeaV2Effects extends Component {
    @property({ type: Node, tooltip: '仅美术杯节点，严禁传入负责真实物理运动的父节点' })
    public cupVisual: Node | null = null;

    @property({ type: Node })
    public dangerLineVisual: Node | null = null;

    @property({ type: Node })
    public catVisual: Node | null = null;

    @property({ type: Node })
    public catPawPivot: Node | null = null;

    @property({ type: Node })
    public comboRoot: Node | null = null;

    @property({ type: Label })
    public comboLabel: Label | null = null;

    @property({ type: Label })
    public scoreLabel: Label | null = null;

    @property({ type: [Node] })
    public resultStars: Node[] = [];

    @property({ tooltip: '勾选后将停用装饰性震动与大范围运动；应同时在游戏设置里持久化此选项。' })
    public reducedMotion = false;

    /** 01. 真实物理落地事件后调用；仅给小料 Sprite 节点压缩反馈。 */
    public playDropLanding(ingredientVisual: Node): void {
        Tween.stopAllByTarget(ingredientVisual);
        if (this.reducedMotion) return;
        const s = cloneScale(ingredientVisual);
        tween(ingredientVisual)
            .to(0.065, { scale: scaleMul(s, 1.16, 0.83) }, { easing: 'sineOut' })
            .to(0.15, { scale: s }, { easing: 'backOut' })
            .start();
    }

    /** 02. 两颗食材真实接触时调用；只缩放对应视觉层。 */
    public playCollision(left: Node, right: Node): void {
        if (this.reducedMotion) return;
        for (const n of [left, right]) {
            Tween.stopAllByTarget(n);
            const s = cloneScale(n);
            tween(n)
                .to(0.06, { scale: scaleMul(s, 1.13, 0.90) })
                .to(0.10, { scale: s }, { easing: 'backOut' })
                .start();
        }
    }

    /** 03. 两旧料消失+新料弹出：需在真正合成逻辑成立后触发。
     * 视觉子节点可为临时克隆；逻辑层应保证合成原子性、碰撞体正确替换，完成后销毁临时克隆。
     */
    public playMerge(oldA: Node, oldB: Node, result: Node, onFinish?: () => void): void {
        const a = opacityOf(oldA), b = opacityOf(oldB), r = opacityOf(result);
        a.opacity = b.opacity = 255;
        r.opacity = 0;
        const sA = cloneScale(oldA), sB = cloneScale(oldB), sR = cloneScale(result);
        result.setScale(scaleMul(sR, 0.5));
        const mergeTime = this.reducedMotion ? 0.05 : 0.11;
        for (const [n, opacity, s] of [[oldA, a, sA], [oldB, b, sB]] as Array<[Node, UIOpacity, Vec3]>) {
            Tween.stopAllByTarget(n); Tween.stopAllByTarget(opacity);
            tween(n).to(mergeTime, { scale: scaleMul(s, 0.55) }).start();
            tween(opacity).to(mergeTime, { opacity: 0 }).start();
        }
        this.scheduleOnce(() => {
            r.opacity = 255;
            tween(result)
                .to(this.reducedMotion ? 0.06 : 0.13, { scale: scaleMul(sR, 1.12) }, { easing: 'backOut' })
                .to(this.reducedMotion ? 0.01 : 0.09, { scale: sR }, { easing: easingFast })
                .call(() => { if (onFinish) onFinish(); })
                .start();
        }, mergeTime);
    }

    /** 04. 连击数字：数据源仍然是游戏本身的连击计数。 */
    public playCombo(count: number): void {
        if (!this.comboRoot || !this.comboLabel) return;
        this.comboLabel.string = `连击 ×${Math.max(2, Math.floor(count))}`;
        const n = this.comboRoot;
        const s = cloneScale(n);
        Tween.stopAllByTarget(n);
        n.active = true;
        if (this.reducedMotion) return;
        n.setScale(scaleMul(s, 0.72));
        tween(n).to(0.15, { scale: scaleMul(s, 1.16) }, { easing: 'backOut' })
            .to(0.12, { scale: s }, { easing: easingFast }).start();
    }

    /** 05. 杯体视觉回摆：真实晃杯碰撞应由游戏物理引擎单独驱动。 */
    public playCupShake(): void {
        const n = this.cupVisual;
        if (!n || this.reducedMotion) return;
        Tween.stopAllByTarget(n);
        const initial = n.angle;
        tween(n)
            .to(0.11, { angle: initial - 7 }, { easing: 'sineOut' })
            .to(0.16, { angle: initial + 6 }, { easing: 'sineInOut' })
            .to(0.18, { angle: initial - 4 })
            .to(0.18, { angle: initial + 2 })
            .to(0.17, { angle: initial }, { easing: 'sineOut' })
            .start();
    }

    /** 06. 危险线：按真实危险线判定开启；闪烁频率约1.1Hz，低于2Hz。 */
    public setDangerActive(active: boolean): void {
        const n = this.dangerLineVisual;
        if (!n) return;
        const o = opacityOf(n);
        Tween.stopAllByTarget(o);
        if (!active) {
            o.opacity = 0;
            return;
        }
        n.active = true;
        if (this.reducedMotion) { o.opacity = 230; return; }
        o.opacity = 255;
        tween(o).repeatForever(
            tween(o).to(0.45, { opacity: 115 }).to(0.45, { opacity: 255 })
        ).start();
    }

    /** 07. UI按钮按下、松开：由 Button touch start/end/cancel 调用。 */
    public setButtonDown(buttonVisual: Node, pressed: boolean): void {
        if (this.reducedMotion) return;
        const n = buttonVisual;
        Tween.stopAllByTarget(n);
        // 若节点本身非 1 倍缩放，项目应记录其基础缩放并传给本方法改造。
        const target = pressed ? new Vec3(0.94, 0.94, 1) : new Vec3(1, 1, 1);
        tween(n).to(pressed ? 0.08 : 0.12, { scale: target }, { easing: pressed ? easingFast : 'backOut' }).start();
    }

    /** 08. 结算数字与星星：仅显示真实分数，不生成奖励或游戏货币。 */
    public playResult(score: number, earnedStars: number): void {
        const safeScore = Math.max(0, Math.floor(score));
        if (this.scoreLabel) {
            const label = this.scoreLabel;
            if (this.reducedMotion) label.string = safeScore.toLocaleString('en-US');
            else {
                const state = { value: 0 };
                tween(state).to(0.72, { value: safeScore }, {
                    easing: easingFast,
                    onUpdate: () => { label.string = Math.floor(state.value).toLocaleString('en-US'); },
                }).start();
            }
        }
        this.resultStars.forEach((star, i) => {
            star.active = i < earnedStars;
            if (i >= earnedStars || this.reducedMotion) return;
            const s = cloneScale(star);
            star.setScale(scaleMul(s, 0.15));
            this.scheduleOnce(() => tween(star).to(0.19, { scale: scaleMul(s, 1.15) }, { easing: 'backOut' })
                .to(0.08, { scale: s }).start(), 0.18 + i * 0.17);
        });
    }

    /** 09. 猫咪动画：当前预览为整身轻动；若有分层前爪节点可额外挥爪。 */
    public playCatCelebrate(): void {
        const n = this.catVisual;
        if (!n || this.reducedMotion) return;
        Tween.stopAllByTarget(n);
        const initial = n.angle;
        tween(n).to(0.22, { angle: initial - 3 })
            .to(0.24, { angle: initial + 3 })
            .to(0.26, { angle: initial }).start();
        const paw = this.catPawPivot;
        if (paw) {
            Tween.stopAllByTarget(paw);
            const p = paw.angle;
            tween(paw).to(0.18, { angle: p + 15 })
                .to(0.2, { angle: p - 8 })
                .to(0.2, { angle: p }).start();
        }
    }

    /** 10. 页面淡入：pageRoot 由UI负责激活；不会替代页面管理器和操作阻断。 */
    public playPageEnter(pageRoot: Node): void {
        Tween.stopAllByTarget(pageRoot);
        pageRoot.active = true;
        const initial = pageRoot.position.clone();
        const o = opacityOf(pageRoot);
        Tween.stopAllByTarget(o);
        if (this.reducedMotion) { o.opacity = 255; return; }
        pageRoot.setPosition(initial.x, initial.y - 34, initial.z);
        o.opacity = 0;
        tween(pageRoot).to(0.36, { position: initial }, { easing: 'backOut' }).start();
        tween(o).to(0.30, { opacity: 255 }).start();
    }
}
