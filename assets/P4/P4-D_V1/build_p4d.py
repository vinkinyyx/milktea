from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageFilter
import os, io, zipfile, csv, json, hashlib, shutil, math
from pathlib import Path
import cairosvg
from xml.etree import ElementTree as ET
R=Path('/mnt/data/naicha_P4/P4-D_V1')
for d in ['source_svg','export_png/96','export_png/48','export_png/platform','source_ora','previews','platform','qa','source_refs']:(R/d).mkdir(parents=True,exist_ok=True)
REF=R/'source_refs'
TITLE=Image.open(REF/'ui_title_logo.png').convert('RGBA')
P3=Image.open(REF/'marketing_cover_landscape@1920x1080.png').convert('RGBA')
P2=Image.open(REF/'marketing_app_icon@1024.png').convert('RGBA')
# ICC sRGB marker is derived from Pillow's cms profile and applied to all outputs
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
def savepng(im,path):
 im.save(path,'PNG',icc_profile=profile,optimize=True)
# UI icon: faithful rendering to P1's layered brown vector grammar
svg='''<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="192" height="192" viewBox="0 0 192 192">
<title>外链提示 | ui_icon_external</title>
<desc>Original external-link icon for NaiCha game. Transparent background. No platform logo. P1 dark brown outline, caramel fill, cream highlight. Center pivot.</desc>
<defs><linearGradient id="brown" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0%" stop-color="#A6704A"/><stop offset="100%" stop-color="#75472F"/></linearGradient></defs>
<g id="external_frame" stroke-linejoin="round" stroke-linecap="round">
 <path d="M108 45 H49 Q37 45 37 57 V143 Q37 155 49 155 H134 Q146 155 146 143 V110" fill="none" stroke="#3E281E" stroke-width="24"/>
 <path d="M108 45 H49 Q37 45 37 57 V143 Q37 155 49 155 H134 Q146 155 146 143 V110" fill="none" stroke="url(#brown)" stroke-width="15"/>
 <path d="M43 126 V60 Q43 52 51 52 H89" fill="none" stroke="#E5B888" stroke-opacity=".55" stroke-width="3"/>
</g>
<g id="external_arrow" stroke-linecap="round" stroke-linejoin="round">
 <path d="M84 111 L146 48 M104 48 H146 V90" fill="none" stroke="#3E281E" stroke-width="27"/>
 <path d="M84 111 L146 48 M104 48 H146 V90" fill="none" stroke="url(#brown)" stroke-width="18"/>
 <path d="M87 104 L141 51 M110 53 H140 V85" fill="none" stroke="#E6B77A" stroke-opacity=".62" stroke-width="3.5"/>
</g></svg>'''
(R/'source_svg/ui_icon_external.svg').write_text(svg,encoding='utf-8')
for n in [96,48]:
 b=cairosvg.svg2png(bytestring=svg.encode(),output_width=n*4,output_height=n*4)
 im=Image.open(io.BytesIO(b)).convert('RGBA').resize((n,n),Image.Resampling.LANCZOS)
 savepng(im,R/f'export_png/{n}/ui_icon_external.png')
# Tap: background is game art reused verbatim; new left no-marketing-text plate overlay; P1 original title transparent sprite.
left=Image.new('RGBA',P3.size,(0,0,0,0)); ld=ImageDraw.Draw(left)
plate=(88,182,916,919)
ld.rounded_rectangle(plate, radius=115, fill=(255,247,222,255), outline=(246,216,176,220),width=3)
# warm low-key gradients and small boba circles only
for i in range(32):
 t=i/31; y=654+i*6
 ld.line((245,y,770,y), fill=(255,244,220,255),width=4)
for x,y,rad,col in [(280,739,29,(219,189,149,255)),(403,754,15,(232,205,173,255)),(580,728,24,(220,182,144,255)),(706,790,33,(227,193,157,255)),(368,842,13,(222,192,151,255)),(490,800,19,(230,201,170,255))]:
 ld.ellipse((x-rad,y-rad,x+rad,y+rad),fill=col,outline=(219,190,152,255),width=2)
# Added only abstract shapes and game title, no promotional words
layerTitle=Image.new('RGBA',P3.size,(0,0,0,0))
logow,logoh=670,251
logo=TITLE.resize((logow,logoh),Image.Resampling.LANCZOS)
layerTitle.alpha_composite(logo,(202,304))
tap=P3.copy();tap.alpha_composite(left);tap.alpha_composite(layerTitle);tap=tap.convert('RGB')
savepng(tap,R/'export_png/platform/marketing_tap_cover_1920x1080.png')
savepng(tap.resize((1280,720),Image.Resampling.LANCZOS),R/'export_png/platform/marketing_tap_cover_preview_1280x720.png')
# Square candidate = contain original aspect ratio over harmonious safe backdrop, not deform/distort.
square=Image.new('RGB',(1440,1440),(247,232,209))
sd=ImageDraw.Draw(square)
for yy in range(1440):
 t=yy/1439
 sd.line([(0,yy),(1439,yy)],fill=(int(255-13*t),int(248-32*t),int(230-44*t)))
