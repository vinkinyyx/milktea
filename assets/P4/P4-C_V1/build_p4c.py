from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms
import cairosvg, io, json, csv, hashlib, zipfile, xml.etree.ElementTree as ET
from datetime import date
root=Path(__file__).parent
name='ui_icon_ad_play'
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192" role="img" aria-label="自愿观看视频图标">
<title>ui_icon_ad_play</title>
<defs>
 <linearGradient id="cupCream" x1="0.13" y1="0" x2="0.88" y2="1"><stop offset="0" stop-color="#FFF8E8"/><stop offset=".56" stop-color="#EFCEAA"/><stop offset="1" stop-color="#C88D60"/></linearGradient>
 <linearGradient id="caramel" x1=".1" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#FFF1A5"/><stop offset=".52" stop-color="#EFB85F"/><stop offset="1" stop-color="#B8743B"/></linearGradient>
</defs>
<g stroke-linecap="round" stroke-linejoin="round">
 <!-- Video player is deliberately not an official advertiser mark. -->
 <rect x="24" y="42" width="144" height="108" rx="27" fill="#8A5A40" stroke="#3F281E" stroke-width="11"/>
 <rect x="30" y="46" width="132" height="95" rx="23" fill="url(#cupCream)" stroke="#A36D4A" stroke-width="4"/>
 <path d="M48 62 Q54 57 67 57 H104" fill="none" stroke="#FFF9EB" stroke-width="8"/>
 <path d="M49 130 H143" fill="none" stroke="#B8855F" stroke-width="4" opacity=".65"/>
 <!-- Distinct and scalable play triangle; 96px raster has >4px outlines. -->
 <path d="M79 72 Q79 65 86 68 L122 91 Q130 96 122 101 L86 124 Q79 129 79 121Z" fill="url(#caramel)" stroke="#3F281E" stroke-width="11"/>
 <path d="M90 82 L109 95" stroke="#FFF9E7" stroke-width="5" opacity=".9"/>
