import { cloneState } from '../core/CloneState';
import { BoxCollider2D, CircleCollider2D, Collider2D, Contact2DType, ERigidBody2DType, IPhysics2DContact, Node, PhysicsSystem2D, RigidBody2D, Size, Vec2, Vec3 } from 'cc';
import type { BodyDefinition, ContactPair, IngredientState, IPhysicsAdapter, PhysicalBodyState, Result, StageId } from '../contracts/types';
import { RulesConfig } from '../core/ConfigLoader';
import { CoordinateMapper } from './CoordinateMapper';
import { CupGeometry } from './CupGeometry';

interface BodyRef { node: Node; body: RigidBody2D; collider: CircleCollider2D; radiusDu: number }
interface ColliderOwner { entityId: number | null; boundaryIndex: number | null }
const EMPTY_SEGMENTS: readonly [] = Object.freeze([]);
// Creator 3.8.8's bundled Box2D uses b2_linearSlop=0.008m and
// b2_polygonRadius=2*b2_linearSlop=0.016m. These are backend geometry metadata,
// not configured cup thickness or changes to the solver settings.
const BOX2D_WASM_LINEAR_SLOP_METERS = 0.008;
const BOX2D_WASM_POLYGON_SKIN_METERS = 0.016;

/** Physics only. Render children are owned by PhysicsLab and follow these nodes. */
export class CocosPhysicsAdapter implements IPhysicsAdapter {
  private readonly bodies = new Map<number, BodyRef>();
  private readonly colliderOwners = new Map<Collider2D, ColliderOwner>();
  private readonly activeContacts = new Map<string, ContactPair>();
  private contactEnumerationReversed = false;
  private lastEnumeratedContactIds: string[] = [];
  private readonly staticNodes: Node[] = [];
  private readonly listenerDisposers: Array<() => void> = [];
  private readonly staleCallbackProbes: Array<() => void> = [];
  private readonly samplePosition = new Vec3();
  private readonly stepTimings = { syncToPhysics: 0, physicsStep: 0, syncFromPhysics: 0, velocityClamp: 0 };
  private timingDiagnostics = false;
  private fixtureImpulseProbe: Array<{ preStepIndex: number; entityId: number; deltaDu: { x: number; y: number }; deltaBox2D: { x: number; y: number }; mass: number; impulseBox2D: { x: number; y: number }; beforeVelocityDu: { x: number; y: number }; awakeBefore: boolean }> | null = null;
  private fixtureMergeFault: 'create-child-once'|'second-commit-once'|null=null;
  private fixtureMergeCommitCount=0;
  private fixtureMergeProbe: Array<Record<string,unknown>>|null=null;
  private fixtureWallProbe: Array<Record<string,unknown>>|null=null;
  private contactBeginCount = 0;
  private contactEndCount = 0;
  private disposed = false;
  private readonly generation = CocosPhysicsAdapter.nextGeneration++;
  private static nextGeneration = 1;
  private _stepCount = 0;
  private cupShape: ReturnType<typeof CupGeometry.build> | null = null;
  constructor(private readonly root: Node, private readonly rules: RulesConfig, private readonly mapper: CoordinateMapper) {}
  get entityCount(): number { return this.bodies.size; }
  get contactCount(): number { return this.activeContacts.size; }
  get listenerCount(): number { return this.listenerDisposers.length; }
  get stepCount(): number { return this._stepCount; }
  get cupSegments() { return this.cupShape?.segments ?? EMPTY_SEGMENTS; }
  get contactBeginEvents(): number { return this.contactBeginCount; }
  get contactEndEvents(): number { return this.contactEndCount; }
  get wallContactProjectionMarginDu(): number { return this.mapper.box2DMetersToDu(BOX2D_WASM_POLYGON_SKIN_METERS + BOX2D_WASM_LINEAR_SLOP_METERS); }
  get lastStepTimings(): Readonly<typeof this.stepTimings> { return this.stepTimings; }
  setFixtureMergeFaultOnce(point:'create-child-once'|'second-commit-once'):void{this.fixtureMergeFault=point;this.fixtureMergeCommitCount=0;}
  enableFixtureMergeProbe():void{this.fixtureMergeProbe=[];}
  enableFixtureWallProbe():void{this.fixtureWallProbe=[];}
  readFixtureWallProbe():readonly Record<string,unknown>[] { return cloneState(this.fixtureWallProbe??[]); }
  readFixtureWallGeometry():readonly Record<string,unknown>[] {
    return this.staticNodes.map((node,index)=>{
      const collider=node.getComponent(BoxCollider2D),position=node.position,segment=this.cupShape?.segments[index];
      const polygonSkinDu=this.mapper.box2DMetersToDu(BOX2D_WASM_POLYGON_SKIN_METERS),linearSlopDu=this.mapper.box2DMetersToDu(BOX2D_WASM_LINEAR_SLOP_METERS);
      return {index,kind:segment?.kind??null,innerStart:segment?.innerStart??null,innerEnd:segment?.innerEnd??null,
        outward:segment?.outward??null,lengthDu:segment?.lengthDu??null,thicknessDu:segment?.thicknessDu??null,
        box2dLinearSlopMeters:BOX2D_WASM_LINEAR_SLOP_METERS,box2dLinearSlopDu:linearSlopDu,
        box2dPolygonSkinMeters:BOX2D_WASM_POLYGON_SKIN_METERS,box2dPolygonContactSkinDu:polygonSkinDu,
        childWallProjectionMarginDu:polygonSkinDu+linearSlopDu,
        nodePositionDu:{x:this.mapper.cocosWorldToDu(position.x)+this.rules.viewport.width_du/2,y:this.mapper.cocosWorldToDu(position.y)+this.rules.viewport.height_du/2},
        angleDeg:node.angle,colliderSizeCocos:collider?{width:collider.size.width,height:collider.size.height}:null,
        colliderVertexSizeDu:collider?{width:this.mapper.cocosWorldToDu(collider.size.width),height:this.mapper.cocosWorldToDu(collider.size.height)}:null,
        colliderOffsetCocos:collider?{x:collider.offset.x,y:collider.offset.y}:null,
        worldPointsDu:collider?.worldPoints.map(p=>({x:this.mapper.cocosWorldToDu(p.x)+this.rules.viewport.width_du/2,y:this.mapper.cocosWorldToDu(p.y)+this.rules.viewport.height_du/2}))??null,
        worldAabbDu:collider?{x:this.mapper.cocosWorldToDu(collider.worldAABB.x)+this.rules.viewport.width_du/2,
          y:this.mapper.cocosWorldToDu(collider.worldAABB.y)+this.rules.viewport.height_du/2,
          width:this.mapper.cocosWorldToDu(collider.worldAABB.width),height:this.mapper.cocosWorldToDu(collider.worldAABB.height)}:null};
    });
  }
  recordFixtureMerge(value:Record<string,unknown>):void{
    const data=cloneState(value) as Record<string,any>;
    if(this.fixtureMergeProbe){
      const child=data.child as {entityId?:number}|undefined;
      data.adapterAtCommit={stepCount:this._stepCount,child:child?.entityId===undefined?null:this.getBody(child.entityId)??null,
        parentsStillRegistered:Array.isArray(data.parentIds)?data.parentIds.map((id:number)=>this.bodies.has(id)):null,
        wallGeometry:this.fixtureWallProbe?this.readFixtureWallGeometry():undefined};
      this.fixtureMergeProbe.push(data);
    }
  }
  readFixtureMergeProbe():readonly Record<string,unknown>[]{return cloneState(this.fixtureMergeProbe??[]);}
  setTimingDiagnostics(enabled: boolean): void { this.timingDiagnostics = enabled; }
  /** Attempt-scoped diagnostic used only by the real cup-bump fixture. */
  enableFixtureImpulseProbe(): void { this.fixtureImpulseProbe = []; }
  readFixtureImpulseProbe(): readonly { preStepIndex: number; entityId: number; deltaDu: { x: number; y: number }; deltaBox2D: { x: number; y: number }; mass: number; impulseBox2D: { x: number; y: number }; beforeVelocityDu: { x: number; y: number }; awakeBefore: boolean }[] {
    return (this.fixtureImpulseProbe ?? []).map(sample => ({ ...sample, deltaDu: { ...sample.deltaDu }, deltaBox2D: { ...sample.deltaBox2D }, impulseBox2D: { ...sample.impulseBox2D }, beforeVelocityDu: { ...sample.beforeVelocityDu } }));
  }

