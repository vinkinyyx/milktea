"""Audit delivered art without executing vendor scripts or modifying original artwork."""
from __future__ import annotations
from pathlib import Path
from collections import Counter
import argparse,csv,hashlib,html,json,re,shutil,zipfile
import xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
from asset_library_paths import AUDIT_OUT, SETTINGS
OUT=AUDIT_OUT
DELIVERY=[ROOT/"assets"/p for p in ["P1","P2","P3","P4"]]
EXCLUDED={"preview","previews","qa","phase_qa","reference","source_refs","source_p1_refs","reference_assets","original_spec"}
def relative(p):return p.relative_to(ROOT).as_posix()
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ident(p):return re.split(r"@|\.CONTRACT",p.stem,flags=re.I)[0]
def original_files():
 return sorted([f for root in DELIVERY for f in root.rglob("*") if f.is_file()],key=relative)
def eligible(p):return not any(x.lower() in EXCLUDED for x in p.parts)
def quality(p):
 with Image.open(p) as im:
  im.load();rgba=im.convert("RGBA");a=rgba.getchannel("A");bbox=a.getbbox()
  return {"path":relative(p),"sha256":digest(p),"bytes":p.stat().st_size,"size":list(im.size),"mode":im.mode,
   "format":im.format,"alpha_range":list(a.getextrema()),"alpha_bbox":list(bbox) if bbox else None,
   "transparent_fraction":round(a.histogram()[0]/(im.width*im.height),6),
   "color_profile":"ICC" if im.info.get("icc_profile") else "sRGB_chunk" if "srgb" in im.info else "gamma_only" if "gamma" in im.info else "unspecified"}
def score(p):
 text=relative(p).lower()
 value=0
 if "/runtime/" in text:value+=100
 if "/export_png/" in text or "/exports/" in text:value+=60
 if "/cup_layers/" in text or "/stage_cards/" in text or "/ui/" in text:value+=50
 if any(x in text for x in ["source_","/source/","master_","/master/"]):value-=100
 return value
