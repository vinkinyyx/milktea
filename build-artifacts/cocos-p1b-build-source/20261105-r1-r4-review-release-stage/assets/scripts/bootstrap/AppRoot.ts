import { _decorator, Canvas, Color, Component, Graphics, Input, input, JsonAsset, Label, Node, resources, Sprite, SpriteFrame, Texture2D, UITransform, Vec2, Vec3, PhysicsSystem2D, PHYSICS_2D_PTM_RATIO } from 'cc';
import { ConfigLoader, RulesConfig } from '../core/ConfigLoader';
import { HostLifecycleCoordinator } from '../core/HostLifecycleCoordinator';
import { CoordinateMapper } from '../physics/CoordinateMapper';
import { configureViewport, presentationSize } from './Viewport';
import { GameRoot } from '../presentation/GameRoot';
import { AppRuntime } from '../core/AppRuntime';
export { AppRuntime } from '../core/AppRuntime';
const { ccclass } = _decorator;

@ccclass('AppRoot')
export class AppRoot extends Component {
  private retryNode: Node | null = null;
  private loadGeneration = 0;
  private loading = false;
  private startupToken = 0;
  private startupFrame: Node | null = null;
  private sceneTransition = false;
  onLoad(): void {
    if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(750, 1334);
    // The error screen must have a camera and usable coordinate space even when configuration cannot load.
    configureViewport(this.node, { width_du: 750, height_du: 1334 });
    HostLifecycleCoordinator.install();
    this.showBrandFrame();
    
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
  private showBrandFrame():void {
    const root=this.startupFrame=new Node('MilkTeaStartupFrame');this.node.addChild(root);root.setSiblingIndex(0);
    const transform=root.addComponent(UITransform);transform.setContentSize(750,1334);
    const size=presentationSize(),background=root.addComponent(Graphics);background.fillColor=new Color(255,244,225);background.rect(-size.width/2,-size.height/2,size.width,size.height);background.fill();
    const labelNode=new Node('BrandFallback');root.addChild(labelNode);labelNode.addComponent(UITransform).setContentSize(650,150);labelNode.setPosition(0,190,0);
    const label=labelNode.addComponent(Label);label.string='奶茶挤挤';label.fontSize=82;label.lineHeight=94;label.isBold=true;label.color=new Color(103,58,32);
    resources.load('startup/brand-logo/texture',Texture2D,(error,texture)=>{if(!this.isValid||this.startupFrame!==root||!root.isValid||!root.activeInHierarchy)return;if(error||!texture){console.warn(`Startup logo unavailable; using text fallback: ${error?.message??'missing asset'}`);return;}const frame=new SpriteFrame();frame.texture=texture;frame.packable=false;root.once(Node.EventType.NODE_DESTROYED,()=>{if(frame.isValid)frame.destroy();});const logoNode=new Node('BrandLogo');root.addChild(logoNode);logoNode.addComponent(UITransform).setContentSize(620,218);logoNode.setPosition(0,190,0);const sprite=logoNode.addComponent(Sprite);sprite.spriteFrame=frame;labelNode.active=false;});
    const taglineNode=new Node('BrandTagline');root.addChild(taglineNode);taglineNode.addComponent(UITransform).setContentSize(690,80);taglineNode.setPosition(0,20,0);
    const tagline=taglineNode.addComponent(Label);tagline.string='接住小料，挤出好心情';tagline.fontSize=30;tagline.lineHeight=40;tagline.color=new Color(103,58,32);
    const phaseNode=new Node('BrandPhase');root.addChild(phaseNode);phaseNode.addComponent(UITransform).setContentSize(690,70);phaseNode.setPosition(0,-360,0);
    const phase=phaseNode.addComponent(Label);phase.string='准备杯子';phase.fontSize=24;phase.lineHeight=32;phase.color=new Color(145,92,57);
  }
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
      const token = this.startupToken;
      
      try { this.node.addComponent(GameRoot); this.finishStartup(token); }
        catch (error) { this.finishStartup(token); this.showError(`玩家界面初始化失败：${String(error)}`); }
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
    const ready=(globalThis as any).__milkteaBootReady;if(typeof ready==='function')ready();
  }
}

