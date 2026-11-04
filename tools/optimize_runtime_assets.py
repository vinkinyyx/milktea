"""Create smaller runtime derivatives only in an isolated build; never edit source art."""
from pathlib import Path
import hashlib,json
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def optimize(project:Path,evidence:Path):
 project=project.resolve()
 if not project.is_relative_to(ROOT/'build-artifacts/cocos-p1b-build-source'):raise ValueError('Isolated build required')
 records=[]
 def resize(p,width=None,height=None,factor=None):
  before=digest(p)
  with Image.open(p) as source:
   old=source.size;scale=factor if factor is not None else min(1,(width or old[0])/old[0],(height or old[1])/old[1]);new=tuple(max(1,round(n*scale)) for n in old)
   if new!=old:
    im=source.resize(new,Image.Resampling.LANCZOS)
    if p.suffix.lower() in ('.jpg','.jpeg'):im.convert('RGB').save(p,quality=87,optimize=True)
    else:im.save(p,optimize=True)
  records.append({'path':p.relative_to(project).as_posix(),'originalSize':list(old),'size':list(new),'originalSha256':before,'sha256':digest(p),'rgbaBefore':old[0]*old[1]*4,'rgbaAfter':new[0]*new[1]*4})
  return list(new)
 cp=project/'assets/resources/art/p1/catalog.json';catalog=json.loads(cp.read_text(encoding='utf-8-sig'))
 for v in catalog['variants']:
  p=project/v['png'];asset=v['asset_id']
  if asset.startswith('spr_cup_classic_'):v['display_size']=list(v['size']);size=resize(p,height=500)
  elif asset.startswith('bg_'):size=resize(p,width=600)
  elif asset.startswith('spr_ing_'):size=resize(p,width=256,height=256)
  elif asset=='ui_title_logo':size=resize(p,width=600)
  else:size=resize(p)
  v['size']=size;v['sha256']=digest(p)
 cp.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 fx=project/'assets/resources/effects/v2';fp=fx/'catalog.json'
 if fp.exists():
  data=json.loads(fp.read_text(encoding='utf-8-sig'))
  for item in data['items']:
   p=fx/item['path']
   if '_sheet_4col' in p.name:resize(p,factor=.5);item['frameSize']=[96,96]
   elif item.get('id')=='cat_barista':resize(p,height=256)
   item['sha256']=digest(p);item['bytes']=p.stat().st_size
  fp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 report={'scope':'build-only derivatives; authored cup dimensions preserved','images':records,'rgbaBefore':sum(r['rgbaBefore'] for r in records),'rgbaAfter':sum(r['rgbaAfter'] for r in records)}
 evidence.mkdir(parents=True,exist_ok=True);(evidence/'texture-optimization.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 return report
