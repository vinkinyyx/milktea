"""Verify current V2 catalog bindings, file hashes and image sizes; optional package check."""
from pathlib import Path
import argparse,hashlib,json,zipfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT/ROOT.name
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--package',type=Path);args=ap.parse_args()
 catalog=json.loads((PROJECT/'assets/resources/art/p1/catalog.json').read_text(encoding='utf-8-sig'))
 errors=[];variants=catalog['variants'];ids=set();hashes=set();paths=set()
 if catalog.get('theme')!='milktea-v2':errors.append('runtime catalog theme is not milktea-v2')
 for v in variants:
  asset_id=v['asset_id'];p=(PROJECT/v['png']).resolve()
  if asset_id in ids:errors.append(f'duplicate asset id: {asset_id}')
  ids.add(asset_id);paths.add(p)
  if not p.is_relative_to(PROJECT/'assets/resources/art/p1/v2'):
   errors.append(f'non-V2 binding: {asset_id}');continue
  if not p.is_file():errors.append(f'missing file: {asset_id}');continue
  digest=hashlib.sha256(p.read_bytes()).hexdigest();hashes.add(digest)
  if digest!=v['sha256']:errors.append(f'hash mismatch: {asset_id}')
  with Image.open(p) as im:
   if list(im.size)!=v['size']:errors.append(f'size mismatch: {asset_id}')
   if 'A' in im.getbands() and im.getchannel('A').getbbox() is None:errors.append(f'empty transparent image: {asset_id}')
  if not v['resource_key'].startswith('art/p1/v2/'):errors.append(f'old resource key: {asset_id}')
  if v.get('source') and not (ROOT/v['source']).is_file():errors.append(f'missing original source: {asset_id}')
 cfg=json.loads((ROOT/'config/design-baseline.json').read_text(encoding='utf-8-sig'))
 required={f"spr_ing_{i['id']}_base" for i in cfg['ingredients']}|{f'spr_cup_classic_{suffix}' for suffix in ('back','tea','rim_back','front','rim_front','base','label')}|{'bg_shop_base','spr_cup_shadow','ui_title_logo'}
 errors.extend('required binding missing: '+x for x in sorted(required-ids))
 actual={p.resolve() for p in (PROJECT/'assets/resources/art/p1/v2').iterdir() if p.suffix.lower() in ('.png','.jpg','.jpeg')}
 if actual!=paths:errors.append('runtime V2 image directory differs from selected catalog')
 package_count=None
 if args.package:
  with zipfile.ZipFile(args.package) as z:
   if z.testzip() is not None:errors.append('package CRC failed')
   packaged={hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.lower().endswith(('.png','.jpg','.jpeg'))}
   package_count=len(hashes&packaged)
   if package_count!=len(hashes):errors.append('package is missing selected V2 images')
 result={'status':'PASS' if not errors else 'FAIL','selectedImages':len(variants),'packageImagesPresent':package_count,'errors':errors,'scope':'Static source/package integrity; does not verify Cocos rendering or touch behavior.'}
 print(json.dumps(result,ensure_ascii=False,indent=2));return bool(errors)
if __name__=='__main__':raise SystemExit(main())