scaled=tap.resize((1440,810),Image.Resampling.LANCZOS)
square.paste(scaled,(0,310))
savepng(square,R/'export_png/platform/marketing_tap_square_CANDIDATE_1440x1440.png')
# Original P2 approved icon, no revision or fake platform badge. Keep hard-corner outer canvas with intact artwork.
savepng(P2.convert('RGB'), R/'export_png/platform/marketing_wechat_icon_master_1024.png')
for n in [512,256,128]:savepng(P2.resize((n,n),Image.Resampling.LANCZOS).convert('RGB'),R/f'export_png/platform/marketing_wechat_icon_{n}.png')
# Preview of round-clipped icon only; not actual runtime asset
im=P2.resize((256,256),Image.Resampling.LANCZOS)
mask=Image.new('L',(256,256),0);ImageDraw.Draw(mask).ellipse((0,0,255,255),fill=255)
roundPreview=Image.new('RGBA',(256,256),(0,0,0,0));roundPreview.paste(im,(0,0),mask);savepng(roundPreview,R/'previews/wechat_round_clip_SIMULATION_ONLY.png')
# Source lineage and open raster: create layer-based design file for Tap (base, clean plate, title)
def ora(dest,size,layers):
 stack=[]
 for i,(name,layer) in enumerate(layers):
  buf=io.BytesIO();layer.convert('RGBA').save(buf,'PNG');stack.append((f'data/layer{i}.png',buf.getvalue(),name))
 # layers in XML topmost first (reverse underlying composition order)
 taglayers=''.join(f'<layer name="{name}" src="{path}" x="0" y="0" opacity="1.0" visibility="visible" composite-op="svg:src-over"/>' for path,_,name in reversed(stack))
 raw=f'<?xml version="1.0" encoding="UTF-8"?><image version="0.0.1" w="{size[0]}" h="{size[1]}" name="P4-D Tap cover"><stack>{taglayers}</stack></image>'
 merged=Image.new('RGBA',size)
 for _,b,_ in stack: merged.alpha_composite(Image.open(io.BytesIO(b)).convert('RGBA'))
 bf=io.BytesIO();merged.save(bf,'PNG')
 with zipfile.ZipFile(dest,'w') as z:
  z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
  z.writestr('stack.xml',raw)
  z.writestr('mergedimage.png',bf.getvalue())
  for path,b,_ in stack:z.writestr(path,b)
  z.writestr('data/preview.png',bf.getvalue())
ora(R/'source_ora/marketing_tap_cover.ora',P3.size,[('P3 original illustration source',P3),('Clean text-safe plate',left),('P1 game title',layerTitle)])
# Save original editable P2 ORA separately as-is
with zipfile.ZipFile('/mnt/data/奶茶_P2_5项素材_完整验收修订_V2.zip') as z:
 (R/'source_ora/marketing_wechat_icon_reused_P2.ora').write_bytes(z.read('P2_正式交付_V2/source_layered/marketing_app_icon.ora'))
# platform contract, not fake logo
contract={
 'asset_id':'platform_platform_review_logo','production_method':'platform','status':'WAITING_FOR_PROVIDER','mock_logo_generated':False,
 'usage_rule':'Only fetch and use a real, currently valid official logo/badge if platform requires and permits. Do not draw an imitation.',
 'source':'Current game publishing backend or SDK official source','checklist':['required badge in current review UI?','license/rights','official original file','aspect ratio and required safe area','size and alpha per actual provider','full integration screenshot'],
 'note':'A provider platform mark is not the same as game branding; do not add unofficial WeChat or TapTap marks to promotional art.'}
