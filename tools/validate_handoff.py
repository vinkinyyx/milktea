"""Extra static design checks. These do not execute the game, SDK, SQL or server."""
import csv, json, re
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PHASES=["p0-planning","p1a-foundation","p1b-gameplay","p1c-presentation","p1d-validation","p2-douyin","p3a-progression-cloud","p3b-reward-ranking","p3c-release","p4a-challenges","p4b-collection","p4c-rewarded-ads","p4d-multiplatform"]

def check_value(value,schema,schemas):
    if "$ref" in schema:return check_value(value,schemas[schema["$ref"].split("/")[-1]],schemas)
    if "oneOf" in schema:return sum(check_value(value,s,schemas) for s in schema["oneOf"])==1
    if "const" in schema and value!=schema["const"]:return False
    if "enum" in schema and value not in schema["enum"]:return False
    t=schema.get("type")
    if isinstance(t,list):
        if value is None:return "null" in t
        return any(check_value(value,dict(schema,type=x),schemas) for x in t if x!="null")
    if t=="object":
        if not isinstance(value,dict):return False
        if any(k not in value for k in schema.get("required",[])):return False
        props=schema.get("properties",{})
        if schema.get("additionalProperties") is False and any(k not in props for k in value):return False
        return all(check_value(v,props[k],schemas) for k,v in value.items() if k in props)
    if t=="array":
        if not isinstance(value,list):return False
        if not schema.get("minItems",0)<=len(value)<=schema.get("maxItems",10**9):return False
        if schema.get("uniqueItems") and len({json.dumps(x,sort_keys=True) for x in value})!=len(value):return False
        return all(check_value(x,schema.get("items",{}),schemas) for x in value)
    if t in ["integer","number"]:
        if isinstance(value,bool) or not isinstance(value,(int,float)):return False
        if t=="integer" and not isinstance(value,int):return False
        return schema.get("minimum",float("-inf"))<=value<=schema.get("maximum",float("inf"))
    if t=="string":
        if not isinstance(value,str):return False
        if not schema.get("minLength",0)<=len(value)<=schema.get("maxLength",10**9):return False
        if "pattern" in schema and not re.search(schema["pattern"],value):return False
        if schema.get("format")=="uuid" and not re.fullmatch(r"[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}",value):return False
    if t=="boolean" and not isinstance(value,bool):return False
    return True

def extended_checks():
    for stem in PHASES:
        text=(ROOT/"docs/development"/(stem+".md")).read_text(encoding="utf-8")
        assert len(text)>800,stem+" lacks substantive stage design"
        assert "验收" in text
    payload=json.loads((ROOT/"assets/image-elements.json").read_text(encoding="utf-8"))
    rows=payload["assets"]; ids={r["asset_id"] for r in rows}
    assert len(ids)==len(rows)==213
    for r in rows:
        assert re.fullmatch("[a-z0-9_]+",r["asset_id"])
        assert all(str(v).strip() for k,v in r.items() if k not in ["source_asset_id"])
        if r["source_asset_id"]:
            assert r["source_asset_id"] in ids or r["source_asset_id"].startswith("runtime:")
        assert r["production_method"] in ["new_draw","derived","engine","platform"]
        if r["nine_slice"]!="none":
            l,t,rr,b=map(int,r["nine_slice"].split(","))
            m=re.search(r"(\d+)x(\d+)",r["export_spec"]);assert m
            assert l+rr<=int(m[1]) and t+b<=int(m[2]),r["asset_id"]
    with (ROOT/"assets/image-elements.csv").open(encoding="utf-8",newline="") as f:
        assert list(csv.DictReader(f))==rows
    for stage in ["classic","coconut_green","taro_boba","brown_sugar","mochi_special"]:
        assert all("spr_cup_"+stage+"_"+layer in ids for layer in ["back","tea","front","rim_back","rim_front","base","label"])
    api=json.loads((ROOT/"contracts/api.openapi.json").read_text(encoding="utf-8"))
    schemas=api["components"]["schemas"];refs=[]
    def walk(x):
        if isinstance(x,dict):
            if "$ref" in x:
                value=api
                for key in x["$ref"].split("/")[1:]:value=value[key]
                refs.append(x["$ref"])
            for v in x.values():walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    walk(api)
    ops=[(path,method,op) for path,methods in api["paths"].items() for method,op in methods.items() if method in ["get","put","post","delete","patch"]]
    op_ids=[op["operationId"] for _,_,op in ops];assert len(set(op_ids))==len(op_ids)
    fixture=json.loads((ROOT/"contracts/examples.json").read_text(encoding="utf-8"))
    for key,typ in [("sample_run_start","RunStart"),("sample_run_started","RunStarted"),("sample_coupon_balance","CouponBalance")]:
        assert check_value(fixture[key],schemas[typ],schemas),(key,typ)
    uid="11111111-1111-4111-8111-111111111111"
    base=dict(runId=uid,commandId=uid,sequence=0,tick=0)
    valid=[dict(base,kind="DROP",xDu=375),dict(base,kind="SHAKE",source="base"),dict(base,kind="SHAKE",source="coupon",consumeEventId=uid)]
    invalid=[dict(base,kind="DROP"),dict(base,kind="SHAKE",source="coupon"),dict(base,kind="PAUSE",xDu=375)]
    assert all(check_value(v,schemas["Command"],schemas) for v in valid)
    assert not any(check_value(v,schemas["Command"],schemas) for v in invalid)
    evt=dict(eventId=uid,runId=uid,tick=10,kind="MergeCommitted",parents=[1,2],childId=3,childLevel=2,scoreDelta=10,units=2,positionDu={"x":375,"y":300})
    assert check_value(evt,schemas["Event"],schemas)
    assert not check_value({k:v for k,v in evt.items() if k!="parents"},schemas["Event"],schemas)
    assert not check_value(dict(evt,parents=[1,1]),schemas["Event"],schemas)
    x=fixture["rng"]["seed"];vals=[]
    for _ in range(5):
        x^=(x<<13)&0xffffffff;x^=x>>17;x^=(x<<5)&0xffffffff;x&=0xffffffff;vals.append(x)
    assert vals==fixture["rng"]["first_u32"]
    assert [1 if x/2**32<.55 else 2 if x/2**32<.85 else 3 for x in vals]==fixture["rng"]["first_levels"]
    scores=fixture["rank"]["scores"]
    assert [1+sum(y>x for y in scores) for x in scores]==fixture["rank"]["expected_ranks"]
    policy=json.loads((ROOT/"config/rewarded-ad-policy.json").read_text(encoding="utf-8"))
    assert not policy["enabled"] and policy["amount"]==policy["dailyLimit"]==0
    assert len(re.findall(r"AC-\d{3}",(ROOT/"docs/16-phase-verification.md").read_text(encoding="utf-8")))==45
    return {"phase_designs":len(PHASES),"image_items":len(rows),"image_methods":dict(Counter(r["production_method"] for r in rows)),
        "api_operations":len(ops),"api_local_refs_checked":len(refs),"wire_fixture_checks":12,
        "phase_acceptance_cases":45,"schema_validation_scope":"Authored JSON-schema subset, internal refs and fixtures only; not a full OpenAPI certification"}