def resolve():
 expected=json.loads((ROOT/"assets/image-elements.json").read_text(encoding="utf-8"))["assets"]
 files=original_files();byid={}
 for p in files:
  if eligible(p):byid.setdefault(ident(p),[]).append(p)
 rows=[];errors=[]
 for spec in expected:
  aid=spec["asset_id"]; candidates=byid.get(aid,[])
  if aid=="marketing_tap_cover":candidates += [p for p in files if p.name=="marketing_tap_cover_1920x1080.png"]
  if aid=="marketing_wechat_icon":candidates += [p for p in files if p.name in ["marketing_wechat_icon_512.png","marketing_wechat_icon_master_1024.png"]]
  candidates=list(dict.fromkeys(candidates))
  pngs=[p for p in candidates if p.suffix.lower()==".png" and score(p)>=0]
  sources=[p for p in candidates if p.suffix.lower() in [".svg",".ora",".psd",".kra"]]
  # Some reviewed source filenames carry an explicit reuse suffix.
  if aid=="marketing_wechat_icon":sources += [p for p in files if p.name=="marketing_wechat_icon_reused_P2.ora"]
  code=[p for p in candidates if p.suffix.lower() in [".mjs",".js",".ts"]]
  contracts=[p for p in candidates if p.suffix.lower()==".json"]
  if spec["production_method"]=="platform" and spec["first_phase"]=="P3-B":
   contracts += [p for p in files if p.name=="runtime_contracts.json" and "/platform/" in relative(p)]
  warnings=[];fail=[];variants=[];source_records=[]
  dims=set((int(a),int(b)) for a,b in re.findall(r"(\d+)x(\d+)",spec["export_spec"]))
  if aid=="marketing_wechat_icon":dims={(512,512)}
  if aid=="marketing_tap_cover":dims={(1920,1080)}
  for p in pngs:
   try:q=quality(p)
   except Exception as exc:fail.append("UNREADABLE:"+relative(p)+":"+str(exc));continue
   size=tuple(q["size"])
   if dims and size not in dims:continue
   if spec["alpha"]=="yes" and (q["alpha_range"][0]!=0 or q["alpha_range"][1]==0):fail.append("ALPHA_INVALID:"+relative(p))
   if spec["alpha"]=="no" and q["alpha_range"][0]!=255:fail.append("EXPECTED_OPAQUE:"+relative(p))
   if q["color_profile"]=="unspecified":warnings.append("COLOR_PROFILE_UNSPECIFIED:"+relative(p))
   q["rank"]=score(p);variants.append(q)
  # One canonical export per required size; additional downscaled convenience copies stay in delivery.
  chosen=[]
  for size in sorted({tuple(x["size"]) for x in variants}):
   bucket=sorted([q for q in variants if tuple(q["size"])==size],key=lambda q:(-q["rank"],q["path"]))
   if len({q["sha256"] for q in bucket if q["rank"]==bucket[0]["rank"]})>1:fail.append("AMBIGUOUS_SAME_PRIORITY:"+str(size))
   chosen.append(bucket[0])
  actual={tuple(x["size"]) for x in chosen}
  if spec["production_method"] in ["new_draw","derived"] and spec["required"]!="candidate":
   missing=dims-actual
   if not chosen:fail.append("MISSING_STATIC_EXPORT")
   elif missing:fail.append("MISSING_SIZE:"+str(sorted(missing)))
  for p in sources:
   record={"path":relative(p),"sha256":digest(p),"kind":p.suffix[1:]}
   try:
    if p.suffix.lower()==".svg":
     raw=p.read_text(encoding="utf-8-sig");el=ET.fromstring(raw)
     record.update(width=el.get("width"),height=el.get("height"),viewBox=el.get("viewBox"))
     # Do not execute active SVG content.
     if re.search(r"<(?:script|foreignObject)\b|\bon\w+\s*=",raw,re.I):fail.append("ACTIVE_SVG:"+relative(p))
     record["embedded_raster"]=bool(re.search(r"<image\b",raw))
    elif p.suffix.lower()==".ora":
     with zipfile.ZipFile(p) as z:
      assert z.testzip() is None
      stack=ET.fromstring(z.read("stack.xml"));record["layers"]=len(stack.findall(".//layer"))
      record["canvas"]=[int(stack.attrib["w"]),int(stack.attrib["h"])]
      record["layer_names"]=[layer.get('name') for layer in stack.findall('.//layer')]
      record["reconstructed_from_raster"]='layered_recovery' in relative(p)
   except Exception as exc:fail.append("SOURCE_INVALID:"+relative(p)+":"+str(exc))
   source_records.append(record)
  if aid.startswith("spr_ing_"):
   masters=[p for p in candidates if p.suffix.lower()==".png" and "source_master_1024" in relative(p)]
   source_records += [dict(quality(p),kind="flattened_png_not_layered") for p in masters]
   if not sources:warnings.append("MISSING_EDITABLE_INGREDIENT_LAYERS")
   elif any(s.get('reconstructed_from_raster') for s in source_records):warnings.append('RECONSTRUCTED_INGREDIENT_LAYERS_REVIEW_REQUIRED')
   for p in masters:
    with Image.open(p).convert("RGBA") as im:
     box=im.getchannel("A").point(lambda v:255 if v>=32 else 0).getbbox()
     if box:
      cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2
      if abs(cx-512)>8 or abs(cy-512)>8:warnings.append("INGREDIENT_CENTER_REVIEW")
  if spec["production_method"]=="new_draw" and spec["required"]!="candidate" and not sources and not aid.startswith("spr_ing_"):
   warnings.append("EDITABLE_SOURCE_NOT_FOUND")
  if spec["nine_slice"]!="none" and chosen:
   l,t,r,b=map(int,spec["nine_slice"].split(","))
   for v in chosen:
    w,h=v["size"]
    if l+r>w or t+b>h:fail.append("NINE_SLICE_INVALID")
  if aid.startswith("spr_cup_") and aid!="spr_cup_shadow":warnings.append("CUP_GEOMETRY_STATIC_ALIGNMENT_ONLY_ENGINE_CONTACT_PENDING")
  if aid.startswith("marketing_screenshot_"):warnings.append("TEMPLATE_NOT_REAL_GAME_SCREENSHOT")
  if aid.startswith("marketing_") and spec["first_phase"]=="P4-D":warnings.append("PLATFORM_RELEASE_SIZE_REVIEW_PENDING")
  method=spec["production_method"]
  if spec["required"]=="candidate":status="candidate_not_required"
  elif method=="platform":status="platform_dependency" if contracts else "platform_contract_missing"
  elif method=="engine":status="engine_source_only" if code else "missing_engine_source"
  elif fail:status="blocked_static"
  elif warnings:status="conditional_static"
  else:status="static_pass"
  rows.append({"asset_id":aid,"name_zh":spec["name_zh"],"first_phase":spec["first_phase"],"required":spec["required"],
   "category":spec["category"],"production_method":method,"status":status,"warnings":sorted(set(warnings)),"failures":sorted(set(fail)),
   "variants":chosen,"sources":source_records,"engine_files":[{"path":relative(p),"sha256":digest(p)} for p in code],
   "contracts":[{"path":relative(p),"sha256":digest(p)} for p in dict.fromkeys(contracts)],"pivot":spec["pivot"],"nine_slice":spec["nine_slice"],
   "runtime_du":spec["runtime_du"],"export_spec":spec["export_spec"]})
 return rows,files
