"""Stage audited original assets and verify every copy. No art rewriting or vendor-code execution."""
from pathlib import Path
import hashlib,json,re,shutil
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
from asset_library_paths import AUDIT_OUT, SETTINGS
OUT=AUDIT_OUT
LIB=ROOT/"assets/library"
CLIENT=ROOT/"client/assets/resources/art/p1"
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):return p.relative_to(ROOT).as_posix()
def copy_exact(src,dest,records):
 dest=dest.resolve();assert dest.is_relative_to(LIB.resolve()) or dest.is_relative_to(CLIENT.resolve())
 expected=sha(src)
 if dest.exists():
  if sha(dest)!=expected:raise RuntimeError("Existing different content must be reviewed, not overwritten: "+rel(dest))
 else:
  dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
 assert sha(dest)==expected
 records[rel(dest)]={"original":rel(src),"sha256":expected,"bytes":dest.stat().st_size}
 return rel(dest)
def main():
 audit=json.loads((OUT/"audit.json").read_text(encoding="utf-8"));copies={};catalog=[];client=[]
 for row in audit["assets"]:
  entry=dict(row);aid=row["asset_id"];phase=row["first_phase"];cat=row["category"]
  entry.update(library_variants=[],library_sources=[],library_engine_files=[],library_contracts=[],usage="not_available")
  template=aid.startswith("marketing_screenshot_")
  if row["variants"] and not row["failures"]:
   entry["usage"]="template_only_not_release" if template else "development_ready_engine_import_pending"
   area="templates" if template else "runtime"
   for v in row["variants"]:
    size="x".join(map(str,v["size"]));name=aid+"@"+size+".png"
    target=copy_exact(ROOT/v["path"],LIB/area/phase/cat/name,copies)
    item=dict(v,library_path=target)
    entry["library_variants"].append(item)
    if phase=="P1" and not template:
     cp=copy_exact(ROOT/v["path"],CLIENT/cat/name,copies)
     client.append({"asset_id":aid,"png":cp,"size":v["size"],"sha256":v["sha256"],"resource_key":"art/p1/"+cat+"/"+Path(name).stem+"/spriteFrame",
      "pivot":row["pivot"],"nine_slice":row["nine_slice"],"runtime_du":row["runtime_du"],
      "warnings":row["warnings"],"import_status":"not_yet_verified_in_Cocos"})
  for src in row["sources"]:
   dest=LIB/"source"/phase/cat/aid/Path(src["path"]).name
   path=copy_exact(ROOT/src["path"],dest,copies)
   entry["library_sources"].append(dict(src,library_path=path))
  for src in row["engine_files"]:
   entry["usage"]="canvas_reference_requires_Cocos_port"
   p=ROOT/src["path"];parent=p.parent
   # Preserve relative helper imports in the same supplied source bundle.
   bundle=[]
   for dep in parent.rglob("*"):
    if not dep.is_file() or dep.suffix.lower() not in [".mjs",".js",".ts",".json",".png"]:continue
    dest=LIB/"engine"/dep.relative_to(ROOT/"assets")
    path=copy_exact(dep,dest,copies);bundle.append(path)
   entry["library_engine_files"].append({"entry":rel(LIB/"engine"/p.relative_to(ROOT/"assets")),"bundle_files":bundle,"execution":"P4A_reference_Node_assertions_passed_Cocos_not_run" if phase=='P4-A' else "not_executed"})
  for src in row["contracts"]:
   path=copy_exact(ROOT/src["path"],LIB/"contracts"/phase/aid/Path(src["path"]).name,copies)
   entry["library_contracts"].append(dict(src,library_path=path))
  if row["status"] in ["platform_dependency","platform_contract_missing"]:entry["usage"]="requires_real_platform_material_not_a_texture"
  if row["status"]=="candidate_not_required":entry["usage"]="not_commissioned_candidate"
  if row["failures"]:entry["usage"]="missing_or_blocked_do_not_load"
  entry["rights_status"]="user_delivery_provenance_recorded_not_independently_cleared"
  catalog.append(entry)
 # Preserve all supplied license statements as evidence, with batch names retained.
 for phase in ["P1","P2","P3","P4"]:
  for p in (ROOT/"assets"/phase).rglob("*"):
   if p.is_file() and p.name.lower() in ["license","license.txt","license.md","copying","notice"]:
    copy_exact(p,LIB/"licenses"/p.relative_to(ROOT/"assets"),copies)
 LIB.mkdir(exist_ok=True)
 (LIB/"catalog.json").write_text(json.dumps({"version":SETTINGS['current_intake'],"date":"2026-10-27","audit_directory":SETTINGS['audit_directory'],"assets":catalog,
  "rules":"Library contains only reviewed copies. Cocos import and device verification are separate. No release approval implied."},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 CLIENT.mkdir(parents=True,exist_ok=True)
 (CLIENT/"catalog.json").write_text(json.dumps({"version":1,"status":"P1_pngs_staged_import_pending","variants":client,
  "load_policy":"Choose one appropriate resolution per asset. Do not preload every resolution.",
  "cup_import":"Cup layers pivot=(0,0), node at world (0,200), keep full 750x1000 canvas, no trim.",
  "ingredient_import":"center pivot, display full sprite edge=2*radiusDu/0.9.",
  "nine_slice":"listed in export pixels left,top,right,bottom; configure sliced SpriteFrame after Creator import.",
  "meta_policy":"Open Creator to generate/confirm .meta; never invent editor UUIDs or claim an unrun import."},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 manifest={"version":1,"copies":copies,"summary":{"copied_files":len(copies),"bytes":sum(x["bytes"] for x in copies.values()),
  "static_asset_ids":sum(bool(r["library_variants"]) for r in catalog),"game_or_marketing_static_ids":sum(r["usage"]=="development_ready_engine_import_pending" for r in catalog),
  "template_only_ids":sum(r["usage"]=="template_only_not_release" for r in catalog),"client_p1_ids":len({r["asset_id"] for r in client}),"client_p1_pngs":len(client)}}
 (OUT/"installation-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 before=json.loads((OUT/"original-hashes.json").read_text(encoding="utf-8"))
 assert all((ROOT/p).is_file() and sha(ROOT/p)==h for p,h in before.items())
 for path,record in copies.items():assert sha(ROOT/path)==record["sha256"]
 # Verify every selected canonical variant is an existing copied file.
 for row in catalog:
  for v in row["library_variants"]:assert v["library_path"] in copies and sha(ROOT/v["library_path"])==v["sha256"]
 result={"status":"pass","scope":"copy_integrity_and_catalog_references","originals_unchanged":len(before),"copies_verified":len(copies),
  "catalog_ids":len(catalog),"client_p1_ids":len({r["asset_id"] for r in client}),"client_p1_pngs":len(client),
  "not_run":["Creator_import","actual_game_render","physics_contact_validation","platform_approval","unreviewed_vendor_scripts"]}
 (OUT/"installation-verification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"installation":manifest["summary"],"verification":result},ensure_ascii=True))
if __name__=="__main__":main()

