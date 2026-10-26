import { _decorator, Canvas, Color, Component, Game, game, Graphics, Input, input, KeyCode, Label, Node, PhysicsSystem2D, UITransform, Vec2, Vec3 } from 'cc';
import { Level } from '../contracts/types';
import { FixedClock } from '../core/Clock';
import { AppRuntime } from '../bootstrap/AppRoot';
import { CocosPhysicsAdapter } from '../physics/CocosPhysicsAdapter';
import { CupGeometry } from '../physics/CupGeometry';
const { ccclass } = _decorator;

@ccclass('PhysicsLab')
export class PhysicsLab extends Component {
  private adapter!: CocosPhysicsAdapter;
  private clock!: FixedClock;
  private world!: Node;
  private visuals = new Map<number, Node>();
  private graphics!: Graphics;
  private diagnostics!: Label;
  private nextEntityId = 1;
  private renderHz = 60;
  private message = '已就绪';
  private gravityProbe: { entityId: number; initialY: number; samples: Set<number> } | null = null;
  private inputBound = false;
  private rebuildGeneration = 0;
  onLoad(): void {
    if (!this.node.getComponent(Canvas)) this.node.addComponent(Canvas);
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(750, 1334);
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.inputBound = true;
    game.on(Game.EVENT_HIDE, this.onBackground, this); game.on(Game.EVENT_SHOW, this.onForeground, this);
  }
  start(): void {
    const rules = AppRuntime.rules;
    if (!rules) { this.message = '配置未加载：请回 Boot 重试'; this.createOverlay(); return; }
    if (!(PhysicsSystem2D.PHYSICS_BOX2D || PhysicsSystem2D.PHYSICS_BOX2D_WASM)) { this.message = '需在 Creator 项目设置启用 2D Box2D 后端'; this.createOverlay(); return; }
    this.world = new Node('PhysicsWorld'); this.node.addChild(this.world);
    this.graphics = this.world.addComponent(Graphics);
    this.adapter = new CocosPhysicsAdapter(this.world, rules, AppRuntime.mapper!); this.adapter.createCup('classic');
    this.clock = new FixedClock(rules.physics.fixed_hz, rules.physics.max_catchup_steps, () => {
      this.adapter.stepFixed(); this.sampleGravity((this.clock?.tick ?? 0) + 1);
    });
    this.createOverlay(); this.drawCup();
    this.message = 'Box2D 已启用';
    this.spawnThree();
  }
  update(dt: number): void {
    if (this.clock && !this.clock.paused) {
      const result = this.clock.update(dt);
      if (result.pausedForBacklog) this.message = '物理落后超过配置补步上限，已暂停；按 R 检查后恢复';
      this.syncViews();
    }
    this.refreshDiagnostics();
  }
  onDestroy(): void {
    this.rebuildGeneration++;
    if (this.inputBound) input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    game.off(Game.EVENT_HIDE, this.onBackground, this); game.off(Game.EVENT_SHOW, this.onForeground, this);
    if (this.adapter) this.adapter.dispose();
  }

