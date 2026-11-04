import { assetManager, AssetManager, ImageAsset, JsonAsset, Node, resources, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { ArtCatalog, ArtVariant } from './ArtCatalog';

interface LoadedArt { variant: ArtVariant; image: ImageAsset; texture: Texture2D; frame: SpriteFrame }

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
  async initialize(): Promise<void> {
    const json = await new Promise<JsonAsset>((resolve, reject) => resources.load('art/p1/catalog', JsonAsset,
      (error, asset) => error || !asset ? reject(error ?? new Error('美术索引缺失')) : resolve(asset)));
    this.assertAlive();
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
    this.disposed = true; this.generation++;
    for (const art of this.loaded.values()) { art.frame.destroy(); art.texture.destroy(); art.image.decRef(); this.releaseImage(art.variant); }
    this.loaded.clear(); this.pending.clear(); this.registry?.decRef(); this.registry = null;
  }
  private acquire(assetId: string, targetPixels: number): Promise<LoadedArt> {
    this.assertAlive();
    const loaded = this.loaded.get(assetId); if (loaded) return Promise.resolve(loaded);
    const pending = this.pending.get(assetId); if (pending) return pending;
    const variant = this.catalog.select(assetId, targetPixels);
    const generation = this.generation;
    const task = this.loadImage(variant).then(image => {
        if (this.disposed || generation !== this.generation) { this.releaseImage(variant); throw new Error('美术加载已取消：资源owner已失效'); }
        if (!image) throw new Error(`图片加载失败 ${assetId}: 资源缺失`);
        if (image.width !== variant.size[0] || image.height !== variant.size[1]) {
          this.releaseImage(variant);
          throw new Error(`图片尺寸不符: ${assetId}`);
        }
        image.addRef();
        const texture = new Texture2D(); texture.image = image;
        const frame = new SpriteFrame(); frame.texture = texture; frame.packable = false;
        const insets = ArtCatalog.insets(variant);
        if (insets) [frame.insetLeft, frame.insetTop, frame.insetRight, frame.insetBottom] = insets;
        const art = { variant, image, texture, frame }; this.loaded.set(assetId, art); return art;
      }).catch(error => { throw new Error(`图片加载失败 ${assetId}: ${error instanceof Error ? error.message : String(error)}`); });
    this.pending.set(assetId, task);
    void task.then(() => { if (this.pending.get(assetId) === task) this.pending.delete(assetId); }, () => { if (this.pending.get(assetId) === task) this.pending.delete(assetId); });
    return task;
  }
  private async loadImage(variant: ArtVariant): Promise<ImageAsset> {
    if (!variant.bundle) return new Promise((resolve, reject) => resources.load(ArtCatalog.imageKey(variant), ImageAsset,
      (error, image) => error || !image ? reject(error ?? new Error('资源缺失')) : resolve(image)));
    let bundle: AssetManager.Bundle;
    try { bundle = await this.loadBundle(variant.bundle); }
    catch { return await new Promise((resolve, reject) => resources.load(ArtCatalog.imageKey(variant), ImageAsset,
      (error, image) => error || !image ? reject(error ?? new Error('资源缺失')) : resolve(image))); }
    return await new Promise((resolve, reject) => bundle.load(ArtCatalog.imageKey(variant), ImageAsset, null,
      (error, image) => error || !image ? reject(error ?? new Error('资源缺失')) : resolve(image)));
  }
  private loadBundle(name: string): Promise<AssetManager.Bundle> {
    const ready = this.bundles.get(name); if (ready) return Promise.resolve(ready);
    const pending = this.bundleLoads.get(name); if (pending) return pending;
    const task = new Promise<AssetManager.Bundle>((resolve, reject) => assetManager.loadBundle(name,
      (error, bundle) => error || !bundle ? reject(error ?? new Error(`Bundle 缺失: ${name}`)) : resolve(bundle)))
      .then(bundle => { this.bundles.set(name, bundle); return bundle; });
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
