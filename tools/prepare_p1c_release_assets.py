from __future__ import annotations
import argparse, hashlib, json, shutil, uuid
from optimize_runtime_assets import optimize
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ['bgm_classic.mp3','ui_tap.wav','drop.wav','collision_soft.wav','merge_small.wav','merge_large.wav','shake_start.wav','danger_tick.wav','result.wav']
INGREDIENTS = ['sago','red_bean','small_pearl','coconut','large_pearl','grass_jelly','pudding','taro','mochi']
CUP = ['spr_cup_classic_back','spr_cup_classic_tea','spr_cup_classic_rim_back','spr_cup_classic_front','spr_cup_classic_rim_front','spr_cup_classic_base','spr_cup_classic_label']

def sha(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def main() -> None:
    ap=argparse.ArgumentParser();ap.add_argument('--project',required=True);ap.add_argument('--evidence-dir',required=True);a=ap.parse_args()
    project=Path(a.project).resolve(); evidence=(ROOT/a.evidence_dir).resolve(); evidence.mkdir(parents=True,exist_ok=True)
    optimize(project,evidence)
    resources=project/'assets/resources';catalog_path=resources/'art/p1/catalog.json';catalog=json.loads(catalog_path.read_text(encoding='utf-8-sig'))
    cfg=json.loads((resources/'config/design-baseline.json').read_text(encoding='utf-8-sig'))
    target={f"spr_ing_{item['id']}_base":2*item['radius_du']/.9 for item in cfg['ingredients']}
    target.update({'bg_shop_base':1000,'spr_cup_shadow':1000,**{k:1000 for k in CUP},'ui_btn_primary_normal':400,'ui_btn_secondary_normal':400})
    if catalog.get('theme') == 'milktea-v2':
        target = {v['asset_id']: max(v['size']) for v in catalog['variants']}
    ids=list(target)
    variants=catalog['variants'];selected=[];copy_records=[]
    for asset_id in ids:
        choices=sorted((v for v in variants if v['asset_id']==asset_id),key=lambda v:max(v['size']))
        if not choices: raise SystemExit(f'missing runtime asset: {asset_id}')
        v=next((item for item in choices if max(item['size'])>=target[asset_id]),choices[-1])
        bundle=v.get('v2_bundle', 'common') if catalog.get('theme') == 'milktea-v2' else ('classic' if asset_id in {'bg_shop_base','spr_cup_shadow',*CUP} else 'common')
        rel=Path(v['png'].replace('client/','',1).replace('/', '\\'))
        source=project/rel
        if not source.is_file() or sha(source)!=v['sha256']: raise SystemExit(f'source/hash mismatch: {source}')
        dest_rel=Path('assets')/bundle/Path('art/p1')/Path(*Path(v['resource_key'].replace('/spriteFrame','')).parts[2:]).with_suffix(source.suffix)
        dest=project/dest_rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
        meta=Path(str(source)+'.meta')
        if meta.is_file(): shutil.copy2(meta,Path(str(dest)+'.meta'))
        chosen=dict(v);chosen['source_png']=v['png'];chosen['png']=dest_rel.as_posix();chosen['bundle']=bundle
        selected.append(chosen);copy_records.append({'assetId':asset_id,'bundle':bundle,'resourceKey':v['resource_key'],'source':v['png'],'destination':dest_rel.as_posix(),'size':v['size'],'bytes':dest.stat().st_size,'sha256':sha(dest),'metaCopied':meta.is_file()})
    audio_records=[]
    for name in AUDIO:
        source=resources/'audio/p1c'/name
        if not source.is_file(): raise SystemExit(f'missing accepted audio: {source}')
        dest=project/'assets/classic/audio/p1c'/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
        audio_records.append({'name':name,'source':source.relative_to(project).as_posix(),'destination':dest.relative_to(project).as_posix(),'bytes':dest.stat().st_size,'sha256':sha(dest)})
    catalog['variants']=selected;catalog['status']='P1C_RUNTIME_SELECTED_VARIANTS';catalog['bundlePlan']={'common':'9 ingredients + 2 shared UI variants','classic':'background + shadow + 7 cup layers + 1 BGM + 8 SFX'}
    catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    removed=[]
    for path in (resources/'art/p1').rglob('*.png'):
        meta=Path(str(path)+'.meta')
        removed.append({'path':path.relative_to(project).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
        path.unlink()
        if meta.exists():meta.unlink()
    if catalog.get('theme') == 'milktea-v2':
        for path in (resources/'art/p1').rglob('*.jpg'):
            removed.append({'path':path.relative_to(project).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
            path.unlink()
            meta=Path(str(path)+'.meta')
            if meta.exists():meta.unlink()
    for path in (resources/'audio/p1c').glob('*'):
        if path.is_file(): path.unlink()
    bundle_config={
        'custom':{},
    }
    for name,priority in [('common',8),('classic',7)]:
        folder=project/'assets'/name;folder.mkdir(parents=True,exist_ok=True)
        meta_path=project/'assets'/f'{name}.meta'
        config_id=f'p1c-{name}'
        meta={'ver':'1.2.0','importer':'directory','imported':True,'uuid':str(uuid.uuid4()),'files':[],'subMetas':{},'userData':{'isBundle':True,'bundleConfigID':config_id,'bundleName':name,'priority':priority,'compressionType':'merge_dep','isRemoteBundle':False}}
        meta_path.write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
        bundle_config['custom'][config_id]={
            'displayName':f'P1-C {name.title()}',
            'configs':{
                'native':{'preferredOptions':{'isRemote':False,'compressionType':'merge_dep'}},
                'web':{'preferredOptions':{'isRemote':False,'compressionType':'merge_dep'}},
                'miniGame':{'configMode':'overwrite','overwriteSettings':{'bytedance-mini-game':{'isRemote':False,'compressionType':'subpackage'}}},
            },
        }
    builder_path=project/'settings/v2/packages/builder.json'
    builder=json.loads(builder_path.read_text(encoding='utf-8-sig'))
    builder['bundleConfig']=bundle_config
    builder_path.write_text(json.dumps(builder,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    out={'buildId':project.name,'project':str(project),'bundleFolders':{'common':str(project/'assets/common'),'classic':str(project/'assets/classic')},'selectedVariantCount':len(selected),'selectedVariantBytes':sum(r['bytes'] for r in copy_records),'selectedAudioCount':len(audio_records),'selectedAudioBytes':sum(r['bytes'] for r in audio_records),'artPngVariantsRemovedFromResources':len(removed),'artPngBytesRemovedFromResources':sum(r['bytes'] for r in removed),'selectedVariants':copy_records,'audio':audio_records,'removedResourcesPng':removed,'metaPolicy':'Original workspace assets and sidecar metadata were not changed; selected existing PNG sidecar hashes copied byte-for-byte; only two isolated bundle directory meta files were generated for this release source.'}
    (evidence/'release-asset-staging.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:out[k] for k in ['selectedVariantCount','selectedVariantBytes','selectedAudioCount','selectedAudioBytes','artPngVariantsRemovedFromResources','artPngBytesRemovedFromResources']},ensure_ascii=False))
if __name__=='__main__':main()
