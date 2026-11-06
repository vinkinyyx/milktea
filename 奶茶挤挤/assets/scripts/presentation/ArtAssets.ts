import { assetManager, AssetManager, ImageAsset, JsonAsset, Node, resources, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { ArtCatalog, ArtVariant } from './ArtCatalog';
import { ArtLoadBudget, makeBudgetError } from '../core/ArtLoadBudget';
import { HostLifecycleCoordinator } from '../core/HostLifecycleCoordinator';

interface LoadedArt { variant: ArtVariant; image: ImageAsset; texture: Texture2D; frame: SpriteFrame }
/**
 * A scoped load batch. Time is accumulated in real foreground segments: every timestamp transition
 * (hide/show, timer, resource callback, assert, settle) first charges the elapsed span to the visibility
 * state that was in force, then flips the state. Background spans are therefore never charged.
 * Valid large deltas are never clamped — a real 20s foreground stall must still expire a 15s budget.
 */
interface LoadScope {
  budget: ArtLoadBudget;
  generation: number;
  kind: string;
  lastAccountedAtMs: number;
  previousForeground: boolean;
  unsubscribeVisibility: (() => void) | null;
  closed: boolean;
}

function safeNow(): number {
  try { return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now(); }
  catch { return 0; }
}

/** Scene-owned images. Loads ImageAsset so editor-generated SpriteFrame subasset settings are not assumed. */
export class ArtAssets {
  catalog!: ArtCatalog;
  private disposed = false;
  private generation = 1;
  private registry: JsonAsset | null = null;
  private readonly loaded = new Map<string, LoadedArt>();
  private readonly pending = new Map<string, Promise<LoadedArt>>();
  private readonly bundles = new Map<string, AssetManager.Bundle>();
  private readonly bundleLoads = new Map<string, Promise<AssetManager.Bundle>>();
  private scope: LoadScope | null = null;
  private budgetTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Start the single foreground budget shared by every load in this batch (index + menu, or one game start).
   * The returned budget is the scope token: pass it to settleLoadScope/cancelScope so a stale batch's
   * `finally` cannot tear down a scope that already replaced it.
   */
  beginLoadScope(ownerEpoch: number, traceId: number, budgetMs = 15_000, kind = 'GAME_ART'): ArtLoadBudget {
    this.cancelScope('START_ART_CANCELLED');
    this.generation++;
    const budget = new ArtLoadBudget(ownerEpoch, traceId, budgetMs);
    const scope: LoadScope = {
      budget, generation: this.generation, kind,
      lastAccountedAtMs: safeNow(),
      previousForeground: !HostLifecycleCoordinator.backgrounded,
      unsubscribeVisibility: null, closed: false,
    };
    this.scope = scope;
    this.pending.clear(); this.bundleLoads.clear();
    // Subscribe first so the initial synchronous snapshot seeds previousForeground from the live host state
    // (a batch may legitimately begin while the host is already in the background).
    scope.unsubscribeVisibility = HostLifecycleCoordinator.subscribe(() => {
      if (this.scope !== scope || scope.closed) return;
      this.accountUntil(scope, safeNow());
      scope.previousForeground = !HostLifecycleCoordinator.backgrounded;
      if (scope.budget.expired) this.failScope(scope);
    });
    this.budgetTimer = setInterval(() => this.tickBudget(scope), 150);
    return budget;
  }
  /** Settle the batch. When a token is supplied it must still own the scope, otherwise this is a no-op. */
  settleLoadScope(handle?: ArtLoadBudget): void {
    const scope = this.scope;
    if (!scope) return;
    if (handle && scope.budget !== handle) return;
    this.accountUntil(scope, safeNow());
    if (!scope.budget.active) { this.failScope(scope); return; }
    scope.budget.settle();
    this.closeScope(scope);
  }
  /** Cancel the batch. A token that no longer owns the scope cannot cancel the replacement batch. */
  cancelScope(code = 'START_ART_CANCELLED', handle?: ArtLoadBudget): void {
    const scope = this.scope;
    if (!scope) return;
    if (handle && scope.budget !== handle) return;
    scope.budget.cancel(code);
    this.closeScope(scope);
    this.generation++;
    this.pending.clear(); this.bundleLoads.clear();
  }
  get activeBudget(): ArtLoadBudget | null { return this.scope?.budget ?? null; }

  async initialize(): Promise<void> {
    const scope = this.requireActiveScope();
    const json = await this.raceBudget(scope, new Promise<JsonAsset>((resolve, reject) => resources.load('art/p1/catalog', JsonAsset,
      (error, asset) => error || !asset ? reject(error ?? new Error('美术索引缺失')) : resolve(asset))));
    this.assertScope(scope);
    json.addRef(); this.registry = json;
    this.catalog = new ArtCatalog(json.json);
  }
  get loadedCount(): number { return this.loaded.size; }
  getLoadedVariant(assetId: string): ArtVariant | undefined { return this.loaded.get(assetId)?.variant; }
  loadedVariantSnapshot(): Array<{ assetId: string; variantId: string; path: string; size: readonly [number, number]; alphaInsets: readonly [number, number, number, number] | null; pivot: readonly [number, number] }> {
    return Array.from(this.loaded.entries(), ([assetId, art]) => ({ assetId, variantId: art.variant.resource_key, path: art.variant.png,
      size: art.variant.size, alphaInsets: ArtCatalog.insets(art.variant), pivot: ArtCatalog.pivot(art.variant) }));
  }
  async load(assetId: string, targetPixels = 128): Promise<void> { await this.acquire(assetId, targetPixels); }
  setSpriteAsset(node: Node, assetId: string): void {
    const art = this.loaded.get(assetId), sprite = node.getComponent(Sprite);
    if (!art || !sprite) return;
    sprite.spriteFrame = art.frame;
  }
  createSprite(parent: Node, assetId: string, widthDu: number, heightDu: number, centerPivot = false): Node {
    this.assertAlive();
    const art = this.loaded.get(assetId);
    if (!art) throw new Error(`图片尚未加载: ${assetId}`);
    const node = new Node(assetId); parent.addChild(node);
    const ui = node.addComponent(UITransform);
    const pivot = centerPivot ? [0.5, 0.5] : ArtCatalog.pivot(art.variant);
    ui.setAnchorPoint(pivot[0], pivot[1]);
    const sprite = node.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false; sprite.spriteFrame = art.frame;
    sprite.type = ArtCatalog.insets(art.variant) ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
    ui.setContentSize(widthDu, heightDu);
    return node;
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelScope('START_ART_CANCELLED');
    for (const art of this.loaded.values()) { art.frame.destroy(); art.texture.destroy(); art.image.decRef(); this.releaseImage(art.variant); }
    this.loaded.clear(); this.pending.clear(); this.bundleLoads.clear(); this.registry?.decRef(); this.registry = null;
    this.stopBudgetTimer();
  }

  private requireActiveScope(): LoadScope {
    const scope = this.scope;
    if (!scope) throw makeBudgetError('START_ART_CANCELLED');
    this.accountUntil(scope, safeNow());
    scope.budget.assertActive();
    return scope;
  }
  private assertScope(scope: LoadScope): void {
    if (this.disposed || this.scope !== scope || scope.generation !== this.generation || scope.closed)
      throw makeBudgetError('START_ART_CANCELLED');
    // Charge the span since the last checkpoint *before* accepting the result. A callback that lands after the
    // foreground deadline must reject here even if the 150ms timer has not fired yet.
    this.accountUntil(scope, safeNow());
    scope.budget.assertActive();
  }
  /**
   * Charge `nowMs - lastAccountedAtMs` to the visibility state that was in force during that span, then move the
   * checkpoint. Background spans contribute nothing; foreground spans contribute in full, however large.
   */
  private accountUntil(scope: LoadScope, nowMs: number): void {
    if (scope.closed) return;
    const elapsed = nowMs - scope.lastAccountedAtMs;
    scope.lastAccountedAtMs = nowMs;
    if (!Number.isFinite(elapsed) || elapsed <= 0) return;
    if (!scope.previousForeground) return;
    scope.budget.advance(elapsed, true);
  }
  private closeScope(scope: LoadScope): void {
    if (scope.closed) return;
    scope.closed = true;
    if (scope.unsubscribeVisibility) { scope.unsubscribeVisibility(); scope.unsubscribeVisibility = null; }
    if (this.scope === scope) { this.scope = null; this.stopBudgetTimer(); }
  }
  /** Terminate an expired scope so pending waiters see START_ART_TIMEOUT instead of hanging on a dead batch. */
  private failScope(scope: LoadScope): void {
    if (scope.closed) return;
    this.closeScope(scope);
    this.generation++;
    this.pending.clear(); this.bundleLoads.clear();
  }
  private raceBudget<T>(scope: LoadScope, task: Promise<T>): Promise<T> {
    return Promise.race([task, scope.budget.cancelled()]);
  }
  private tickBudget(scope: LoadScope): void {
    // A superseded scope must not touch the shared timer handle: it now belongs to the replacement batch.
    if (scope.closed || this.scope !== scope) return;
    this.accountUntil(scope, safeNow());
    if (!scope.budget.active) this.failScope(scope);
  }
  private stopBudgetTimer(): void {
    if (this.budgetTimer !== null) { clearInterval(this.budgetTimer); this.budgetTimer = null; }
  }

  private acquire(assetId: string, targetPixels: number): Promise<LoadedArt> {
    this.assertAlive();
    const loaded = this.loaded.get(assetId); if (loaded) return Promise.resolve(loaded);
    const scope = this.requireActiveScope();
    const pending = this.pending.get(assetId); if (pending) return this.raceBudget(scope, pending);
    const variant = this.catalog.select(assetId, targetPixels);
    const task = this.loadImage(variant, scope).then(image => {
        this.assertScope(scope);
        if (!image) throw new Error(`图片加载失败 ${assetId}: 资源缺失`);
        if (image.width !== variant.size[0] || image.height !== variant.size[1]) {
          this.releaseImage(variant);
          throw new Error(`图片尺寸不符: ${assetId}`);
        }
        this.assertScope(scope);
        image.addRef();
        try {
          const texture = new Texture2D(); texture.image = image;
          const frame = new SpriteFrame(); frame.texture = texture; frame.packable = false;
          const insets = ArtCatalog.insets(variant);
          if (insets) [frame.insetLeft, frame.insetTop, frame.insetRight, frame.insetBottom] = insets;
          const art = { variant, image, texture, frame }; this.loaded.set(assetId, art); return art;
        } catch (error) {
          image.decRef(); this.releaseImage(variant); throw error;
        }
      }).catch(error => {
        if (error instanceof Error && error.name === 'ArtLoadBudgetError') throw error;
        throw new Error(`图片加载失败 ${assetId}: ${error instanceof Error ? error.message : String(error)}`);
      });
    this.pending.set(assetId, task);
    void task.then(() => { if (this.pending.get(assetId) === task) this.pending.delete(assetId); }, () => { if (this.pending.get(assetId) === task) this.pending.delete(assetId); });
    return task;
  }
  private async loadImage(variant: ArtVariant, scope: LoadScope): Promise<ImageAsset> {
    if (!variant.bundle) return this.raceBudget(scope, this.loadResourceImage(variant));
    let bundle: AssetManager.Bundle | null = this.bundles.get(variant.bundle) ?? null;
    if (!bundle) {
      try { bundle = await this.loadBundle(variant.bundle, scope); }
      catch (error) {
        if (error instanceof Error && error.name === 'ArtLoadBudgetError') throw error;
        bundle = null;
      }
    }
    this.assertScope(scope);
    if (bundle) return this.raceBudget(scope, new Promise<ImageAsset>((resolve, reject) => bundle!.load(ArtCatalog.imageKey(variant), ImageAsset, null,
      (error, image) => error || !image ? reject(error ?? new Error('资源缺失')) : resolve(image))));
    return this.raceBudget(scope, this.loadResourceImage(variant));
  }
  private loadResourceImage(variant: ArtVariant): Promise<ImageAsset> {
    return new Promise<ImageAsset>((resolve, reject) => resources.load(ArtCatalog.imageKey(variant), ImageAsset,
      (error, image) => error || !image ? reject(error ?? new Error('资源缺失')) : resolve(image)));
  }
  private loadBundle(name: string, scope: LoadScope): Promise<AssetManager.Bundle> {
    const ready = this.bundles.get(name); if (ready) return Promise.resolve(ready);
    const pending = this.bundleLoads.get(name); if (pending) return this.raceBudget(scope, pending);
    const task = this.raceBudget(scope, new Promise<AssetManager.Bundle>((resolve, reject) => assetManager.loadBundle(name,
      (error, bundle) => error || !bundle ? reject(error ?? new Error(`Bundle 缺失: ${name}`)) : resolve(bundle))))
      .then(bundle => {
        if (this.scope === scope && scope.generation === this.generation && scope.budget.active) this.bundles.set(name, bundle);
        return bundle;
      });
    this.bundleLoads.set(name, task);
    const clear = (): void => { if (this.bundleLoads.get(name) === task) this.bundleLoads.delete(name); };
    void task.then(clear, clear);
    return task;
  }
  private releaseImage(variant: ArtVariant): void {
    if (!variant.bundle) { resources.release(ArtCatalog.imageKey(variant), ImageAsset); return; }
    this.bundles.get(variant.bundle)?.release(ArtCatalog.imageKey(variant), ImageAsset);
  }
  private assertAlive(): void { if (this.disposed) throw new Error('美术资源持有者已销毁'); }
}