  private cupOffsetXDu = 0;
  private cupBodies: RigidBody2D[] = [];
  private readonly guardNodes: Node[] = [];
  private readonly guardBodies: RigidBody2D[] = [];
  private readonly guardColliders: BoxCollider2D[] = [];
  private readonly guardMembers = new Set<number>();
  private guardActive = false;
  private cupRimYDu = 0;
  private cupTopHalfWidthDu = 0;
  private cupWallThicknessDu = 16;
  createCup(stageId: StageId, offsetXDu = 0): void {
    this.assertAlive(); this.destroyCup();
    const scale = this.rules.stages.find(s => s.id === stageId)?.cup_width_scale;
    if (scale === undefined) throw new Error(`Unknown stage: ${stageId}`);
    const cup = this.rules.cup;
    this.cupOffsetXDu = offsetXDu;
    this.cupShape = CupGeometry.build({ centerXDu: cup.center_x_du + offsetXDu, bottomYDu: cup.inner_bottom_y_du,
      topYDu: cup.inner_top_y_du, bottomWidthDu: cup.bottom_width_du, topWidthDu: cup.top_width_du, widthScale: scale });
    this.cupRimYDu = this.cupShape.leftTop.y;
    this.cupTopHalfWidthDu = this.cupShape.innerWidthAtTop / 2;
    this.cupWallThicknessDu = this.cupShape.segments[1]?.thicknessDu ?? 16;
    for (let segmentIndex = 0; segmentIndex < this.cupShape.segments.length; segmentIndex++) {
      const segment = this.cupShape.segments[segmentIndex];
      const node = new Node(`CupBoundary-${segment.kind}`); this.root.addChild(node);
      node.setPosition(this.mapper.duToCocosWorld(segment.center.x - this.rules.viewport.width_du / 2),
        this.mapper.duToCocosWorld(segment.center.y - this.rules.viewport.height_du / 2), 0);
      node.angle = segment.angleDeg;
      const body = node.addComponent(RigidBody2D); body.type = ERigidBody2DType.Kinematic; body.enabledContactListener = true; body.gravityScale = 0;
      const collider = node.addComponent(BoxCollider2D);
      collider.size = new Size(this.mapper.duToCocosWorld(segment.lengthDu),this.mapper.duToCocosWorld(segment.thicknessDu));
      collider.friction = this.rules.physics.friction; collider.restitution = this.rules.physics.restitution;
      collider.apply(); this.staticNodes.push(node);
      this.cupBodies.push(body);
      this.installContacts(collider, null, `listener:cup:${segmentIndex}`);
    }
  }
  setCupVelocityX(duPerSecond:number):void {
    this.assertAlive(); if(!Number.isFinite(duPerSecond))throw new Error('Cup velocity must be finite');
    const v=this.mapper.duVelocityToBox2D(duPerSecond); for(const body of this.cupBodies) body.linearVelocity=new Vec2(v,0);
  }
  getCupOffsetX():number {
    const node=this.staticNodes[0]; if(!node)return this.cupOffsetXDu;
    const x=this.mapper.cocosWorldToDu(node.position.x)+this.rules.viewport.width_du/2;
    return x-this.rules.cup.center_x_du;
  }
  /**
   * CUP-02 guarded bump: a kinematic mouth guard (lid plus two short corner rails) that follows the
   * real cup and only collides with the guarded members. Non-members keep their original path so a
   * falling drop or an already-spilled body is never bounced back by the guard.
   */
  ensureShakeGuard(members: readonly number[], cue: { centerXDu: number; offsetXDu: number; velocityXDuPerSecond: number }): void {
    this.assertAlive();
    if (!this.cupShape) return;
    this.guardMembers.clear();
    for (const id of members) if (this.bodies.has(id)) this.guardMembers.add(id);
    if (this.guardActive) return;
    const actualOffset = this.getCupOffsetX();
    const offset = Number.isFinite(actualOffset) ? actualOffset : cue.offsetXDu;
    let highestTop = -Infinity;
    for (const id of this.guardMembers) {
      const state = this.getBody(id); const radius = this.bodies.get(id)?.radiusDu ?? 0;
      if (state) highestTop = Math.max(highestTop, state.positionDu.y + radius);
    }
    // Cap underside sits above the rim; if a body is already protruding, raise the lid instead of
    // creating an overlapping kinematic box (which would inject a large penetration correction).
    const capUnderside = Math.max(this.cupRimYDu + this.rules.shake.guard_lift_du, highestTop + 2);
    this.buildShakeGuard(this.rules.cup.center_x_du + offset, capUnderside);
    this.guardActive = true;
  }
  releaseShakeGuard(): void {
    if (this.disposed) return;
    this.destroyShakeGuard();
  }
  get shakeGuardActive(): boolean { return this.guardActive; }
  get shakeGuardNodes(): readonly Node[] { return this.guardNodes; }
  private buildShakeGuard(centerXDu: number, capUndersideYDu: number): void {
    const thickness = Math.max(4, this.rules.shake.guard_thickness_du);
    const railWidth = Math.max(4, this.cupWallThicknessDu);
    const capTopYDu = capUndersideYDu + thickness;
    const railHeight = Math.max(4, capTopYDu - this.cupRimYDu);
    const specs = [
      { name: 'cap', xDu: centerXDu, yDu: capUndersideYDu + thickness / 2, widthDu: this.cupTopHalfWidthDu * 2 + this.cupWallThicknessDu * 2, heightDu: thickness },
      { name: 'rail-left', xDu: centerXDu - this.cupTopHalfWidthDu - railWidth / 2, yDu: this.cupRimYDu + railHeight / 2, widthDu: railWidth, heightDu: railHeight },
      { name: 'rail-right', xDu: centerXDu + this.cupTopHalfWidthDu + railWidth / 2, yDu: this.cupRimYDu + railHeight / 2, widthDu: railWidth, heightDu: railHeight },
    ];
    const shared = this.cupBodies[0]?.linearVelocity;
    for (const spec of specs) {
      const node = new Node(`ShakeGuard-${spec.name}`); this.root.addChild(node);
      node.setPosition(this.mapper.duToCocosWorld(spec.xDu - this.rules.viewport.width_du / 2),
        this.mapper.duToCocosWorld(spec.yDu - this.rules.viewport.height_du / 2), 0);
      const body = node.addComponent(RigidBody2D);
      body.type = ERigidBody2DType.Kinematic; body.enabledContactListener = true; body.gravityScale = 0;
      body.linearVelocity = new Vec2(shared?.x ?? 0, 0);
      const collider = node.addComponent(BoxCollider2D);
      collider.size = new Size(this.mapper.duToCocosWorld(spec.widthDu), this.mapper.duToCocosWorld(spec.heightDu));
      collider.friction = this.rules.physics.friction; collider.restitution = this.rules.physics.restitution;
      collider.apply();
      this.guardNodes.push(node); this.guardBodies.push(body); this.guardColliders.push(collider);
      // Guard bodies follow the cup through the same kinematic velocity channel as the cup walls,
      // but stay out of staticNodes so getCupOffsetX and wall probes still describe the real cup.
      this.cupBodies.push(body);
      this.installGuardFilter(collider, this.guardColliders.length - 1);
    }
  }
  private installGuardFilter(collider: BoxCollider2D, index: number): void {
    const generation = this.generation;
    this.colliderOwners.set(collider, { entityId: null, boundaryIndex: null });
    const preSolve = (_self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null): void => {
      if (this.disposed || generation !== this.generation) return;
      const otherId = this.idFromCollider(other);
      if (otherId !== null && this.guardMembers.has(otherId)) return;
      if (contact) (contact as unknown as { disabled?: boolean }).disabled = true;
    };
    collider.on(Contact2DType.PRE_SOLVE, preSolve);
    const dispose = () => { collider.off(Contact2DType.PRE_SOLVE, preSolve); this.colliderOwners.delete(collider); };
    Object.defineProperty(dispose, 'name', { value: `listener:guard:${index}` });
    this.listenerDisposers.push(dispose);
  }
  private destroyShakeGuard(): void {
    for (let i = 0; i < this.guardColliders.length; i++) this.removeListener(`listener:guard:${i}`);
    for (const body of this.guardBodies) body.enabled = false;
    for (const node of this.guardNodes) if (node.isValid) node.destroy();
    if (this.guardBodies.length) {
      const removed = new Set(this.guardBodies);
      this.cupBodies = this.cupBodies.filter(body => !removed.has(body));
    }
    this.guardNodes.length = 0; this.guardBodies.length = 0; this.guardColliders.length = 0;
    this.guardMembers.clear(); this.guardActive = false;
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
    const angleRadians=definition.angleRadians??0;
    if(!Number.isFinite(angleRadians)||!Number.isFinite(definition.angularVelocity??0))throw new Error('Body rotation state must be finite');
    node.angle=angleRadians*180/Math.PI;
    const body = node.addComponent(RigidBody2D); body.type = ERigidBody2DType.Dynamic; body.enabledContactListener = true;
    if(definition.enabledInitially===false)body.enabled=false;
    body.linearDamping = this.rules.physics.linear_damping; body.angularDamping = this.rules.physics.angular_damping;
    body.allowSleep = this.rules.physics.sleep; body.awakeOnLoad = true;
    const collider = node.addComponent(CircleCollider2D); collider.radius = this.mapper.duToCocosWorld(definition.radiusDu);
    collider.density = this.rules.physics.density_relative; collider.friction = this.rules.physics.friction;
    collider.restitution = this.rules.physics.restitution; collider.apply();
    body.linearVelocity = new Vec2(this.mapper.duVelocityToBox2D(definition.velocityDuPerSecond.x), this.mapper.duVelocityToBox2D(definition.velocityDuPerSecond.y));
    body.angularVelocity=definition.angularVelocity??0;
    this.bodies.set(definition.entityId, { node, body, collider, radiusDu: definition.radiusDu });
    this.colliderOwners.set(collider, { entityId: definition.entityId, boundaryIndex: null });
    this.installContacts(collider, definition.entityId);
  }

