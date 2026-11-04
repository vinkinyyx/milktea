"""Verify build derivatives against original art hashes and the final Tap ZIP."""
from pathlib import Path
from PIL import Image
import argparse,hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--build-id',required=True);ap.add_argument('--evidence-dir',required=True);ap.add_argument('--package',type=Path,required=True);a=ap.parse_args()
 project=ROOT/'build-artifacts/cocos-p1b-build-source'/a.build_id;evidence=ROOT/a.evidence_dir
 source=json.loads((ROOT/ROOT.name/'assets/resources/art/p1/catalog.json').read_text(encoding='utf-8-sig'));catalog=json.loads((project/'assets/resources/art/p1/catalog.json').read_text(encoding='utf-8-sig'))
 transforms=json.loads((evidence/'texture-optimization.json').read_text(encoding='utf-8'));transform={x['path']:x for x in transforms['images']};original={v['asset_id']:v for v in source['variants']};errors=[];derived=[]
 for v in catalog['variants']:
  src=original[v['asset_id']];record=transform[src['png']];p=project/v['png']
  if record['originalSha256']!=src['sha256'] or sha(p)!=v['sha256'] or record['sha256']!=v['sha256']:errors.append('art provenance '+v['asset_id'])
  with Image.open(p) as im:
   if list(im.size)!=v['size']:errors.append('art dimensions '+v['asset_id'])
  if v['asset_id'].startswith('spr_cup_classic_') and v.get('display_size')!=src['size']:errors.append('cup DU changed')
  derived.append(v['sha256'])
 if len(derived)!=71:errors.append('expected original 71 mappings')
 fx=project/'assets/resources/effects/v2';fxc=json.loads((fx/'catalog.json').read_text(encoding='utf-8'))
 for item in fxc['items']:
  p=fx/item['path']
  if sha(p)!=item['sha256']:errors.append('effect hash '+item['id'])
  derived.append(item['sha256'])
 with zipfile.ZipFile(a.package) as z:
  if z.testzip():errors.append('ZIP CRC')
  packaged={hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.lower().endswith(('.png','.jpg','.jpeg'))}
  if not set(derived)<=packaged:errors.append('derived asset missing in ZIP')
  if any(n.endswith('.map') for n in z.namelist()):errors.append('source maps')
  for n in z.namelist():
   if n.endswith('.js') and any(term.encode() in z.read(n) for term in ['__P1B_FIXTURES__','__P1B_DIAGNOSTICS__','FakeRewardedAdProvider','debug-mock','rewardedMock']):errors.append('debug API '+n)
 result={'status':'PASS' if not errors else 'FAIL','artMappings':len(catalog['variants']),'effectMappings':len(fxc['items']),'packageAssetsPresent':len(set(derived)&packaged),'rgbaBefore':transforms['rgbaBefore'],'rgbaAfter':transforms['rgbaAfter'],'bytes':a.package.stat().st_size,'sha256':sha(a.package),'errors':errors}
 (evidence/'optimized-asset-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));return bool(errors)
if __name__=='__main__':raise SystemExit(main())
