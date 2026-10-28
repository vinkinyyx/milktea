import { _decorator, Canvas, Component, Input, input, JsonAsset, Label, Node, resources, UITransform, Vec2, Vec3, director, PhysicsSystem2D, PHYSICS_2D_PTM_RATIO } from 'cc';
import { ConfigLoader, RulesConfig } from '../core/ConfigLoader';
import { HostLifecycleCoordinator } from '../core/HostLifecycleCoordinator';
import { CoordinateMapper } from '../physics/CoordinateMapper';
import { configureViewport } from './Viewport';
const { ccclass } = _decorator;

export class AppRuntime {
  static readonly buildId = '20261029-p1a-final-14';
  static rules: Readonly<RulesConfig> | null = null;
  static mapper: CoordinateMapper | null = null;
  static loadError: string | null = null;
  static startupInProgress = false;
  static startupToken = 0;
  static startupSequence = 0;
  static get backgrounded(): boolean { return HostLifecycleCoordinator.backgrounded; }
}

@ccclass('AppRoot')
export class AppRoot extends Component {
  private retryNode: Node | null = null;
  private loadGeneration = 0;
  private loading = false;
  private startupToken = 0;
  private sceneTransition = false;
  onLoad(): void {
    if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(750, 1334);
    // The error screen must have a camera and usable coordinate space even when configuration cannot load.
    configureViewport(this.node, { width_du: 750, height_du: 1334 });
    HostLifecycleCoordinator.install();
    (globalThis as any).__p1aLifecycle = { snapshot: () => HostLifecycleCoordinator.snapshot() };
    input.on(Input.EventType.TOUCH_END, this.onRetryTouch, this);
    this.loadConfiguration();
  }
  onDestroy(): void {
    this.loadGeneration++; input.off(Input.EventType.TOUCH_END, this.onRetryTouch, this);
    if (this.loading && !this.sceneTransition) resources.release('config/design-baseline', JsonAsset);
    if (!this.sceneTransition && this.startupToken !== 0 && AppRuntime.startupToken === this.startupToken) {
      AppRuntime.startupInProgress = false; AppRuntime.startupToken = 0;
    }
  }
  retry(): void { this.loadConfiguration(); }
  private onRetryTouch(): void { if (this.retryNode?.isValid) this.retry(); }
  private loadConfiguration(): void {
    if (this.loading || AppRuntime.startupInProgress) return;
    this.loading = true; AppRuntime.startupInProgress = true;
    this.startupToken = ++AppRuntime.startupSequence; AppRuntime.startupToken = this.startupToken;
    AppRuntime.rules = null; AppRuntime.mapper = null; AppRuntime.loadError = null;
    const generation = ++this.loadGeneration;
    resources.load('config/design-baseline', JsonAsset, (error, asset) => {
      if (generation !== this.loadGeneration || !this.isValid || AppRuntime.startupToken !== this.startupToken) return;
      if (error || !asset) {
        resources.release('config/design-baseline', JsonAsset);
        this.finishStartup(this.startupToken); this.showError(`配置读取失败：${error?.message ?? '资源缺失'}`); return;
      }
      const result = ConfigLoader.validate(asset.json);
      if (!result.ok) {
        // A retry must not reuse the invalid JsonAsset cached by the resource bundle.
        resources.release('config/design-baseline', JsonAsset);
        this.finishStartup(this.startupToken); this.showError(`配置校验失败：${result.error.message}`); return;
      }
      configureViewport(this.node, result.data.viewport);
      AppRuntime.rules = result.data; this.retryNode?.destroy(); this.retryNode = null;
      const mapper = AppRuntime.mapper = new CoordinateMapper(result.data.viewport.width_du, result.data.viewport.height_du,
        result.data.viewport.du_per_spec_physics_unit, PHYSICS_2D_PTM_RATIO);
      const physics = PhysicsSystem2D.instance;
      physics.autoSimulation = false; physics.fixedTimeStep = 1 / result.data.physics.fixed_hz;
      physics.resetAccumulator(0);
      physics.allowSleep = result.data.physics.sleep;
      physics.velocityIterations = result.data.physics.velocity_iterations; physics.positionIterations = result.data.physics.position_iterations;
      if (!(PhysicsSystem2D.PHYSICS_BOX2D || PhysicsSystem2D.PHYSICS_BOX2D_WASM)) {
        this.finishStartup(this.startupToken); this.showError('未启用2D Box2D：请在项目设置→功能裁剪中启用后重试'); return;
      }
      physics.gravity = new Vec2(mapper.specAccelerationToCocosGravityApi(result.data.physics.gravity.x),
        mapper.specAccelerationToCocosGravityApi(result.data.physics.gravity.y));
      this.sceneTransition = true;
      const token = this.startupToken;
      const accepted = director.loadScene('PhysicsLab', loadError => {
        if (AppRuntime.startupToken !== token) return;
        AppRuntime.startupInProgress = false; AppRuntime.startupToken = 0;
        if (loadError && this.isValid) {
          this.sceneTransition = false; this.loading = false; AppRuntime.rules = null; AppRuntime.mapper = null;
          this.showError(`试验场景切换失败：${loadError.message}`);
        }
      });
      if (!accepted && AppRuntime.startupToken === token) {
        this.sceneTransition = false; AppRuntime.rules = null; AppRuntime.mapper = null;
        this.finishStartup(token); this.showError('试验场景切换未启动：未找到PhysicsLab场景');
      }
    });
  }
  private showError(message: string): void {
    AppRuntime.loadError = message;
    if (this.retryNode?.isValid) this.retryNode.destroy();
    const root = this.retryNode = new Node('ConfigErrorRetry'); this.node.addChild(root);
    const ui = root.addComponent(UITransform); ui.setContentSize(700, 220);
    const label = root.addComponent(Label); label.string = '配置加载或校验失败\n点击画面重试'; label.fontSize = 28; label.lineHeight = 40;
    label.overflow = Label.Overflow.CLAMP; label.enableWrapText = true;
    console.error(message);
    root.setPosition(new Vec3(0, 0, 0));
  }
  private finishStartup(token: number): void {
    if (AppRuntime.startupToken !== token) return;
    this.loading = false; AppRuntime.startupInProgress = false; AppRuntime.startupToken = 0; this.startupToken = 0;
  }
}