  destroyBody(entityId: number): void {
    const ref = this.bodies.get(entityId); if (!ref) return;
    // Component disable synchronously maps to the installed Box2D body's SetActive(false).
    // Node.destroy alone is deferred by Creator and would leave a collider in the next step.
    ref.body.enabled = false;
    this.colliderOwners.delete(ref.collider);
    this.removeListener(`listener:${entityId}`); this.removeContactsFor(entityId);
    this.bodies.delete(entityId); ref.node.destroy();
  }
  replaceParentsWithChild(parents: readonly [number, number], child: BodyDefinition): Result<void> {
    this.assertAlive();
    if (parents[0] === parents[1] || !this.bodies.has(parents[0]) || !this.bodies.has(parents[1]) || this.bodies.has(child.entityId)) {
      return { ok: false, error: { code: 'MERGE_OWNER_INVALID', message: '合成父对象或子ID无效', retryable: false } };
    }
    const a = this.bodies.get(parents[0])!; const b = this.bodies.get(parents[1])!;
    let childRef: BodyRef | undefined;
    try {
      // There is no PhysicsSystem2D.step between staging and commit. Temporarily deactivate
      // the staged child and both parents through the public Component.enabled lifecycle.
      if(this.fixtureMergeFault==='create-child-once'){this.fixtureMergeFault=null;throw new Error('FIXTURE_CREATE_CHILD_ONCE');}
      this.createBody({ ...child, enabledInitially: false }); childRef = this.bodies.get(child.entityId)!;
      a.body.enabled = false; b.body.enabled = false;
      childRef.body.enabled = true;
      if(this.fixtureMergeFault==='second-commit-once'&&++this.fixtureMergeCommitCount===2){this.fixtureMergeFault=null;throw new Error('FIXTURE_SECOND_COMMIT_ONCE');}
      this.removeBodyRecord(parents[0], a); this.removeBodyRecord(parents[1], b);
      a.node.destroy(); b.node.destroy();
      return { ok: true, data: undefined };
    } catch (error) {
      if (childRef) { childRef.body.enabled = false; this.removeBodyRecord(child.entityId, childRef); childRef.node.destroy(); }
      if (a.node.isValid) { a.body.enabled = true; this.restoreBodyRecord(parents[0], a); }
      if (b.node.isValid) { b.body.enabled = true; this.restoreBodyRecord(parents[1], b); }
      return { ok: false, error: { code: 'MERGE_REPLACE_ROLLED_BACK', message: String(error), retryable: true } };
    }
  }
  stepFixed(): void {
    this.assertAlive();
    const physics = PhysicsSystem2D.instance;
    let started = this.timingDiagnostics ? performance.now() : 0;
    physics.physicsWorld.syncSceneToPhysics();
    if (this.timingDiagnostics) { this.stepTimings.syncToPhysics = performance.now() - started; started = performance.now(); }
    physics.step(1 / this.rules.physics.fixed_hz);
    if (this.timingDiagnostics) { this.stepTimings.physicsStep = performance.now() - started; started = performance.now(); }
    this._stepCount++;
    physics.physicsWorld.syncPhysicsToScene();
    if (this.timingDiagnostics) { this.stepTimings.syncFromPhysics = performance.now() - started; started = performance.now(); }
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
    if (this.timingDiagnostics) this.stepTimings.velocityClamp = performance.now() - started;
  }
  visitBodySamples(visitor: (id: number, radiusDu: number, xDu: number, yDu: number, vxDu: number, vyDu: number, awake: boolean) => void): void {
    this.assertAlive();
    for (const [id, ref] of this.bodies) {
      ref.node.getPosition(this.samplePosition);
      const velocity = ref.body.linearVelocity;
      visitor(id, ref.radiusDu,
        this.mapper.cocosWorldToDu(this.samplePosition.x) + this.rules.viewport.width_du / 2,
        this.mapper.cocosWorldToDu(this.samplePosition.y) + this.rules.viewport.height_du / 2,
        this.mapper.box2DVelocityToDu(velocity.x), this.mapper.box2DVelocityToDu(velocity.y), ref.body.isAwake());
    }
  }
  applyVelocityImpulse(entityId: number, deltaVelocityDuPerSecond: { x: number; y: number }): void {
    this.assertAlive();
    const ref = this.bodies.get(entityId); if (!ref) throw new Error(`Impulse target ${entityId} is not a live body`);
    if (!Number.isFinite(deltaVelocityDuPerSecond.x) || !Number.isFinite(deltaVelocityDuPerSecond.y)) throw new Error('Impulse delta must be finite');
    const mass = ref.body.getMass();
    if (!Number.isFinite(mass) || mass <= 0) throw new Error(`Impulse target ${entityId} has invalid mass`);
    const deltaBox2D = { x: this.mapper.duVelocityToBox2D(deltaVelocityDuPerSecond.x), y: this.mapper.duVelocityToBox2D(deltaVelocityDuPerSecond.y) };
    const impulseBox2D = { x: deltaBox2D.x * mass, y: deltaBox2D.y * mass };
    const before = ref.body.linearVelocity;
    const awakeBefore = ref.body.isAwake();
    this.fixtureImpulseProbe?.push({ preStepIndex: this._stepCount, entityId, deltaDu: { ...deltaVelocityDuPerSecond }, deltaBox2D: { ...deltaBox2D }, mass, impulseBox2D: { ...impulseBox2D }, beforeVelocityDu: { x: this.mapper.box2DVelocityToDu(before.x), y: this.mapper.box2DVelocityToDu(before.y) }, awakeBefore });
    ref.body.applyLinearImpulseToCenter(new Vec2(impulseBox2D.x, impulseBox2D.y), true);
  }
  getContacts(): readonly ContactPair[] {
    const contacts = Array.from(this.activeContacts.values(), c => ({ ...c }));
    if (this.contactEnumerationReversed) contacts.reverse();
    this.lastEnumeratedContactIds = contacts.map(c => c.contactId);
    return contacts;
  }
  /** Fixture-only enumeration perturbation; it does not alter contacts or physics. */
  setContactEnumerationReversedForFixture(reversed: boolean): void { this.contactEnumerationReversed = reversed; }
  get fixtureContactEnumeration(): { reversed: boolean; contactIds: readonly string[] } {
    return { reversed: this.contactEnumerationReversed, contactIds: [...this.lastEnumeratedContactIds] };
  }
  setLinearDampingForTest(entityId: number, damping: number): void {
    const ref = this.bodies.get(entityId); if (!ref) throw new Error(`Unknown entity ${entityId}`);
    if (!Number.isFinite(damping) || damping < 0) throw new Error('damping must be finite and non-negative');
    ref.body.linearDamping = damping;
  }
  setBodyPositionForTest(entityId: number, positionDu: { x: number; y: number }): void {
    const ref = this.bodies.get(entityId); if (!ref) throw new Error(`Unknown entity ${entityId}`);
    if (!Number.isFinite(positionDu.x) || !Number.isFinite(positionDu.y)) throw new Error('Test body position must be finite');
    ref.node.setPosition(this.mapper.duToCocosWorld(positionDu.x - this.rules.viewport.width_du / 2),
      this.mapper.duToCocosWorld(positionDu.y - this.rules.viewport.height_du / 2), 0);
    ref.body.wakeUp();
  }
  setBodyVelocityForTest(entityId: number, velocityDuPerSecond: { x: number; y: number }): void {
    const ref = this.bodies.get(entityId); if (!ref) throw new Error(`Unknown entity ${entityId}`);
    if (!Number.isFinite(velocityDuPerSecond.x) || !Number.isFinite(velocityDuPerSecond.y)) throw new Error('Test body velocity must be finite');
    ref.body.linearVelocity = new Vec2(this.mapper.duVelocityToBox2D(velocityDuPerSecond.x), this.mapper.duVelocityToBox2D(velocityDuPerSecond.y));
    ref.body.wakeUp();
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
    return this.spawnRejectionReason(level, xDu) === null;
  }
  spawnRejectionReason(level: number, xDu: number): string | null {
    const radius = this.rules.ingredients.find(i => i.level === level)?.radius_du;
    if (!radius || !this.cupShape) return 'invalid_level_or_cup';
    if (xDu - radius < this.cupShape.spawnRange.minX || xDu + radius > this.cupShape.spawnRange.maxX) return 'outside_legal_interval';
    const y = this.rules.cup.spawn_y_du;
    for (const [id, ref] of this.bodies) {
      const state = this.getBody(id)!;
      if (Math.hypot(state.positionDu.x - xDu, state.positionDu.y - y) < ref.radiusDu + radius) return `blocked_by_entity:${id}`;
    }
    return null;
  }
  dispose(): void {
    if (this.disposed) return;
    for (const id of Array.from(this.bodies.keys())) this.destroyBody(id);
    this.destroyCup(); this.activeContacts.clear(); this.colliderOwners.clear();
    for (const dispose of this.listenerDisposers.slice()) dispose();
    this.listenerDisposers.length = 0; this.disposed = true;
  }
  /** Unit-only stale callback probe. It invokes captured listener closures after dispose and never calls PhysicsSystem.step. */
  replayStaleContactCallbacksForTest(): { contactCount: number; beginEvents: number; endEvents: number; colliderOwners: number } {
    for (const replay of this.staleCallbackProbes) replay();
    return { contactCount: this.contactCount, beginEvents: this.contactBeginCount, endEvents: this.contactEndCount, colliderOwners: this.colliderOwners.size };
  }
  private installContacts(collider: Collider2D, entityId: number | null, listenerName = `listener:${entityId}`): void {
    const boundaryIndex = entityId === null ? this.staticNodes.findIndex(node => node === collider.node) : null;
    const owner: ColliderOwner = { entityId, boundaryIndex: boundaryIndex !== null && boundaryIndex >= 0 ? boundaryIndex : null };
    this.colliderOwners.set(collider, owner);
    const generation = this.generation;
    const begin = (self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) => {
      if (!this.disposed && generation === this.generation && this.colliderOwners.get(collider) === owner) this.onContact(true, entityId, self, other, contact);
    };
    const end = (self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) => {
      if (!this.disposed && generation === this.generation && this.colliderOwners.get(collider) === owner) this.onContact(false, entityId, self, other, contact);
    };
    this.staleCallbackProbes.push(() => begin(collider, collider, null), () => end(collider, collider, null));
    collider.on(Contact2DType.BEGIN_CONTACT, begin); collider.on(Contact2DType.END_CONTACT, end);
    const dispose = () => { collider.off(Contact2DType.BEGIN_CONTACT, begin); collider.off(Contact2DType.END_CONTACT, end); this.colliderOwners.delete(collider); };
    Object.defineProperty(dispose, 'name', { value: listenerName }); this.listenerDisposers.push(dispose);
  }
  private onContact(begin: boolean, selfId: number | null, self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null): void {
    const selfOwner = this.colliderOwners.get(self); const otherOwner = this.colliderOwners.get(other);
    if (!selfOwner || !otherOwner) return;
    const otherId = this.idFromCollider(other);
    if (selfId === null && otherId === null) return;
    const first = selfId === null ? otherId! : otherId === null ? selfId : Math.min(selfId, otherId);
    const second = selfId === null || otherId === null ? null : Math.max(selfId, otherId);
    const boundaryOwner = selfId === null ? selfOwner : otherOwner;
    const boundaryIndex = second === null ? boundaryOwner.boundaryIndex ?? -1 : -1;
    if (second === null && boundaryIndex < 0) return;
    const key = second === null ? `${first}|cup:${boundaryIndex}` : `${Math.min(first, second)}|${Math.max(first, second)}`;
    if(this.fixtureWallProbe){
      let manifold:Record<string,unknown>|null=null;
      if(contact){const world=contact.getWorldManifold();manifold={normal:{x:world.normal.x,y:world.normal.y},
        points:world.points.map(p=>({x:this.mapper.cocosWorldToDu(p.x)+this.rules.viewport.width_du/2,y:this.mapper.cocosWorldToDu(p.y)+this.rules.viewport.height_du/2})),
        separationsDu:world.separations.map(v=>this.mapper.box2DMetersToDu(v)),touching:contact.isTouching()};}
      this.fixtureWallProbe.push({begin,stepCount:this._stepCount,selfId,otherId,boundaryIndex,contactId:key,manifold});
    }
    if (!begin) { if (this.activeContacts.delete(key)) this.contactEndCount++; return; }
    let normalSpeed = 0;
    if (contact?.colliderA && contact.colliderB) {
      const normal = contact.getWorldManifold().normal;
      const idA = this.idFromCollider(contact.colliderA); const idB = this.idFromCollider(contact.colliderB);
      const velocityA = idA === null ? new Vec2(0, 0) : this.bodies.get(idA)?.body.linearVelocity ?? new Vec2(0, 0);
      const velocityB = idB === null ? new Vec2(0, 0) : this.bodies.get(idB)?.body.linearVelocity ?? new Vec2(0, 0);
      const projected = (velocityB.x - velocityA.x) * normal.x + (velocityB.y - velocityA.y) * normal.y;
      normalSpeed = this.mapper.box2DVelocityToDu(Math.abs(projected));
    }
    if (!this.activeContacts.has(key)) this.contactBeginCount++;
    this.activeContacts.set(key, { contactId: key, firstId: first, secondId: second, normalSpeed });
  }
  private idFromCollider(collider: Collider2D): number | null {
    return this.colliderOwners.get(collider)?.entityId ?? null;
  }
  private removeContactsFor(entityId: number): void { for (const [key, pair] of this.activeContacts) if (pair.firstId === entityId || pair.secondId === entityId) { if(this.activeContacts.delete(key)) this.contactEndCount++; } }
  private removeBodyRecord(entityId: number, ref: BodyRef): void {
    this.colliderOwners.delete(ref.collider); this.removeListener(`listener:${entityId}`); this.removeContactsFor(entityId);
    if (this.bodies.get(entityId) === ref) this.bodies.delete(entityId);
  }
  private restoreBodyRecord(entityId: number, ref: BodyRef): void {
    this.bodies.set(entityId,ref); this.colliderOwners.set(ref.collider,{entityId,boundaryIndex:null});
    if(!this.listenerDisposers.some(dispose=>dispose.name===`listener:${entityId}`)) this.installContacts(ref.collider,entityId);
  }
  private destroyCup(): void {
    this.destroyShakeGuard();
    for (let i = 0; i < this.staticNodes.length; i++) { this.removeListener(`listener:cup:${i}`); this.staticNodes[i].destroy(); }
    for (const [key, contact] of this.activeContacts) if (contact.secondId === null) this.activeContacts.delete(key);
    this.staticNodes.length = 0; this.cupBodies.length=0; this.cupShape = null; this.cupOffsetXDu=0;
  }
  private assertAlive(): void { if (this.disposed) throw new Error('Physics adapter has been disposed'); }
  private removeListener(name: string): void {
    const index = this.listenerDisposers.findIndex(dispose => dispose.name === name);
    if (index >= 0) { this.listenerDisposers[index](); this.listenerDisposers.splice(index, 1); }
  }
}