def build_handbook():
    from validate_design import render_markdown
    docs=ROOT/"docs/development"
    paths=[docs/"common-contracts.md"]+[docs/(x+".md") for x in PHASES]
    text="# 奶茶挤挤 · 分阶段开发手册\n\n交接v0.2，游戏尚未实现。修改分册后重新生成。\n\n"
    sections=[];nav=[]
    for i,path in enumerate(paths):
        raw=path.read_text(encoding="utf-8");title=raw.splitlines()[0].lstrip("# ")
        # Combined Markdown lives beside originals so relative links remain valid.
        text+="\n---\n\n"+raw
        nav.append('<a href="#phase-'+str(i)+'">'+title+'</a>')
        sections.append('<section id="phase-'+str(i)+'">'+render_markdown(raw,"phase-"+str(i))+'</section>')
    (docs/"development-handbook.md").write_text(text,encoding="utf-8")
    page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>奶茶挤挤 · 开发手册</title><style>
    *{box-sizing:border-box}body{margin:0;background:#fffaf3;color:#3d2a23;font:16px/1.85 "Microsoft YaHei",sans-serif}nav{position:fixed;width:260px;inset:0 auto 0 0;background:#f0e2d0;padding:24px 16px;overflow:auto}nav a{display:block;padding:8px;font-size:13px}a{color:#78462d}main{margin-left:260px;max-width:1300px;padding:36px 4vw}h1{font-size:32px}h2{font-size:28px}h3{font-size:21px}.table-wrap,pre{overflow:auto}table{border-collapse:collapse;min-width:560px;font-size:14px}td,th{border:1px solid #d7bfa4;padding:10px;text-align:left;vertical-align:top}pre{background:#f3e7d8;padding:18px}code{font:13px/1.6 Consolas,monospace}p,td{overflow-wrap:anywhere}section{padding:25px 0;border-bottom:1px solid #dfc9ae;scroll-margin-top:12px}.bullet{padding-left:10px}
    @media(max-width:900px){nav{position:static;width:100%;max-height:250px}main{margin:0;padding:24px 18px}h1{font-size:27px}}@media print{nav{display:none}main{margin:0}section{break-before:page}}
    </style><nav aria-label="阶段目录"><strong>开发阶段</strong>NAV</nav><main><h1>奶茶挤挤 · 分阶段开发手册</h1><p>13个阶段与公共合同 · 交接v0.2 · 当前仅规格，没有游戏实现</p><p><a href="../12-delivery-phases.md">阶段交付验收</a> · <a href="../../assets/image-elements.html">逐项图像目录</a> · <a href="../16-phase-verification.md">45项阶段验收操作</a></p>SECTIONS</main></html>'''
    (docs/"development-handbook.html").write_text(page.replace("NAV","".join(nav)).replace("SECTIONS","".join(sections)),encoding="utf-8")

