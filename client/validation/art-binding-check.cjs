const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const { ArtCatalog } = require(path.join(root, 'temp/p1a-core/presentation/ArtCatalog.js'));
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const data = read('client/assets/resources/art/p1/catalog.json');
const library = read('assets/library/catalog.json');
const rules = read('config/design-baseline.json');
const catalog = new ArtCatalog(data);
const canonical = new Map(library.assets.map(a => [a.asset_id, a]));
let libraryPngs = 0;
for (const asset of library.assets) {
  for (const variant of asset.library_variants) {
    const bytes = fs.readFileSync(path.join(root, variant.library_path));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), variant.sha256, 'canonical library image hash');
    libraryPngs++;
  }
  for (const source of [...asset.library_sources, ...asset.library_contracts]) assert.ok(fs.existsSync(path.join(root, source.library_path)));
  for (const source of asset.library_engine_files) assert.ok(fs.existsSync(path.join(root, source.entry)));
}
for (const variant of data.variants) {
  const bytes = fs.readFileSync(path.join(root, variant.png));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], variant.size);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, variant.sha256, `${variant.png} differs from delivery registry`);
  assert.ok(canonical.get(variant.asset_id)?.library_variants.some(v => v.sha256 === hash), 'must match a canonical delivered variant');
}
const active = [];
for (const item of rules.ingredients) {
  const id = ArtCatalog.ingredientId(item.id);
  const edge = ArtCatalog.ingredientEdgeDu(item.radius_du);
  const variant = catalog.select(id, edge * 2);
  assert.ok(Math.abs(edge * 0.9 - item.radius_du * 2) < 1e-9, 'subject diameter must match collider');
  assert.deepEqual(ArtCatalog.pivot(variant), [0.5, 0.5]);
  active.push({ assetId: id, level: item.level, image: variant.png, imagePixels: variant.size,
    colliderRadiusDu: item.radius_du, spriteEdgeDu: edge });
}
for (const suffix of ['back', 'tea', 'rim_back', 'front', 'rim_front', 'base', 'label']) {
  const assetId = `spr_cup_classic_${suffix}`;
  const variant = catalog.select(assetId, 1000);
  assert.deepEqual(variant.size, [750, 1000]); assert.deepEqual(ArtCatalog.pivot(variant), [0, 0]);
  active.push({ assetId, image: variant.png, canvas: [750, 1000], worldOriginDu: [0, 200], trim: false });
}
for (const id of ['bg_shop_base', 'spr_cup_shadow']) active.push({ assetId: id, image: catalog.select(id, 1334).png });
assert.equal(active.length, 18);
assert.equal(catalog.ids.length, 81);
assert.throws(() => catalog.select('not_a_real_asset', 128), /缺少美术资源/);
assert.throws(() => catalog.select(catalog.ids[0], NaN), /目标贴图尺寸/);
const badInsets = structuredClone(data); badInsets.variants[0].nine_slice = '9999,0,9999,0';
assert.throws(() => new ArtCatalog(badInsets), /无效九切/);
const duplicate = structuredClone(data); duplicate.variants.push(duplicate.variants[0]);
assert.throws(() => new ArtCatalog(duplicate), /重复美术路径/);
assert.ok(data.variants.every(v => !v.asset_id.startsWith('marketing_screenshot_')), 'release screenshot templates cannot become game textures');
console.log(JSON.stringify({ status: 'PASS', scope: 'delivered_file_integrity_catalog_selection_and_visual_geometry',
  libraryAssetIds: library.assets.length, libraryStaticIds: library.assets.filter(a => a.library_variants.length).length,
  verifiedLibraryPngs: libraryPngs,
  p1AssetIds: catalog.ids.length, verifiedPngs: data.variants.length, activeSceneAssetIds: active.length,
  galleryAssetIds: catalog.ids.length, bindings: active,
  notRun: ['Creator_import', 'Cocos_render', 'physics_alignment_in_runtime', 'GPU_texture_compression', 'device_UI'] }, null, 2));
