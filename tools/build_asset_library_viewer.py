"""Generate a local art browser from the audited library registry."""
from pathlib import Path
from urllib.parse import quote
import html,json
ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/"assets/library"
def esc(s):return html.escape(str(s),quote=True)
def href(path):return quote(Path(path).relative_to(Path("assets/library")).as_posix(),safe="/@._-")
def main():
 data=json.loads((LIB/"catalog.json").read_text(encoding="utf-8"));cards=[]
 labels={"static_pass":"静态通过 · 待引擎","conditional_static":"附条件试用","blocked_static":"缺少图片","engine_source_only":"程序参考 · 待移植","missing_engine_source":"缺少源码","platform_dependency":"待真实平台接入","platform_contract_missing":"缺少平台合同","candidate_not_required":"未来候选"}
 for row in data["assets"]:
  aid=row["asset_id"];status=row["status"]
  state="missing" if status in ["blocked_static","missing_engine_source","platform_contract_missing"] else "template" if row["usage"]=="template_only_not_release" else "image" if row["library_variants"] else "engine" if row["engine_files"] else "platform" if row["contracts"] else "candidate"
  if row["library_variants"]:
   v=min(row["library_variants"],key=lambda x:abs(x["size"][0]-256))
   preview='<img loading="lazy" src="'+href(v["library_path"])+'" alt="'+esc(row["name_zh"])+'">'
  else:preview='<span class="empty">'+{"missing":"文件尚未到位","engine":"Canvas程序参考","platform":"真实平台依赖","candidate":"尚未立项"}.get(state,"待补")+'</span>'
  links=[]
  for v in row["library_variants"]:
   links.append('<a download href="'+href(v["library_path"])+'">'+"×".join(map(str,v["size"]))+' PNG</a>')
  for v in row["library_sources"]:
   title='ORA重建分层参考' if v.get('reconstructed_from_raster') else v['kind']+' 源文件'
   links.append('<a download href="'+href(v["library_path"])+'">'+esc(title)+'</a>')
  for v in row["library_engine_files"]:
   links.append('<a download href="'+href(v["entry"])+'">程序入口（需移植）</a>')
  for v in row["library_contracts"]:
   links.append('<a download href="'+href(v["library_path"])+'">平台合同</a>')
  conditions=[]
  warning=" ".join(row["warnings"])
  if "MISSING_EDITABLE_INGREDIENT_LAYERS" in warning:conditions.append("缺可编辑分层稿")
  if 'RECONSTRUCTED_INGREDIENT_LAYERS_REVIEW_REQUIRED' in warning:conditions.append('已补ORA重建分层稿，材质分离编辑待确认')
  if "COLOR_PROFILE_UNSPECIFIED" in warning:conditions.append("部分PNG未标色彩空间")
  if aid.startswith("spr_cup_") and aid!="spr_cup_shadow":conditions.append("杯体需引擎接触验证")
  if state=="template":conditions.append("只供模板制作，不能当实机截图发布")
  if state=="engine":conditions.append("未执行，不能直接当Cocos组件")
  if state=="missing":conditions.append("不从预览拼图裁切代替独立交付")
  cards.append('<article id="'+aid+'" data-phase="'+row["first_phase"]+'" data-state="'+state+'"><div class="preview">'+preview+'</div><div class="body"><span class="tag">'+esc(row["first_phase"])+' · '+esc(labels[status])+'</span><h2>'+esc(row["name_zh"])+'</h2><code>'+aid+'</code><p>'+esc("；".join(conditions) or "文件规格已核对，实际引擎导入仍需验证")+'</p><p class="spec">锚点 '+esc(row["pivot"])+' · 九切 '+esc(row["nine_slice"])+'</p><div class="downloads">'+"".join(links)+'</div></div></article>')
 phases=sorted({r["first_phase"] for r in data["assets"]})
 page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>奶茶挤挤 · 已入库素材</title><style>
 *{box-sizing:border-box}body{margin:0;background:#fff9f0;color:#3d2a23;font:15px/1.7 "Microsoft YaHei",sans-serif}header{padding:32px 5vw;background:#efdfc7;border-bottom:1px solid #ceb69a}h1{margin:0;font-size:30px}a{color:#784027}header p{max-width:1000px}.controls{display:flex;gap:16px;flex-wrap:wrap;align-items:center}label{display:flex;gap:8px;align-items:center;white-space:nowrap}input,select{font:inherit;padding:10px;border:1px solid #a18162;border-radius:7px;max-width:100%}input{width:250px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px;padding:24px 5vw}article{min-width:0;border:1px solid #ddc7aa;border-radius:12px;overflow:hidden;background:#fffdf8;scroll-margin-top:18px}.preview{height:200px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#e5dfd5 0% 25%,#f9f4eb 0% 50%) 0 0/20px 20px}.preview img{max-width:90%;max-height:180px;width:auto;height:auto;object-fit:contain}.body{padding:16px}.tag{font-size:12px;color:#805333}h2{font-size:19px;margin:6px 0}code{font:12px Consolas,monospace;overflow-wrap:anywhere}p{margin:10px 0}.spec{font-size:12px;color:#775c49}.downloads{display:flex;gap:8px;flex-wrap:wrap}.downloads a{padding:5px 8px;border:1px solid #d7c0a2;border-radius:6px;font-size:12px}.empty{background:#fff7e8;padding:12px 18px;border-radius:8px;color:#80634a}[hidden]{display:none!important}
 @media(max-width:600px){header{padding:24px 20px}main{padding:20px}h1{font-size:26px}.controls{display:block}label{margin:12px 0}input{min-width:0;width:100%}}
 </style></head><body><header><h1>奶茶挤挤 · 已入库素材</h1><p>TOTAL项索引 · STATIC项静态素材已归档（含4张待实机替换的截图模板） · 文件缺件MISSING项。运行图、源文件、程序参考和平台合同分别存放，入库不等于最终验收。</p><p><a href="../README.md">使用说明</a> · <a href="../../docs/18-supplement-cleanup-report.md">复核报告</a> · <a href="../image-elements.html">全部制作规格</a> · <a href="catalog.json">开发索引JSON</a></p><div class="controls"><label>搜索 <input id="search" placeholder="名称、ID、待补问题"></label><label>阶段 <select id="phase"><option value="">全部</option>PHASES</select></label><label>类型 <select id="state"><option value="">全部</option><option value="image">已入库图片</option><option value="missing">缺件</option><option value="template">截图模板</option><option value="engine">程序参考</option><option value="platform">平台依赖</option><option value="candidate">未来候选</option></select></label></div><p id="count" aria-live="polite"></p></header><main>CARDS</main><script>
 const cards=[...document.querySelectorAll("article")],q=document.querySelector("#search"),phase=document.querySelector("#phase"),state=document.querySelector("#state");
 function filter(){let n=0;for(const c of cards){const ok=(!phase.value||c.dataset.phase===phase.value)&&(!state.value||c.dataset.state===state.value)&&c.textContent.toLowerCase().includes(q.value.trim().toLowerCase());c.hidden=!ok;if(ok)n++;}document.querySelector("#count").textContent="显示 "+n+" / "+cards.length+" 项";}
 [q,phase,state].forEach(e=>e.addEventListener("input",filter));filter();
 if(location.hash){const node=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(node)requestAnimationFrame(()=>node.scrollIntoView());}
 </script></body></html>'''
 page=page.replace("TOTAL",str(len(data["assets"]))).replace("STATIC",str(sum(bool(r["library_variants"]) for r in data["assets"]))).replace("MISSING",str(sum(r["status"] in ["blocked_static","missing_engine_source","platform_contract_missing"] for r in data["assets"])))
 page=page.replace("PHASES","".join('<option>'+p+'</option>' for p in phases)).replace("CARDS","".join(cards))
 (LIB/"index.html").write_text(page,encoding="utf-8")
 print(json.dumps({"cards":len(cards),"html":str(LIB/"index.html")},ensure_ascii=True))
if __name__=="__main__":main()