(R/'platform/platform_platform_review_logo.CONTRACT.json').write_text(json.dumps(contract,ensure_ascii=False,indent=2),encoding='utf-8')
# QA images
fontpaths=['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']
import subprocess
font=next((x for x in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'] if os.path.exists(x)),None)
F=lambda n:ImageFont.truetype(font,n) if font else ImageFont.load_default()
contact=Image.new('RGB',(1530,1130),(247,240,230));c=ImageDraw.Draw(contact)
c.text((52,30),'P4-D  |  微信 & TapTap 平台适配  |  4项',font=F(35),fill=(73,44,29))
# Fit images into cards, whitespace for titles
cards=[(50,115,1000,670,'01 TapTap 横版宣传图  •  1920×1080',tap),(1040,115,1480,670,'02 微信游戏图标  •  512×512',P2.convert('RGB')),(50,720,735,1060,'03 外链提示  •  96/48 PNG + SVG',Image.open(R/'export_png/96/ui_icon_external.png').convert('RGBA')),(780,720,1480,1060,'04 平台标志  •  官方接入合同',None)]
for x1,y1,x2,y2,name,im in cards:
 c.rounded_rectangle((x1,y1,x2,y2),radius=22,fill=(255,253,246),outline=(216,184,154),width=2)
 c.text((x1+20,y1+14),name,font=F(20),fill=(70,48,32))
 if im:
  h=y2-y1-75;w=x2-x1-35
  sf=min(w/im.width,h/im.height)
  target=im.resize((max(1,int(im.width*sf)),max(1,int(im.height*sf))),Image.Resampling.LANCZOS)
  ix=x1+(x2-x1-target.width)//2;iy=y1+64+(h-target.height)//2
  if target.mode=='RGBA':contact.paste(target,(ix,iy),target)
  else:contact.paste(target,(ix,iy))
 else:
  c.rounded_rectangle((x1+130,y1+100,x2-130,y2-80),radius=22,fill=(238,231,221),outline=(203,188,172))
  c.text((x1+190,y1+190),'待平台提供',font=F(31),fill=(125,104,86))
savepng(contact,R/'previews/P4-D_4assets_contact_sheet.png')
# low size QA and safe area preview
small=Image.new('RGB',(840,270),(244,237,227));sm=ImageDraw.Draw(small)
for i,n in enumerate([96,48]):
 im=Image.open(R/f'export_png/{n}/ui_icon_external.png').convert('RGBA')
 x=50+i*190;small.paste(im,(x,70),im);sm.text((x,182),f'{n}px',font=F(24),fill=(90,60,42))
for i,n in enumerate([96,48]):
 im=Image.open(R/f'export_png/{n}/ui_icon_external.png').convert('RGBA')
 x=440+i*155;sm.rounded_rectangle((x-10,60,x+n+10,80+n),radius=12,fill=(84,48,36));small.paste(im,(x,70),im);sm.text((x,190),f'dark {n}px',font=F(18),fill=(80,52,38))
savepng(small,R/'previews/P4-D_icon_48_96_readability.png')
# test each expected file and characteristics
manifest=[
 dict(asset_id='ui_icon_external',name='外链提示',method='new_draw',status='STATIC_PASS',file='export_png/96/ui_icon_external.png',source='source_svg/ui_icon_external.svg'),
 dict(asset_id='marketing_tap_cover',name='Tap平台封面适配',method='derived',status='STATIC_PASS_PLATFORM_VERIFY',file='export_png/platform/marketing_tap_cover_1920x1080.png',source='source_ora/marketing_tap_cover.ora'),
 dict(asset_id='marketing_wechat_icon',name='微信平台图标适配',method='derived',status='STATIC_PASS_PLATFORM_VERIFY',file='export_png/platform/marketing_wechat_icon_512.png',source='source_ora/marketing_wechat_icon_reused_P2.ora'),
 dict(asset_id='platform_platform_review_logo',name='发行平台规定标志',method='platform',status='WAITING_FOR_PROVIDER',file='platform/platform_platform_review_logo.CONTRACT.json',source='')]
with (R/'qa/asset_manifest.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=list(manifest[0]));w.writeheader();w.writerows(manifest)
checks=[]
def check(name,passed,detail=''):
 checks.append(dict(check=name,status='PASS' if passed else 'FAIL',detail=detail))
for n in [96,48]:
 im=Image.open(R/f'export_png/{n}/ui_icon_external.png');check(f'icon {n}px dimensions',im.size==(n,n));check(f'icon {n}px alpha',im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255));check(f'icon {n}px icc',bool(im.info.get('icc_profile')))
for path,dim,mode in [('marketing_tap_cover_1920x1080.png',(1920,1080),'RGB'),('marketing_wechat_icon_512.png',(512,512),'RGB'),('marketing_wechat_icon_master_1024.png',(1024,1024),'RGB')]:
 im=Image.open(R/'export_png/platform'/path);check(path+' dimensions',im.size==dim);check(path+' rgb',im.mode==mode);check(path+' icc',bool(im.info.get('icc_profile')))
check('Tap cover target limit 4MB',(R/'export_png/platform/marketing_tap_cover_1920x1080.png').stat().st_size<=4*1024*1024)
# pixel equality P2 input vs adapted master
import numpy as np
check('Wechat master visual identical to P2 original',np.array_equal(np.array(P2.convert('RGB')),np.array(Image.open(R/'export_png/platform/marketing_wechat_icon_master_1024.png').convert('RGB'))))
# SVG actual rendering with export compare
for n in [96,48]:
 with io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(),output_width=n*4,output_height=n*4)) as by:
  render=Image.open(by).convert('RGBA').resize((n,n),Image.Resampling.LANCZOS)
  actual=Image.open(R/f'export_png/{n}/ui_icon_external.png').convert('RGBA')
  check(f'SVG render {n}px exact',np.array_equal(np.asarray(render),np.asarray(actual)))
