import { BoxCollider2D, CircleCollider2D, Collider2D, Contact2DType, ERigidBody2DType, IPhysics2DContact, Node, PhysicsMaterial, PhysicsSystem2D, RigidBody2D, Size, Vec2 } from 'cc';
import { BodyDefinition, ContactPair, IngredientState, IPhysicsAdapter, PhysicalBodyState, StageId } from '../contracts/types';
import { RulesConfig } from '../core/ConfigLoader';
import { CoordinateMapper } from './CoordinateMapper';
import { CupGeometry } from './CupGeometry';

interface BodyRef { node: Node; body: RigidBody2D; collider: CircleCollider2D; radiusDu: number }

/** Physics only. Render children are owned by PhysicsLab and follow these nodes. */
export class CocosPhysicsAdapter implements IPhysicsAdapter {
  private readonly bodies = new Map<number, BodyRef>();
  private readonly activeContacts = new Map<string, ContactPair>();
  private readonly staticNodes: Node[] = [];
  private readonly listenerDisposers: Array<() => void> = [];
  private disposed = false;
  private cupShape: ReturnType<typeof CupGeometry.build> | null = null;
  private readonly material: PhysicsMaterial;
  constructor(private readonly root: Node, private readonly rules: RulesConfig, private readonly mapper: CoordinateMapper) {
    this.material = new PhysicsMaterial();
    this.material.friction = rules.physics.friction;
    this.material.restitution = rules.physics.restitution;
  }
  get entityCount(): number { return this.bodies.size; }
  get contactCount(): number { return this.activeContacts.size; }
  get listenerCount(): number { return this.listenerDisposers.length; }

  createCup(stageId: StageId): void {
    this.assertAlive(); this.destroyCup();
    const scale = this.rules.stages.find(s => s.id === stageId)?.cup_width_scale;
    if (scale === undefined) throw new Error(`Unknown stage: ${stageId}`);
    const cup = this.rules.cup;
    this.cupShape = CupGeometry.build({ centerXDu: cup.center_x_du, bottomYDu: cup.inner_bottom_y_du,
      topYDu: cup.inner_top_y_du, bottomWidthDu: cup.bottom_width_du, topWidthDu: cup.top_width_du, widthScale: scale });
    for (let segmentIndex = 0; segmentIndex < this.cupShape.segments.length; segmentIndex++) {
      const segment = this.cupShape.segments[segmentIndex];
      const node = new Node(`CupBoundary-${segment.kind}`); this.root.addChild(node);
      node.setPosition(this.mapper.duToCocosWorld(segment.center.x - this.rules.viewport.width_du / 2),
        this.mapper.duToCocosWorld(segment.center.y - this.rules.viewport.height_du / 2), 0);
      node.angle = segment.angleDeg;
      const body = node.addComponent(RigidBody2D); body.type = ERigidBody2DType.Static; body.enabledContactListener = true;
      const collider = node.addComponent(BoxCollider2D); collider.size = new Size(this.mapper.duToCocosWorld(segment.lengthDu), this.mapper.duToCocosWorld(segment.thicknessDu));
      collider.material = this.material; collider.apply(); this.staticNodes.push(node);
      this.installContacts(collider, null, `listener:cup:${segmentIndex}`);
    }
  }

  createBody(definition: BodyDefinition): void {
    this.assertAlive();
    if (this.bodies.has(definition.entityId)) throw new Error(`Entity ${definition.entityId} already exists`);
    const item = this.rules.ingredients.find(i => i.level === definition.level);
    if (!item || Math.abs(item.radius_du - definition.radiusDu) > 1e-8) throw new Error(`Level/radius mismatch for entity ${definition.entityId}`);
    if (![definition.positionDu.x, definition.positionDu.y, definition.velocityDuPerSecond.x, definition.velocityDuPerSecond.y].every(Number.isFinite)) throw new Error('Body state must be finite');
    const node = new Node(`Ingredient-${definition.entityId}`); this.root.addChild(node);
    node.setPosition(this.mapper.duToCocosWorld(definition.positionDu.x - this.rules.viewport.width_du / 2),
      this.mapper.duToCocosWorld(definition.positionDu.y - this.rules.viewport.height_du / 2), 0);
    const body = node.addComponent(RigidBody2D); body.type = ERigidBody2DType.Dynamic; body.enabledContactListener = true;
    body.linearDamping = this.rules.physics.linear_damping; body.angularDamping = this.rules.physics.angular_damping;
    body.allowSleep = this.rules.physics.sleep; body.awakeOnLoad = true;
    const collider = node.addComponent(CircleCollider2D); collider.radius = this.mapper.duToCocosWorld(definition.radiusDu);
    collider.density = this.rules.physics.density_relative; collider.material = this.material; collider.apply();
    body.linearVelocity = new Vec2(this.mapper.duVelocityToBox2D(definition.velocityDuPerSecond.x), this.mapper.duVelocityToBox2D(definition.velocityDuPerSecond.y));
    this.bodies.set(definition.entityId, { node, body, collider, radiusDu: definition.radiusDu });
    this.installContacts(collider, definition.entityId);
  }