</g>
</svg>'''
svg_path=root/'source_svg'/f'{name}.svg';svg_path.write_text(svg,encoding='utf-8')
ET.parse(svg_path)
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
checks=[]
for size in (96,48):
    source=cairosvg.svg2png(bytestring=svg.encode('utf-8'),output_width=size*4,output_height=size*4)
    img=Image.open(io.BytesIO(source)).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
    target=root/'export_png'/str(size)/f'{name}.png'
    img.save(target,icc_profile=profile,optimize=True)
    al=img.getchannel('A'); bbox=al.getbbox()
    corners=[img.getpixel((x,y))[3] for x,y in [(0,0),(size-1,0),(0,size-1),(size-1,size-1)]]
    assert img.size==(size,size) and img.mode=='RGBA' and al.getextrema()==(0,255) and max(corners)==0
    assert target.stat().st_size>500
    checks.append(dict(asset_id=name,size=f'{size}x{size}',mode=img.mode,icc='sRGB',alpha_extrema=list(al.getextrema()),bbox=list(bbox),transparent_corners=True,status='PASS'))

contract={
 'asset_id':'platform_ad_badge','phase':'P4-C','required':True,'production_method':'platform',
 'delivery_status':'AWAITING_SDK_PROVIDER','official_badge_image_supplied':False,
 'artwork_generated':False,'filename':'(runtime)',
 'source_spec':'provider-specified','export_spec':'provider-specified',
 'runtime_rule':'Use the official badge or SDK-provided ad disclosure UI only when mandated and licensed; do not draw, imitate, modify, or obscure it.',
 'acceptance_gates':[
  'Identify exact publishing platform, ad SDK, SDK and policy version',
  'Obtain official badge/UI and current licensed presentation rules',
  'Verify mandatory placement, visible ad disclosures, tap target and contrast on target device',
  'Verify non-reward or failed-video flow gives no unearned reward',
  'Record implementation screenshot and provider source before platform completion'
 ],
 'ownership':'publishing/SDK integration','source_spec_reference':'image-elements.json:platform_ad_badge'
}
(root/'platform'/'platform_ad_badge.CONTRACT.json').write_text(json.dumps(contract,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
fontbold='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
if not Path(fontpath).exists():
 import subprocess
 fontpath=subprocess.getoutput("fc-match -f '%{file}' 'Noto Sans CJK SC'")
 fontbold=fontpath
font=lambda s,b=False:ImageFont.truetype(fontbold if b else fontpath,s)
W,H=1152,700
sheet=Image.new('RGB',(W,H),'#FBF6EE');d=ImageDraw.Draw(sheet)
d.rounded_rectangle((24,22,W-24,102),radius=18,fill='#F1E3CF')
d.text((52,42),'P4-C  广告素材  /  静态验收预览',font=font(30,True),fill='#4A3025')
d.text((52,119),'01  ui_icon_ad_play  ·  自愿看视频',font=font(23,True),fill='#4A3025')
d.text((638,119),'02  platform_ad_badge  ·  平台广告标识',font=font(23,True),fill='#4A3025')
# left checkerboard demo panel
for l,r in [(35,567),(603,1117)]: d.rounded_rectangle((l,163,r,627),radius=20,fill='white',outline='#D9BDA4',width=2)
left=Image.new('RGBA',(228,228),(0,0,0,0));ld=ImageDraw.Draw(left)
for y in range(0,228,19):
 for x in range(0,228,19):ld.rectangle((x,y,x+18,y+18),fill='#ECE8E0' if (x//19+y//19)%2==0 else '#FFFFFF')
iconbig=Image.open(root/'export_png'/'96'/f'{name}.png').resize((206,206),Image.Resampling.LANCZOS)
left.alpha_composite(iconbig,(11,11))
sheet.paste(left,(183,190),left)
d.text((202,434),'192×192 SVG',font=font(22),fill='#5A4031')
d.text((136,472),'96×96 + 48×48 透明PNG',font=font(19),fill='#785641')
# dark and light contexts
for x,background in [(81,'#513729'),(330,'#EFDFCA')]:
 d.rounded_rectangle((x,520,x+152,598),radius=16,fill=background)
 small=Image.open(root/'export_png'/'48'/f'{name}.png').resize((60,60),Image.Resampling.LANCZOS)
 sheet.paste(small,(x+46,529),small)
d.text((630,205),'由广告SDK／发行平台提供',font=font(27,True),fill='#513729')
for y,t in [(285,'不设计或伪造平台认证标识'),(345,'不把占位图当成授权素材'),(405,'接入时核实SDK版本与标识规范'),(465,'实机测试后才能完成最终验收')]:
 d.ellipse((639,y+8,653,y+22),fill='#D19B58')
 d.text((666,y),t,font=font(19),fill='#785641')
d.rounded_rectangle((634,541,1093,596),radius=12,fill='#F7EDD9')
d.text((658,553),'状态：等待平台素材 / 非美术缺项',font=font(18,True),fill='#9B6537')
d.text((48,653),'正式交付只包含1套原创图标；其余一项是平台接入合同。预览不作为运行贴图。',font=font(17),fill='#674D40')
sheet_path=root/'previews'/'P4-C_两项验收总览.png';sheet.save(sheet_path)

# High DPR readability zoom examples
sheet2=Image.new('RGB',(720,340),'#FAF7F0');d2=ImageDraw.Draw(sheet2)
d2.text((25,18),'48px 缩小辨识度与背景适配检查',font=font(23,True),fill='#493124')
for i,(label,bg) in enumerate([('透明棋盘','#ECE8E0'),('奶油背景','#F1E2CF'),('深棕背景','#503629')]):
 x=20+i*235
 d2.rounded_rectangle((x,77,x+216,270),radius=16,fill=bg)
 i48=Image.open(root/'export_png'/'48'/f'{name}.png').resize((96,96),Image.Resampling.NEAREST)
 sheet2.paste(i48,(x+60,113),i48)
 d2.text((x+27,285),label,font=font(19),fill='#634735')
sheet2.save(root/'previews'/'P4-C_48像素对比.png')
manifest=[{'asset_id':name,'first_phase':'P4-C','name_zh':'自愿看视频','production_method':'new_draw','source':'source_svg/ui_icon_ad_play.svg','exports':'export_png/96/ui_icon_ad_play.png; export_png/48/ui_icon_ad_play.png','qa_status':'PASS_STATIC','platform_dependency':'none'},
 {'asset_id':'platform_ad_badge','first_phase':'P4-C','name_zh':'平台广告标识','production_method':'platform','source':'platform/platform_ad_badge.CONTRACT.json','exports':'(runtime) — official platform source only','qa_status':'WAIT_PLATFORM','platform_dependency':'must supply licensed asset or SDK UI'}]
with open(root/'qa'/'asset_manifest.csv','w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=manifest[0].keys());w.writeheader();w.writerows(manifest)
qa={'phase':'P4-C','manifest_ids':['ui_icon_ad_play','platform_ad_badge'],'source_spec':'/mnt/data/naicha_inputs/image-elements.json','checks':checks,'source_svg_parsed':True,'svg_size':'192x192','minimum_outline_96px':5.5,'min_required_outline_96px':4,'pivot':'0.5,0.5','runtime_touch_target':'must be >=48 CSSpx by app, not baked in sprite','icon_static':'PASS','platform_badge':'WAIT_PLATFORM','full_platform_release':'NOT_APPROVED','unofficial_platform_logo_generated':False,'style_reference':'P4-B SVG icons / P1 icon strokes','note':'PNG used straight-alpha RGBA and embedded sRGB profile; 48px legibility checked on beige/dark contexts.'}
(root/'qa'/'qa_summary.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
readme='''# 奶茶 P4-C 广告相关素材 · V1\n\n## 原始范围\nP4-C 在213项原清单中只有 2 个资产ID。\n\n| ID | 正式制作方式 | 交付现状 |\n|---|---|---|\n| `ui_icon_ad_play` | 新绘192×192 SVG + 96/48 RGBA PNG | **静态技术检查通过** |\n| `platform_ad_badge` | 平台提供 `(runtime)` | **待真实SDK或发行平台提供**；仅交付接入合同，**不得假造图片** |\n\n## 美术风格\n继承P1～P4奶茶UI：深棕#3F281E、奶油#FFF8E8、焦糖#EFB85F；统一圆角、45度高光；视频框+播放三角；不绘制真实广告商Logo、文字、动态按钮状态。\n\n## 文件与工程规则\n- source_svg/ui_icon_ad_play.svg 是真正的矢量可编辑母版，非PNG外贴的SVG。\n- export_png/96 和 /48 各含一张独立PNG；8bit straight RGBA+嵌入sRGB ICC。\n- pivot=(0.5,0.5)，九切无，触摸区由程序设置≥48 CSSpx。\n- 边框SVG 11px，96px运行版本约5.5px，不小于4px。\n- 关闭/禁用状态由程序调色并真正禁用交互，不重复绘图。\n\n## 验收结论与集成依赖\n1. 静态资产：尺寸、透明边、sRGB、SVG可编辑、文件齐备检查通过。\n2. 平台资产：`platform_ad_badge` 必须由官方SDK或授权渠道按现行要求提供；不得用当前概念展示图或自造广告标志替代。\n3. 接入待验：真实广告关闭/失败场景不能领取奖励；触摸区、可用性、广告告知和SDK平台标志需实际机型验证。\n4. 本批**未**完成平台发布验收，不能声明2张图片均已制作。\n\n提示：P4-D微信和Tap适配属于**下一批**，不包含在本ZIP中。\n'''
(root/'README_QA.md').write_text(readme,encoding='utf-8')
(root/'LICENSE.txt').write_text('原创ui_icon_ad_play由本次交付生成；参考已确认的P1-P4美术基线，不含第三方素材、商标或平台授权标志。platform_ad_badge 未获取平台许可，未提供图像。\n',encoding='utf-8')
# hash manifest excluding itself
files=sorted(p for p in root.rglob('*') if p.is_file() and p.name not in ['build_p4c.py','file_sha256.csv'])
with open(root/'qa'/'file_sha256.csv','w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['file','sha256','bytes']);
 for p in files:w.writerow([p.relative_to(root),hashlib.sha256(p.read_bytes()).hexdigest(),p.stat().st_size])
zipfile_path=Path('/mnt/data/奶茶_P4-C_广告相关_1图标加1平台接入合同_V1.zip')
with zipfile.ZipFile(zipfile_path,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(p for p in root.rglob('*') if p.is_file() and p.name!='build_p4c.py'):
  z.write(p,p.relative_to(root))
with zipfile.ZipFile(zipfile_path) as z:assert z.testzip() is None
print('OUTPUT:',zipfile_path,zipfile_path.stat().st_size,'bytes')
print('CHECKS:',checks)
print('BUNDLE:',list(p.name for p in sorted(root.rglob('*')) if p.is_file()))