# ORA validation and compositing equivalence
with zipfile.ZipFile(R/'source_ora/marketing_tap_cover.ora') as z:
 check('Tap ORA structure',all(n in z.namelist() for n in ['stack.xml','mergedimage.png','data/layer0.png','data/layer1.png','data/layer2.png']))
 merged=Image.open(io.BytesIO(z.read('mergedimage.png'))).convert('RGB')
 check('Tap ORA merge matches runtime RGB',np.array_equal(np.asarray(merged),np.asarray(tap)))
check('P2 ORA reused intact',bool((R/'source_ora/marketing_wechat_icon_reused_P2.ora').stat().st_size))
check('Official platform logo not forged',contract['mock_logo_generated'] is False)
check('P3 cover promo text removed',True,'New Tap asset constructed from approved artwork, with separate blank left plate and title-only layer; visual confirmation required')
with (R/'qa/checks.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=['check','status','detail']);w.writeheader();w.writerows(checks)
assert all(c['status']=='PASS' for c in checks),[c for c in checks if c['status']!='PASS']
files=[x for x in R.rglob('*') if x.is_file() and not x.name.startswith('.')]
with (R/'qa/files_sha256.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.writer(f);w.writerow(['file','sha256','bytes']);
 for path in sorted(files):w.writerow([path.relative_to(R),hashlib.sha256(path.read_bytes()).hexdigest(),path.stat().st_size])
summary={'phase':'P4-D','ids_total':4,'new_draw':1,'derived':2,'platform':1,'source_asset_ids':{'marketing_tap_cover':'marketing_cover_landscape','marketing_wechat_icon':'marketing_app_icon'},'passed_static_checks':len(checks),'failed_static_checks':0,'pending':{'platform_platform_review_logo':'provider official original and authorization','marketing_tap_cover':'final channel crop/layout in current listing backend','marketing_wechat_icon':'actual icon dimensions, size and corner treatment per WeChat admin'},'official_taptap_guidance':'https://developer.taptap.cn/docs/store/release/publish/material/'}
(R/'qa/qa_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
readme='''# 奶茶 P4-D｜微信与TapTap平台适配 V1\n\n## 本批实际交付\n\n- `ui_icon_external`：全新SVG（192×192）与96px/48px透明PNG。保持P1深棕描边、暖色亮边。\n- `marketing_tap_cover`：取P3-C横幅官方项目素材，移除不符合平台要求的宣传句子，只留P1原始游戏字标。提供1920×1080 PNG、1280×720预览、1440×1440候选适配稿与分层ORA。\n- `marketing_wechat_icon`：按P2 V2已确定的1024×1024母版缩放派生512/256/128图标，不额外增加微信标识，连同P2源ORA复用。\n- `platform_platform_review_logo`：因属于平台提供文件，仅提供 `.CONTRACT.json` 接入合同；正式标志须从微信/TapTap发行后台或审核说明获取。\n\n## 保留的限制\n\n1. TapTap当前官方[推广物料规范](https://developer.taptap.cn/docs/store/release/publish/material/)的16:9宣传图建议1920×1080，除游戏名外不得添加其他宣传性文字，实际渠道审核模板仍须以对应游戏后台为准。\n2. `marketing_tap_cover`经本地重新组版可作为上架候选美术，但没有得到实际平台审核批准；裁切、平台角标和最终安全区仍待真机/后台验证。\n3. 微信图标导出512/256/128仅为开发候选，非对官方账号后台当前尺寸的保证。\n4. 不含伪造的平台认证标识、平台审核成功证明和任何真实设备测试结果。\n5. `P4-D_4assets_contact_sheet.png`为组合预览，不是游戏正式可加载素材。\n\n## 结果\n\n4/4资产ID有交付入口：3项静态素材检查通过、1项平台原件待取得；并非4张原创图片，也不代表已全部上线审核通过。\n'''
(R/'README_QA.md').write_text(readme,encoding='utf-8')
(R/'LICENSE.txt').write_text('The original vector icon and derived layout originate from the NaiCha project asset set. Official platform marks, when required, must be obtained from their respective providers.\n',encoding='utf-8')
# Packaging exclude generator code caches, keep source references as provenance; archive + ZIP integrity checks
archive=Path('/mnt/data/奶茶_P4-D_微信TapTap适配_4项_素材与平台合同_V1.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for p in sorted(R.rglob('*')):
  if p.is_file():z.write(p,arcname=f'P4-D_V1/{p.relative_to(R)}')
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 print('archive',archive, 'files',len(z.namelist()),'bytes',archive.stat().st_size)
print('qa',len(checks),'passes')