def write_audit(rows,files):
 OUT.mkdir(parents=True,exist_ok=True)
 summary={"date":"2026-10-27","scope":"Independent file audit and visual contact-sheet inspection; no game-engine approval",
  "original_files":len(files),"expected_assets":len(rows),"status_counts":dict(Counter(x["status"] for x in rows)),
  "static_ids_with_exports":sum(bool(x["variants"]) for x in rows),
  "missing_static_ids":[x["asset_id"] for x in rows if "MISSING_STATIC_EXPORT" in x["failures"]],
  "missing_engine_ids":[x["asset_id"] for x in rows if x["status"]=="missing_engine_source"],
  "source_layer_gap":[x["asset_id"] for x in rows if "MISSING_EDITABLE_INGREDIENT_LAYERS" in x["warnings"]],
  "reconstructed_layer_sources":[x['asset_id'] for x in rows if 'RECONSTRUCTED_INGREDIENT_LAYERS_REVIEW_REQUIRED' in x['warnings']],
  "assets":rows,"not_run":["Cocos import","device rendering and compressed texture check","physics contact alignment","real platform artwork approval","unreviewed vendor scripts"]}
 (OUT/"audit.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 columns=["asset_id","name_zh","first_phase","production_method","required","status","failures","warnings","variants","sources"]
 with (OUT/"audit.csv").open("w",encoding="utf-8-sig",newline="") as f:
  w=csv.DictWriter(f,fieldnames=columns);w.writeheader()
  for row in rows:w.writerow({k:"; ".join(v["path"] for v in row[k]) if k in ["variants","sources"] else "; ".join(row[k]) if isinstance(row[k],list) else row[k] for k in columns})
 # Hash every delivery byte, so integration can prove source preservation.
 (OUT/"original-hashes.json").write_text(json.dumps({relative(p):digest(p) for p in files},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 font=ImageFont.truetype("C:/Windows/Fonts/msyh.ttc",12)
 drawable=[r for r in rows if r["variants"]]
 for page in range((len(drawable)+35)//36):
  subset=drawable[page*36:(page+1)*36];sheet=Image.new("RGB",(1200,1440),"#fff7ec");d=ImageDraw.Draw(sheet)
  for i,r in enumerate(subset):
   v=max(r["variants"],key=lambda x:x["size"][0]);im=Image.open(ROOT/v["path"]).convert("RGBA");im.thumbnail((180,180))
   x=(i%6)*200;y=(i//6)*240
   for yy in range(y,y+190,10):
    for xx in range(x,x+190,10):
     if ((xx-x)//10+(yy-y)//10)%2==0:d.rectangle((xx,yy,xx+9,yy+9),fill="#e6dfd5")
   sheet.paste(im,(x+(190-im.width)//2,y+(190-im.height)//2),im)
   label=r["asset_id"];d.text((x+3,y+193),label[:25],fill="#3d2a23",font=font);d.text((x+3,y+211),label[25:],fill="#3d2a23",font=font)
  sheet.save(OUT/("contact-%02d.png"%(page+1)))
 print(json.dumps({k:v for k,v in summary.items() if k!="assets"},ensure_ascii=True))
def main():
 rows,files=resolve();write_audit(rows,files)
if __name__=="__main__":main()

