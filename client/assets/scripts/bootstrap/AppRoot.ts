import { _decorator, Canvas, Component, Game, game, JsonAsset, Label, Node, resources, UITransform, Vec2, Vec3, director, PhysicsSystem2D, PHYSICS_2D_PTM_RATIO } from 'cc';
import { ConfigLoader, RulesConfig } from '../core/ConfigLoader';
import { CoordinateMapper } from '../physics/CoordinateMapper';
const { ccclass } = _decorator;

export class AppRuntime {
  static rules: Readonly<RulesConfig> | null = null;
  static mapper: CoordinateMapper | null = null;
  static loadError: string | null = null;
  static backgrounded = false;
}

@ccclass('AppRoot')
export class AppRoot extends Component {
  private retryNode: Node | null = null;
  private loadGeneration = 0;
  onLoad(): void {
    if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(750, 1334);
    game.on(Game.EVENT_HIDE, this.onHide, this); game.on(Game.EVENT_SHOW, this.onShow, this);
    this.loadConfiguration();
  }
  onDestroy(): void { this.loadGeneration++; game.off(Game.EVENT_HIDE, this.onHide, this); game.off(Game.EVENT_SHOW, this.onShow, this); }
  retry(): void { this.loadConfiguration(); }
  private loadConfiguration(): void {
    AppRuntime.rules = null; AppRuntime.mapper = null; AppRuntime.loadError = null;
    const generation = ++this.loadGeneration;
    resources.load('config/design-baseline', JsonAsset, (error, asset) => {
      if (generation !== this.loadGeneration || !this.isValid) return;
      if (error || !asset) { this.showError(`配置读取失败：${error?.message ?? '资源缺失'}`); return; }
      const result = ConfigLoader.validate(asset.json);
      if (!result.ok) { this.showError(`配置校验失败：${result.error.message}`); return; }
      AppRuntime.rules = result.data; this.retryNode?.destroy(); this.retryNode = null;
      AppRuntime.mapper = new CoordinateMapper(result.data.viewport.width_du, result.data.viewport.height_du,
        result.data.viewport.du_per_spec_physics_unit, PHYSICS_2D_PTM_RATIO);
      const physics = PhysicsSystem2D.instance;
      physics.autoSimulation = false; physics.fixedTimeStep = 1 / result.data.physics.fixed_hz;
      physics.resetAccumulator(0);
      physics.allowSleep = result.data.physics.sleep;
      physics.velocityIterations = result.data.physics.velocity_iterations; physics.positionIterations = result.data.physics.position_iterations;
      if (!(PhysicsSystem2D.PHYSICS_BOX2D || PhysicsSystem2D.PHYSICS_BOX2D_WASM)) {
        this.showError('未启用2D Box2D：请在项目设置→功能裁剪中启用后重试'); return;
      }
      physics.gravity = new Vec2(mapper.specAccelerationToCocosGravityApi(result.data.physics.gravity.x),
        mapper.specAccelerationToCocosGravityApi(result.data.physics.gravity.y));
      director.loadScene('PhysicsLab');
    });
  }
  private showError(message: string): void {
    AppRuntime.loadError = message;
    if (this.retryNode?.isValid) this.retryNode.destroy();
    const root = this.retryNode = new Node('ConfigErrorRetry'); this.node.addChild(root);
    const ui = root.addComponent(UITransform); ui.setContentSize(700, 220);
    const label = root.addComponent(Label); label.string = `${message}\n点击画面重试配置加载`; label.fontSize = 28; label.lineHeight = 40;
    root.setPosition(new Vec3(0, 0, 0)); root.on(Node.EventType.TOUCH_END, this.retry, this);
  }
  private onHide(): void { AppRuntime.backgrounded = true; }
  private onShow(): void { AppRuntime.backgrounded = false; /* resume is explicit; never accrue background delta */ }
}