  destroyBody(entityId: number): void {
    const ref = this.bodies.get(entityId); if (!ref) return;
    this.removeListener(`listener:${entityId}`); this.removeContactsFor(entityId);
    this.bodies.delete(entityId); ref.node.destroy();
  }
  stepFixed(): void {
    this.assertAlive();
    const physics = PhysicsSystem2D.instance;
    physics.physicsWorld.syncSceneToPhysics();
    physics.step(1 / this.rules.physics.fixed_hz);
    physics.physicsWorld.syncPhysicsToScene();
    for (const ref of this.bodies.values()) {
      const v = ref.body.linearVelocity; const speed = Math.hypot(v.x, v.y);
      const speedDu = this.mapper.box2DVelocityToDu(speed);
      const maxDu = this.rules.physics.max_linear_speed * this.rules.viewport.du_per_spec_physics_unit;
      if (speedDu > maxDu) {
        const scale = maxDu / speedDu;
        ref.body.linearVelocity = new Vec2(v.x * scale, v.y * scale);
      }
      const angularLimit = this.rules.physics.max_angular_speed;
      if (Math.abs(ref.body.angularVelocity) > angularLimit) ref.body.angularVelocity = Math.sign(ref.body.angularVelocity) * angularLimit;
    }
  }
  applyHorizontalAcceleration(entityId: number, accelerationSpecUnits: number): void {
    const ref = this.bodies.get(entityId); if (!ref) return;
    const accelerationDu = accelerationSpecUnits * this.rules.viewport.du_per_spec_physics_unit;
    const accelerationBox2D = this.mapper.duAccelerationToBox2D(accelerationDu);
    ref.body.applyForceToCenter(new Vec2(accelerationBox2D * ref.body.getMass(), 0), true);
  }
  getContacts(): readonly ContactPair[] { return Array.from(this.activeContacts.values(), c => ({ ...c })); }
  setLinearDampingForTest(entityId: number, damping: number): void {
    const ref = this.bodies.get(entityId); if (!ref) throw new Error(`Unknown entity ${entityId}`);
    if (!Number.isFinite(damping) || damping < 0) throw new Error('damping must be finite and non-negative');
    ref.body.linearDamping = damping;
  }
  getBody(entityId: number): PhysicalBodyState | undefined {
    const ref = this.bodies.get(entityId); if (!ref) return undefined;
    const pos = ref.node.position; const v = ref.body.linearVelocity;
    return { entityId, positionDu: { x: this.mapper.cocosWorldToDu(pos.x) + this.rules.viewport.width_du / 2,
      y: this.mapper.cocosWorldToDu(pos.y) + this.rules.viewport.height_du / 2 },
      velocityDuPerSecond: { x: this.mapper.box2DVelocityToDu(v.x), y: this.mapper.box2DVelocityToDu(v.y) }, angleRadians: ref.node.angle * Math.PI / 180,
      angularVelocity: ref.body.angularVelocity, sleeping: !ref.body.isAwake() };
  }
  restoreBodies(states: readonly IngredientState[]): void {
    for (const id of Array.from(this.bodies.keys())) this.destroyBody(id);
    for (const s of states) {
      const def = this.rules.ingredients.find(i => i.level === s.level);
      if (!def) throw new Error(`Unknown level ${s.level}`);
      this.createBody({ entityId: s.entityId, level: s.level, radiusDu: def.radius_du, positionDu: s.positionDu, velocityDuPerSecond: s.velocityDuPerSecond });
      const ref = this.bodies.get(s.entityId)!; ref.node.angle = s.angleRadians * 180 / Math.PI;
      ref.body.angularVelocity = s.angularVelocity; if (s.sleeping) ref.body.sleep();
    }
  }
  canSpawn(level: number, xDu: number): boolean {
    const radius = this.rules.ingredients.find(i => i.level === level)?.radius_du;
    if (!radius || !this.cupShape) return false;
    if (xDu - radius < this.cupShape.spawnRange.minX || xDu + radius > this.cupShape.spawnRange.maxX) return false;
    const y = this.rules.cup.spawn_y_du;
    for (const [id, ref] of this.bodies) {
      const state = this.getBody(id)!;
      if (Math.hypot(state.positionDu.x - xDu, state.positionDu.y - y) < ref.radiusDu + radius) return false;
    }
    return true;
  }
  dispose(): void {
    if (this.disposed) return;
    for (const id of Array.from(this.bodies.keys())) this.destroyBody(id);
    this.destroyCup(); this.activeContacts.clear();
    for (const dispose of this.listenerDisposers.slice()) dispose();
    this.listenerDisposers.length = 0; this.disposed = true;
  }
  private installContacts(collider: Collider2D, entityId: number | null, listenerName = `listener:${entityId}`): void {
    const begin = (self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) => this.onContact(true, entityId, self, other, contact);
    const end = (self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) => this.onContact(false, entityId, self, other, contact);
    collider.on(Contact2DType.BEGIN_CONTACT, begin); collider.on(Contact2DType.END_CONTACT, end);
    const dispose = () => { collider.off(Contact2DType.BEGIN_CONTACT, begin); collider.off(Contact2DType.END_CONTACT, end); };
    Object.defineProperty(dispose, 'name', { value: listenerName }); this.listenerDisposers.push(dispose);
  }
  private onContact(begin: boolean, selfId: number | null, self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null): void {
    const otherId = this.idFromCollider(other);
    if (selfId === null && otherId === null) return;
    const first = selfId === null ? otherId! : selfId; const second = selfId === null || otherId === null ? null : otherId;
    const cupCollider = selfId === null ? self : other;
    const boundaryIndex = second === null ? this.staticNodes.indexOf(cupCollider.node) : -1;
    if (second === null && boundaryIndex < 0) return;
    const key = second === null ? `${first}|cup:${boundaryIndex}` : `${Math.min(first, second)}|${Math.max(first, second)}`;
    if (!begin) { this.activeContacts.delete(key); return; }
    let normalSpeed = 0;
    if (contact?.colliderA && contact.colliderB) {
      const normal = contact.getWorldManifold().normal;
      const idA = this.idFromCollider(contact.colliderA); const idB = this.idFromCollider(contact.colliderB);
      const velocityA = idA === null ? new Vec2(0, 0) : this.bodies.get(idA)?.body.linearVelocity ?? new Vec2(0, 0);
      const velocityB = idB === null ? new Vec2(0, 0) : this.bodies.get(idB)?.body.linearVelocity ?? new Vec2(0, 0);
      const projected = (velocityB.x - velocityA.x) * normal.x + (velocityB.y - velocityA.y) * normal.y;
      normalSpeed = this.mapper.box2DVelocityToDu(Math.abs(projected));
    }
    this.activeContacts.set(key, { contactId: key, firstId: first, secondId: second, normalSpeed });
  }
  private idFromCollider(collider: Collider2D): number | null {
    for (const [id, ref] of this.bodies) if (ref.collider === collider) return id;
    return null;
  }
  private removeContactsFor(entityId: number): void { for (const [key, pair] of this.activeContacts) if (pair.firstId === entityId || pair.secondId === entityId) this.activeContacts.delete(key); }
  private destroyCup(): void {
    for (let i = 0; i < this.staticNodes.length; i++) { this.removeListener(`listener:cup:${i}`); this.staticNodes[i].destroy(); }
    for (const [key, contact] of this.activeContacts) if (contact.secondId === null) this.activeContacts.delete(key);
    this.staticNodes.length = 0; this.cupShape = null;
  }
  private assertAlive(): void { if (this.disposed) throw new Error('Physics adapter has been disposed'); }
  private removeListener(name: string): void {
    const index = this.listenerDisposers.findIndex(dispose => dispose.name === name);
    if (index >= 0) { this.listenerDisposers[index](); this.listenerDisposers.splice(index, 1); }
  }
}
