"""Verify the current library, normalization and recoverable cleanup without altering art."""
from pathlib import Path
from urllib.parse import unquote,urlsplit
from html.parser import HTMLParser
import hashlib,json
from asset_library_paths import ROOT,AUDIT_OUT
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding="utf-8-sig"))
def main():
 copies=read(AUDIT_OUT/"installation-manifest.json")["copies"]
 original=read(AUDIT_OUT/"original-hashes.json")
 cleanup_path=AUDIT_OUT/"cleanup-plan.json"
 cleanup=read(cleanup_path) if cleanup_path.exists() else {"files":[],"entries":[]}
 archived={r["original"]:Path(r["archived"]) for r in cleanup["files"]}
 def source(path):
  p=ROOT/path
  if p.exists():return p
  if path in archived and archived[path].exists():return archived[path]
  raise AssertionError("Source missing from project and recovery archive: "+path)
 live=0;recovered=0
 for path,h in original.items():
  p=source(path);assert sha(p)==h,path
  if p.is_relative_to(ROOT):live+=1
  else:recovered+=1
 for path,record in copies.items():
  assert sha(ROOT/path)==record["sha256"],path
  assert sha(source(record["original"]))==record["sha256"],record["original"]
 catalog=read(ROOT/"assets/library/catalog.json")["assets"]
 expected={r["asset_id"] for r in read(ROOT/"assets/image-elements.json")["assets"]}
 assert {r["asset_id"] for r in catalog}==expected
 assert len(catalog)==len(expected)
 pngs=[]
 for row in catalog:
  for v in row["library_variants"]:
   raw=(ROOT/v["library_path"]).read_bytes();assert raw[:8]==b"\x89PNG\r\n\x1a\n" and raw[24]==8
   assert hashlib.sha256(raw).hexdigest()==v["sha256"]
   assert v["library_path"] in copies
   pngs.append(v)
   if row["asset_id"].startswith("marketing_screenshot_"):assert "/templates/" in v["library_path"]
  for group in ["library_sources","library_contracts"]:
   for v in row[group]:assert (ROOT/v["library_path"]).is_file()
  for v in row["library_engine_files"]:
   assert (ROOT/v["entry"]).is_file()
   assert all((ROOT/p).is_file() for p in v["bundle_files"])
 class Links(HTMLParser):
  def __init__(self):super().__init__();self.paths=[]
  def handle_starttag(self,tag,attrs):
   for k,v in attrs:
    if k in ["src","href"] and v and not urlsplit(v).scheme and not v.startswith("#"):self.paths.append(v)
 p=ROOT/"assets/library/index.html";links=Links();links.feed(p.read_text(encoding="utf-8"))
 assert all((p.parent/unquote(urlsplit(v).path)).resolve().exists() for v in links.paths)
 normalization=AUDIT_OUT/"normalization-plan.json"
 moved=0
 if normalization.exists():
  for r in read(normalization)["files"]:assert sha(source(r["after"]))==r["sha256"];moved+=1
 cleanup_result=AUDIT_OUT/"cleanup-execution.json"
 archived_verified=0
 if cleanup_result.exists():
  execution=read(cleanup_result);assert execution["status"]=="pass"
  for r in cleanup["files"]:assert sha(Path(r["archived"]))==r["sha256"];archived_verified+=1
  assert all(not Path(e["source"]).exists() for e in cleanup["entries"])
 statuses={r["status"] for r in catalog}
 result={"status":"pass","scope":"file_integrity_registry_links_and_recoverable_cleanup","catalog_ids":len(catalog),
  "static_ids":sum(bool(r["library_variants"]) for r in catalog),"runtime_png_variants":len(pngs),
  "missing_file_ids":sum(r["status"] in ["blocked_static","missing_engine_source","platform_contract_missing"] for r in catalog),
  "library_copy_hashes_verified":len(copies),"intake_source_files_verified":len(original),"live_intake_sources":live,
  "intake_sources_verified_in_cleanup_backup":recovered,"normalization_files_verified":moved,
  "all_cleanup_files_verified":archived_verified,"library_links_checked":len(links.paths),
  "color_profile_unspecified_exports":sum(v["color_profile"]=="unspecified" for v in pngs),
  "not_run":["Cocos_import","physics_integration","device_game_UI","platform_approval"]}
 (AUDIT_OUT/"final-verification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(result,ensure_ascii=True))
if __name__=="__main__":main()

