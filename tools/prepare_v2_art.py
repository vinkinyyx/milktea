"""Select V2 artwork; keep supplied masters and existing Cocos metadata intact.

prepare writes browser-render jobs. install consumes those rendered derivatives.
"""
from pathlib import Path
import argparse, base64, hashlib, json, shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / 'assets2'
WORK = ROOT / 'output/v2-art-runtime'
PROJECT = ROOT / ROOT.name

def find(name):
    paths = list(INPUT.rglob(name))
    if len(paths) != 1: raise ValueError((name, paths))
    return paths[0]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('action', choices=['prepare','install']); ap.add_argument('--work-dir', type=Path); selection=ap.add_mutually_exclusive_group(); selection.add_argument('--only-cup', action='store_true'); selection.add_argument('--only-backgrounds', action='store_true'); args = ap.parse_args()
    work = args.work_dir.resolve() if args.work_dir else WORK
    work.mkdir(parents=True, exist_ok=True)
    records, jobs = [], []
    def add(asset_id, filename, bundle='common', sliced='none', pivot='0.5,0.5', source=None, svg=None, jpeg=False):
        path = source or find(filename)
        suffix = '.jpg' if jpeg else '.png'
        dest = PROJECT / 'assets/resources/art/p1/v2' / (asset_id + suffix)
        if svg is not None or jpeg:
            render = work / (asset_id + suffix)
            data = svg.encode() if svg is not None else path.read_bytes()
            mime = 'image/svg+xml' if svg is not None else 'image/png'
            jobs.append({'id':asset_id,'src':'data:'+mime+';base64,'+base64.b64encode(data).decode(), 'mime':'image/jpeg' if jpeg else 'image/png', 'width':750 if jpeg else 512 if svg is not None and asset_id.startswith('spr_ing') else None})
            original = path; path = render
        else: original = path
        records.append({'asset_id':asset_id,'source':str(original),'prepared':str(path),'destination':str(dest),'bundle':bundle,'nine_slice':sliced,'pivot':pivot})

    cfg=json.loads((ROOT/'config/design-baseline.json').read_text(encoding='utf-8-sig'))
    for item in ([] if args.only_cup else cfg['ingredients']):
        size=next((n for n in [128,256,512] if n>=4*item['radius_du']/.9),512)
        id='spr_ing_'+item['id']+'_base'; svg=None
        if item['id']=='pudding':
            svg=find(id+'.svg').read_text(encoding='utf-8')
            at=svg.index('</defs>')+len('</defs>')
            svg=svg[:at]+'<g transform="translate(512 512) scale(.97) translate(-512 -512)">'+svg[at:]
            svg=svg.replace('</svg>','</g></svg>')
        add(id,id+f'@{size}.png',svg=svg)

    # Geometry is derived from the single design baseline. The seven layers keep
    # their 750x1000 canvas and y mapping while the inner edges match physics.
    cup=cfg['cup']; cx=cup['center_x_du']; topw=cup['top_width_du']; botw=cup['bottom_width_du']
    xlt=cx-topw/2; xrt=cx+topw/2; xlb=cx-botw/2; xrb=cx+botw/2
    # Physical y 1000/360 maps to source y 140/940 in the existing layer transform.
    defs=f'''<defs><linearGradient id="glass"><stop stop-color="#fff9ed" stop-opacity=".55"/><stop offset=".25" stop-color="#ffd7b0" stop-opacity=".08"/><stop offset=".72" stop-color="#fff9ef" stop-opacity=".04"/><stop offset="1" stop-color="#fffef5" stop-opacity=".45"/></linearGradient><linearGradient id="tea" x2="0" y2="1"><stop stop-color="#ffe7b3" stop-opacity=".20"/><stop offset="1" stop-color="#d59660" stop-opacity=".36"/></linearGradient><clipPath id="inside"><path d="M{xlt:g} 140 L{xlb:g} 940 L{xrb:g} 940 L{xrt:g} 140Z"/></clipPath></defs>'''
    layers={
        'back':f'<path d="M{xlt-6:g} 140 L{xlb-6:g} 935 Q{xlb-5:g} 950 {xlb+12:g} 950 H{ xrb-12:g} Q{ xrb+5:g} 950 { xrb+6:g} 935 L{xrt+6:g} 140" fill="url(#glass)" stroke="#bb8c67" stroke-width="12" stroke-linejoin="round"/>',
        'tea':f'<g clip-path="url(#inside)"><path d="M{xlt+15:g} 600 Q{cx:g} 618 {xrt-15:g} 600 L{xrb+5:g} 941 H{xlb-5:g}Z" fill="url(#tea)"/></g>',
        'rim_back':f'<path d="M{xlt-6:g} 140 C{xlt-6:g} 84 {xrt+6:g} 84 {xrt+6:g} 140" fill="none" stroke="#ac7551" stroke-width="14"/><path d="M{xlt+1:g} 140 C{xlt+1:g} 98 {xrt-1:g} 98 {xrt-1:g} 140" fill="none" stroke="#fff7e9" stroke-width="7"/>',
        'front':f'<path d="M{xlt+16:g} 220 L{xlb+1:g} 882" stroke="white" stroke-opacity=".62" stroke-width="17" stroke-linecap="round"/><path d="M{xrt-16:g} 230 L{xrb-1:g} 891" stroke="#fff8ed" stroke-opacity=".38" stroke-width="10" stroke-linecap="round"/>',
        'rim_front':f'<path d="M{xlt-6:g} 140 C{xlt-6:g} 196 {xrt+6:g} 196 {xrt+6:g} 140" fill="none" stroke="#ac7551" stroke-width="14"/><path d="M{xlt+1:g} 140 C{xlt+1:g} 181 {xrt-1:g} 181 {xrt-1:g} 140" fill="none" stroke="#fff9ee" stroke-width="7"/>',
        'base':f'<path d="M{xlb:g} 934 Q{cx:g} 967 {xrb:g} 934" fill="none" stroke="#bd926f" stroke-width="10" stroke-linecap="round"/><path d="M{xlb+10:g} 934 Q{cx:g} 951 {xrb-10:g} 934" fill="none" stroke="#fff7e8" stroke-width="5"/>',
        'label':'<circle cx="375" cy="760" r="31" fill="#fff4db" fill-opacity=".20" stroke="#b88360" stroke-opacity=".40" stroke-width="4"/><circle cx="364" cy="756" r="6" fill="#b88360" fill-opacity=".48"/><circle cx="386" cy="756" r="6" fill="#b88360" fill-opacity=".48"/><path d="M361 770 Q375 783 389 770" fill="none" stroke="#b88360" stroke-opacity=".48" stroke-width="4"/>'}
    for suffix, body in layers.items():
        id='spr_cup_classic_'+suffix
        svg='<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1000" viewBox="0 0 750 1000">'+defs+body+'</svg>'
        (work/(id+'.svg')).write_text(svg,encoding='utf-8')
        add(id,id+'.png',bundle='classic',pivot='0,0',svg=svg)
    if not args.only_cup:
      add('spr_cup_shadow','spr_cup_shadow.png',bundle='classic')
    if not args.only_cup:
      mobile=INPUT/'milk_tea_9x20_complete/02_shop_bg_750x1667.png'
      for id, name in [('bg_shop_base','bg_shop_base_750x1334_平面背景候选.png'),('bg_shop_extend_top','bg_shop_extend_top.png'),('bg_shop_extend_bottom','bg_shop_extend_bottom.png')]:
        add(id,name,bundle='classic',jpeg=True,source=mobile if id=='bg_shop_base' and mobile.is_file() else None)
    brand=INPUT/'milk_tea_9x20_complete/20_promo_no_logo.png'
    add('bg_brand','启动背景_750x1334_无动态UI.png',jpeg=True,source=brand if brand.is_file() else None)
    add('ui_title_logo','logo_奶茶挤挤_透明800x280.png')
    for family in ['primary','secondary','icon']:
        for state in ['normal','pressed','disabled','selected']:
            id=f'ui_btn_{family}_{state}'
            pp=find(id+'.png') if family!='icon' else next(p for p in INPUT.rglob(id+'.png') if '补充与控件返修' in str(p))
            add(id,pp.name,source=pp,sliced='32,32,32,32' if family!='icon' else 'none')
    for id, size, inset in [('modal','320x360','32,32,32,32'),('hud','340x60','20,20,20,20'),('next','140x140','24,24,24,24'),('toast','250x40','16,16,16,16'),('results','330x410','36,36,36,36')]:
        add('ui_panel_'+id,f'ui_panel_{id}@{size}.png',sliced=inset)
    for id in ['play','continue','pause','settings','close','back','restart','home','music_on','music_off','sfx_on','sfx_off','reduced_motion','shake','info','warning','check','next']:
        add('ui_icon_'+id,'ui_icon_'+id+'@96.png')
    for id,name in [('ui_slider_track_empty','ui_slider_track_empty.png'),('ui_slider_fill_full','ui_slider_fill_full.png'),('ui_slider_knob','ui_slider_knob@64x64.png'),('ui_toggle_track','ui_toggle_track@128x64.png'),('ui_toggle_knob','ui_toggle_knob@64x64.png'),('ui_badge_record','ui_badge_record@256x128.png'),('ui_badge_mochi','ui_badge_mochi@192x192.png')]:
        add(id,name,sliced='10,8,10,8' if id.startswith('ui_slider_') and 'knob' not in id else 'none')
    for id in ['fx_merge_ring','fx_sparkle','fx_crumb','fx_drop_ping','fx_mochi_star','ui_tutorial_hand_move','ui_tutorial_hand_release']:
        add(id,id+'@256.png')
    if args.only_cup or args.only_backgrounds:
        keep={f'spr_cup_classic_{suffix}' for suffix in ('back','tea','rim_back','front','rim_front','base','label')} if args.only_cup else {'bg_shop_base','bg_brand'}
        records=[row for row in records if row['asset_id'] in keep]
        jobs=[job for job in jobs if job['id'] in keep]
    if args.action=='prepare':
        (work/'render-jobs.json').write_text(json.dumps(jobs),encoding='utf-8')
        (work/'selection.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
        print('prepared',len(records),'assets;',len(jobs),'browser render jobs');return
    # Validate every render before installing any file, so a missing/empty render
    # cannot partially replace currently usable resources.
    for row in records:
        src=Path(row['prepared'])
        if not src.is_file(): raise FileNotFoundError(f"render missing; no resources installed: {src}")
        with Image.open(src) as im:
            im.verify()
        with Image.open(src) as im:
            if args.only_cup and im.size!=(750,1000): raise ValueError(f"cup layer dimensions invalid: {src} {im.size}")
            if args.only_cup and ('A' not in im.getbands() or im.getchannel('A').getbbox() is None): raise ValueError(f"render alpha empty: {src}")
            if 'A' in im.getbands() and im.getchannel('A').getbbox() is None: raise ValueError(f"render alpha empty: {src}")
    variants=[]
    for row in records:
        src=Path(row['prepared']); dest=Path(row['destination']); dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src,dest)
        with Image.open(dest) as im: size=list(im.size)
        variants.append({'asset_id':row['asset_id'],'png':dest.relative_to(PROJECT).as_posix(),'size':size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'resource_key':'art/p1/v2/'+dest.stem+'/spriteFrame','pivot':row['pivot'],'nine_slice':row['nine_slice'],'v2_bundle':row['bundle'],'source':Path(row['source']).relative_to(ROOT).as_posix()})
    if args.only_cup or args.only_backgrounds:
        catalog_path=PROJECT/'assets/resources/art/p1/catalog.json'
        existing=json.loads(catalog_path.read_text(encoding='utf-8-sig'))
        by_id={row['asset_id']:row for row in variants}
        merged=[by_id.pop(row['asset_id'],row) for row in existing['variants']]
        merged.extend(by_id.values())
        cat={**existing,'version':2,'theme':'milktea-v2','status':'V2_RUNTIME_SELECTED','variants':merged}
    else: cat={'version':2,'theme':'milktea-v2','status':'V2_RUNTIME_SELECTED','variants':variants}
    (PROJECT/'assets/resources/art/p1/catalog.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (work/'installed-manifest.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2),encoding='utf-8')
    print('installed',len(variants),'new-runtime assets; no old PNG or metadata removed')

if __name__=='__main__': main()
