export interface ArtVariant {
  asset_id: string;
  png: string;
  size: [number, number];
  sha256: string;
  resource_key: string;
  pivot: string;
  nine_slice: string;
}

/** Reads the delivered registry. No image paths or ingredient radii are duplicated here. */
export class ArtCatalog {
  private readonly byId = new Map<string, ArtVariant[]>();
  constructor(raw: unknown) {
    const catalog = raw as { variants?: ArtVariant[] };
    if (!catalog || !Array.isArray(catalog.variants) || catalog.variants.length === 0) throw new Error('美术索引 variants 缺失');
    for (const v of catalog.variants) {
      if (!v.asset_id || !v.resource_key?.startsWith('art/p1/') || !v.resource_key.endsWith('/spriteFrame') ||
        !Array.isArray(v.size) || v.size.length !== 2 || !v.size.every(n => Number.isInteger(n) && n > 0)) {
        throw new Error(`无效美术索引: ${v.asset_id ?? 'unknown'}`);
      }
      ArtCatalog.pivot(v); ArtCatalog.insets(v);
      const variants = this.byId.get(v.asset_id) ?? [];
      if (variants.some(other => other.resource_key === v.resource_key)) throw new Error(`重复美术路径: ${v.resource_key}`);
      variants.push(v); this.byId.set(v.asset_id, variants);
    }
    for (const variants of this.byId.values()) variants.sort((a, b) => Math.max(...a.size) - Math.max(...b.size));
  }
  get ids(): string[] { return Array.from(this.byId.keys()); }
  select(assetId: string, targetPixels: number): ArtVariant {
    if (!Number.isFinite(targetPixels) || targetPixels <= 0) throw new Error('目标贴图尺寸必须为正有限数');
    const variants = this.byId.get(assetId);
    if (!variants) throw new Error(`缺少美术资源: ${assetId}`);
    return variants.find(v => Math.max(...v.size) >= targetPixels) ?? variants[variants.length - 1];
  }
  static imageKey(variant: ArtVariant): string { return variant.resource_key.replace(/\/spriteFrame$/, ''); }
  static pivot(variant: ArtVariant): [number, number] {
    const values = variant.pivot.split(',').map(Number);
    if (values.length !== 2 || values.some(n => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error(`无效锚点: ${variant.asset_id}`);
    return values as [number, number];
  }
  static insets(variant: ArtVariant): [number, number, number, number] | null {
    if (variant.nine_slice === 'none') return null;
    const values = variant.nine_slice.split(',').map(Number);
    if (values.length !== 4 || values.some(n => !Number.isFinite(n) || n < 0) ||
      values[0] + values[2] > variant.size[0] || values[1] + values[3] > variant.size[1]) throw new Error(`无效九切: ${variant.asset_id}`);
    return values as [number, number, number, number];
  }
  static ingredientId(configId: string): string { return `spr_ing_${configId}_base`; }
  static ingredientEdgeDu(radiusDu: number): number {
    if (!Number.isFinite(radiusDu) || radiusDu <= 0) throw new Error('小料半径必须为正有限数');
    return 2 * radiusDu / 0.9;
  }
}