  pause(reason = '手动暂停'): void { if (this.clock && !this.clock.paused) { this.clock.pause(); this.message = `已暂停：${reason}`; } }
  resume(): void {
    if (this.clock?.paused && !AppRuntime.backgrounded) { this.clock.resume(); this.message = '已恢复（后台时间未补算）'; }
  }
  clearAndRebuild(): void {
    if (!this.adapter) return;
    const shouldResume = !this.clock.paused;
    const generation = ++this.rebuildGeneration;
    this.clock.pause(); this.disposeViews(); this.adapter.dispose();
    this.world.destroy(); this.world = new Node('PhysicsWorld'); this.node.addChild(this.world);
    this.graphics = this.world.addComponent(Graphics); this.adapter = new CocosPhysicsAdapter(this.world, AppRuntime.rules!, AppRuntime.mapper!);
    this.adapter.createCup('classic'); this.clock.reset(); this.nextEntityId = 1;
    this.drawCup(); this.message = '物理世界已重建';
    if (shouldResume) this.scheduleOnce(() => {
      if (!this.isValid || generation !== this.rebuildGeneration || AppRuntime.backgrounded) return;
      this.clock.resume();
    }, 1 / AppRuntime.rules!.physics.fixed_hz);
  }
  rebuildTwentyTimes(): void {
    if (!this.adapter) return;
    const shouldResume = !this.clock.paused;
    const generation = ++this.rebuildGeneration;
    this.clock.pause();
    let count = 0;
    const rebuild = () => {
      if (!this.isValid || generation !== this.rebuildGeneration) return;
      this.adapter.dispose(); this.disposeViews(); this.world.destroy();
      this.world = new Node('PhysicsWorld'); this.node.addChild(this.world); this.graphics = this.world.addComponent(Graphics);
      this.adapter = new CocosPhysicsAdapter(this.world, AppRuntime.rules!, AppRuntime.mapper!); this.adapter.createCup('classic');
      count++;
      if (count < 20) this.scheduleOnce(rebuild, 1 / AppRuntime.rules!.physics.fixed_hz);
      else {
        this.clock.reset();
        if (shouldResume && !AppRuntime.backgrounded) this.clock.resume();
        this.message = `连续重建20次：实体=${this.adapter.entityCount}，接触=${this.adapter.contactCount}，监听=${this.adapter.listenerCount}`;
        this.drawCup();
      }
    };
    rebuild();
  }
  runSingleFall(): void {
    this.clearAndRebuild(); this.message = '自由落体：1级圆从 y=1130DU 释放，无接触区';
    const entityId = this.spawn(1, 375, 1130); this.adapter.setLinearDampingForTest(entityId, 0);
    this.gravityProbe = { entityId, initialY: 1130, samples: new Set() };
  }
  spawnThree(): void {
    this.clearAndRebuild();
    [1100, 1170, 1240].forEach(y => this.spawn(3, AppRuntime.rules!.cup.center_x_du, y));
    this.message = '三圆堆积试验：同级圆从杯口上方无重叠释放';
  }
  spawnNineSizes(): void {
    this.clearAndRebuild();
    const generation = this.rebuildGeneration;
    const items = AppRuntime.rules!.ingredients.slice().sort((a, b) => a.level - b.level);
    let index = 0; let attempts = 0;
    const dropNext = () => {
      if (!this.isValid || generation !== this.rebuildGeneration) return;
      if (this.clock.paused || AppRuntime.backgrounded) { this.scheduleOnce(dropNext, 0.25); return; }
      if (index >= items.length) { this.message = '九种尺寸试验：九级对象均已依次生成'; return; }
      const item = items[index];
      const minX = AppRuntime.rules!.cup.center_x_du - AppRuntime.rules!.cup.top_width_du / 2;
      const maxX = AppRuntime.rules!.cup.center_x_du + AppRuntime.rules!.cup.top_width_du / 2;
      const candidates = [AppRuntime.rules!.cup.center_x_du, minX + item.radius_du + 4,
        maxX - item.radius_du - 4, AppRuntime.rules!.cup.center_x_du - 70, AppRuntime.rules!.cup.center_x_du + 70];
      const x = candidates.find(value => this.adapter.canSpawn(item.level, value));
      if (x === undefined) {
        attempts++;
        this.message = `九种尺寸试验：等待投放空间（${index + 1}/9）`;
        if (attempts < 120) this.scheduleOnce(dropNext, 0.25);
        else this.message = `九种尺寸试验暂停：第${item.level}级连续无法投放`;
        return;
      }
      this.spawn(item.level, x, AppRuntime.rules!.cup.spawn_y_du);
      index++; attempts = 0;
      this.message = `九种尺寸试验：已生成${index}/9级`;
      this.scheduleOnce(dropNext, 1);
    };
    dropNext();
  }
  pressureTest(): void {
    this.clearAndRebuild();
    const rules = AppRuntime.rules!; const radius = rules.ingredients[0].radius_du;
    const spacing = radius * 2 + 1;
    let count = 0;
    for (let row = 0; row < 20; row++) {
      const y = rules.cup.inner_bottom_y_du + radius + row * spacing;
      const t = (y - rules.cup.inner_bottom_y_du) / (rules.cup.inner_top_y_du - rules.cup.inner_bottom_y_du);
      const width = rules.cup.bottom_width_du + (rules.cup.top_width_du - rules.cup.bottom_width_du) * t;
      const stagger = row % 2 ? spacing / 2 : 0;
      const columns = Math.floor((width - radius * 2 - stagger) / spacing) + 1;
      const firstX = rules.cup.center_x_du - width / 2 + radius + stagger;
      for (let col = 0; col < columns; col++) { this.spawn(1, firstX + col * spacing, y); count++; }
    }
    this.message = `压力堆积：${count}个一级圆，按杯宽逐层填充至近杯口`;
  }
  compareRenderRate(hz: 30 | 60): void { this.renderHz = hz; game.setFrameRate(hz); this.message = `渲染帧率设为${hz}fps；物理仍为${AppRuntime.rules!.physics.fixed_hz}Hz`; }
  private spawn(level: number, xDu: number, yDu: number): number {
    const item = AppRuntime.rules!.ingredients.find(value => value.level === level);
    if (!item) throw new Error(`Unknown level ${level}`);
    const id = this.nextEntityId++;
    this.adapter.createBody({ entityId: id, level: item.level as Level, radiusDu: item.radius_du, positionDu: { x: xDu, y: yDu }, velocityDuPerSecond: { x: 0, y: 0 } });
    const visual = new Node(`IngredientVisual-${id}`); this.world.addChild(visual);
    const g = visual.addComponent(Graphics); g.fillColor = this.colorFor(level); g.strokeColor = new Color(79, 41, 31, 255); g.lineWidth = 3;
    g.circle(0, 0, item.radius_du); g.fill(); g.stroke();
    const labelNode = new Node('LevelLabel'); visual.addChild(labelNode);
    const ui = labelNode.addComponent(UITransform); ui.setContentSize(item.radius_du * 2, item.radius_du * 2);
    const label = labelNode.addComponent(Label); label.string = `${level}`; label.fontSize = Math.max(12, Math.min(25, item.radius_du * 0.7)); label.color = new Color(50, 28, 24, 255);
    this.visuals.set(id, visual);
    return id;
  }
  private sampleGravity(tick: number): void {
    const probe = this.gravityProbe;
    if (!probe || (tick !== 30 && tick !== 60) || probe.samples.has(tick)) return;
    const state = this.adapter.getBody(probe.entityId); if (!state) return;
    probe.samples.add(tick);
    const seconds = tick / AppRuntime.rules!.physics.fixed_hz;
    console.log(JSON.stringify({ test: 'gravity-free-fall', tick, seconds, initialYDu: probe.initialY,
      actualYDu: state.positionDu.y, actualDisplacementDu: probe.initialY - state.positionDu.y,
      actualVelocityDuPerSecond: state.velocityDuPerSecond.y,
      theoreticalDisplacementDu: 0.5 * Math.abs(AppRuntime.rules!.physics.gravity.y) * AppRuntime.rules!.viewport.du_per_spec_physics_unit * seconds * seconds,
      enginePtmRatio: AppRuntime.mapper!.cocosPtmRatio }));
  }
  private syncViews(): void {
    for (const [id, view] of this.visuals) {
      const state = this.adapter.getBody(id);
      if (!state) { view.destroy(); this.visuals.delete(id); continue; }
      view.setPosition(state.positionDu.x - AppRuntime.rules!.viewport.width_du / 2, state.positionDu.y - AppRuntime.rules!.viewport.height_du / 2, 0);
      view.angle = state.angleRadians * 180 / Math.PI;
    }
  }
  private drawCup(): void {
    const rules = AppRuntime.rules!; const cup = rules.cup;
    const shape = CupGeometry.build({ centerXDu: cup.center_x_du, bottomYDu: cup.inner_bottom_y_du, topYDu: cup.inner_top_y_du,
      bottomWidthDu: cup.bottom_width_du, topWidthDu: cup.top_width_du, widthScale: 1 });
    const g = this.graphics; g.clear(); g.lineWidth = 5; g.strokeColor = new Color(70, 46, 35, 255);
    const toLocal = (x: number, y: number) => new Vec2(x - rules.viewport.width_du / 2, y - rules.viewport.height_du / 2);
    g.moveTo(toLocal(shape.leftBottom.x, shape.leftBottom.y).x, toLocal(shape.leftBottom.x, shape.leftBottom.y).y);
    g.lineTo(toLocal(shape.leftTop.x, shape.leftTop.y).x, toLocal(shape.leftTop.x, shape.leftTop.y).y);
    g.moveTo(toLocal(shape.rightBottom.x, shape.rightBottom.y).x, toLocal(shape.rightBottom.x, shape.rightBottom.y).y);
    g.lineTo(toLocal(shape.rightTop.x, shape.rightTop.y).x, toLocal(shape.rightTop.x, shape.rightTop.y).y);
    g.moveTo(toLocal(shape.leftBottom.x, shape.leftBottom.y).x, toLocal(shape.leftBottom.x, shape.leftBottom.y).y);
    g.lineTo(toLocal(shape.rightBottom.x, shape.rightBottom.y).x, toLocal(shape.rightBottom.x, shape.rightBottom.y).y); g.stroke();
    const dangerY = cup.danger_line_y_du - rules.viewport.height_du / 2;
    g.lineWidth = 1; g.strokeColor = new Color(220, 75, 70, 180);
    g.moveTo(-rules.viewport.width_du / 2, dangerY); g.lineTo(rules.viewport.width_du / 2, dangerY); g.stroke();
  }
  private createOverlay(): void {
    if (!this.node.isValid || this.diagnostics?.node.isValid) return;
    const overlay = new Node('PhysicsLabDiagnostics'); this.node.addChild(overlay);
    const ui = overlay.addComponent(UITransform); ui.setContentSize(720, 260);
    this.diagnostics = overlay.addComponent(Label); this.diagnostics.fontSize = 18; this.diagnostics.lineHeight = 23;
    overlay.setPosition(new Vec3(-8, 535, 0));
  }
  private refreshDiagnostics(): void {
    if (!this.diagnostics?.isValid) return;
    const tick = this.clock?.tick ?? 0; const entities = this.adapter?.entityCount ?? 0;
    this.diagnostics.string = `PhysicsLab · ${this.message}\nTick ${tick} | 实体 ${entities} | 接触 ${this.adapter?.contactCount ?? 0} | 监听 ${this.adapter?.listenerCount ?? 0} | 渲染 ${this.renderHz}fps / 物理 60Hz\n[1]单圆 [2]三圆 [3]九尺寸 [4]压力 [5]30fps [6]60fps [P]暂停 [R]恢复 [C]重建 [X]重建20次`;
  }
  private disposeViews(): void { for (const node of this.visuals.values()) if (node.isValid) node.destroy(); this.visuals.clear(); }
  private colorFor(level: number): Color {
    const palette = [new Color(244, 193, 131), new Color(187, 104, 77), new Color(224, 171, 124), new Color(221, 203, 167), new Color(237, 195, 118), new Color(81, 111, 72), new Color(245, 208, 151), new Color(183, 141, 190), new Color(246, 226, 192)];
    return palette[level - 1] ?? Color.WHITE;
  }
  private onBackground(): void { AppRuntime.backgrounded = true; this.pause('切至后台'); }
  private onForeground(): void { AppRuntime.backgrounded = false; }
  private onKeyDown(event: any): void {
    switch (event.keyCode) {
      case KeyCode.DIGIT_1: this.runSingleFall(); break; case KeyCode.DIGIT_2: this.spawnThree(); break;
      case KeyCode.DIGIT_3: this.spawnNineSizes(); break; case KeyCode.DIGIT_4: this.pressureTest(); break;
      case KeyCode.DIGIT_5: this.compareRenderRate(30); break; case KeyCode.DIGIT_6: this.compareRenderRate(60); break;
      case KeyCode.KEY_P: this.pause(); break; case KeyCode.KEY_R: this.resume(); break;
      case KeyCode.KEY_C: this.clearAndRebuild(); break; case KeyCode.KEY_X: this.rebuildTwentyTimes(); break;
    }
  }
}
