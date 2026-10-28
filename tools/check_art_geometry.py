"""Geometry and derivative checks on delivered art. Originals stay read-only."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math,re
ROOT=Path(__file__).resolve().parents[1]
from asset_library_paths import AUDIT_OUT
OUT=AUDIT_OUT
audit=json.loads((OUT/"audit.json").read_text(encoding="utf-8"))
rows={r["asset_id"]:r for r in audit["assets"]}
cfg=json.loads((ROOT/"config/design-baseline.json").read_text(encoding="utf-8"))
results={"geometry":[],"ingredients":[],"derived_detail":[],"scope":"Static geometry/numerical checks, not a physics-engine run"}
font=ImageFont.truetype("C:/Windows/Fonts/msyh.ttc",19)
sheet=Image.new("RGB",(1500,900),"#fff7ec")
for i,stage in enumerate(cfg["stages"]):
 sid=stage["id"];scale=stage["cup_width_scale"];back=rows["spr_cup_"+sid+"_back"]
 src=next(s for s in back["sources"] if s["kind"]=="svg")
 text=(ROOT/src["path"]).read_text(encoding="utf-8")
 match=re.search(r'<clipPath[^>]*>\s*<path[^>]*d="([^"]+)"',text)
 expected=[375-260*scale,140,375+260*scale,140,375+180*scale,940]
 actual=[float(x) for x in re.findall(r"[-+]?\d*\.?\d+",match[1])][:6] if match else []
 error=max(abs(a-b) for a,b in zip(actual,expected)) if len(actual)==len(expected) else None
 # Q375 945 <bottom-left> 940 is the decorative curved base; compare anchor, not its control point.
 values=[float(x) for x in re.findall(r"[-+]?\d*\.?\d+",match[1])] if match else []
 left_ok=len(values)>=10 and abs(values[-2]-(375-180*scale))<.01 and abs(values[-1]-940)<.01
 results["geometry"].append({"stage":sid,"spec_anchor_error_du":error,"left_bottom_anchor_matches":left_ok,"static_pass":error is not None and error<.01 and left_ok,"note":"Decorative bottom curve remains non-physical; Cocos contact overlay still required"})
 canvas=Image.new("RGBA",(750,1000),(255,247,236,255))
 for layer in ["back","tea"]:
  v=rows["spr_cup_"+sid+"_"+layer]["variants"][0];canvas.alpha_composite(Image.open(ROOT/v["path"]).convert("RGBA"))
 for j,ing in enumerate(cfg["ingredients"]):
  v=max(rows["spr_ing_"+ing["id"]+"_base"]["variants"],key=lambda v:v["size"][0])
  im=Image.open(ROOT/v["path"]).convert("RGBA");diam=round(2*ing["radius_du"]/.9);im=im.resize((diam,diam),Image.Resampling.LANCZOS)
  x=round(375+([-100,0,100][j%3])*scale-diam/2);y=round(830-(j//3)*210-diam/2)
  canvas.alpha_composite(im,(x,y))
 for layer in ["front","rim_back","rim_front","base","label"]:
  v=rows["spr_cup_"+sid+"_"+layer]["variants"][0];canvas.alpha_composite(Image.open(ROOT/v["path"]).convert("RGBA"))
 d=ImageDraw.Draw(canvas);d.line([(375-260*scale,140),(375-180*scale,940),(375+180*scale,940),(375+260*scale,140)],fill="#B93838",width=2)
 d.line([(100,200),(650,200)],fill="#b93838",width=1)
 # A diagnostic composition, not a gameplay screenshot or a revised asset.
 canvas.thumbnail((300,750));sheet.paste(canvas.convert("RGB"),(i*300,80));ImageDraw.Draw(sheet).text((i*300+8,25),sid,fill="#3d2a23",font=font)
 for v in rows["spr_cup_"+sid+"_front"]["variants"]:
  with Image.open(ROOT/v["path"]).convert("RGBA") as im:
   a=im.getchannel("A")
   # Ratio of opacity-weighted covered pixels relative to trapezoidal inner area.
   hist=a.histogram(); weighted=sum(k*n/255 for k,n in enumerate(hist))/(440*scale*800)
   results["geometry"][-1]["front_opacity_weighted_area_ratio"]=round(weighted,5)
sheet.save(OUT/"cup-geometry-overlay.png")
ImageDraw.Draw(sheet).text((20,820),"STATIC REGISTRATION ONLY - ingredient positions are not physics-solved; NOT A GAME SCREENSHOT",fill="#3d2a23",font=font)
sheet.save(OUT/"cup-geometry-overlay.png")
for ing in cfg["ingredients"]:
 aid="spr_ing_"+ing["id"]+"_base";r=rows[aid]
 master=next(s for s in r["sources"] if s["kind"]=="flattened_png_not_layered")
 with Image.open(ROOT/master["path"]).convert("RGBA") as im:
  alpha=im.getchannel("A");pixels=alpha.load();radii=[]
  for angle in range(360):
   a=angle*math.pi/180;last=0
   for distance in range(380,510):
    x=round(512+math.cos(a)*distance);y=round(512+math.sin(a)*distance)
    if pixels[x,y]>=32:last=distance
   if last:radii.append(last)
  results["ingredients"].append({"asset_id":aid,"angles_sampled":len(radii),"radius_expected_px":460.8,
   "radius_min_px":min(radii),"radius_max_px":max(radii),"max_radial_deviation_ratio":round(max(abs(r-460.8)/460.8 for r in radii),5),"passes_8_percent":len(radii)==360 and max(abs(r-460.8)/460.8 for r in radii)<=.08})
  detail=rows["ui_ing_"+ing["id"]+"_detail"]["variants"][0]
  expected=im.resize(tuple(detail["size"]),Image.Resampling.LANCZOS);actual=Image.open(ROOT/detail["path"]).convert("RGBA")
  results["derived_detail"].append({"asset_id":"ui_ing_"+ing["id"]+"_detail","matches_p1_master_lanczos":expected.tobytes()==actual.tobytes()})
(OUT/"geometry-and-derivatives.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(results,ensure_ascii=True))

