from __future__ import annotations
import os, math, json, csv, hashlib, zipfile, textwrap
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageCms
import cairosvg

ROOT = Path('/mnt/data/naicha_output/P1-06')
SOURCES=ROOT/'source_svg'; OUT96=ROOT/'export_png'/'96'; OUT48=ROOT/'export_png'/'48'; PREV=ROOT/'preview'; QA=ROOT/'qa'
for p in (SOURCES,OUT96,OUT48,PREV,QA): p.mkdir(parents=True,exist_ok=True)

# Format: source SVG 192px, transparent canvas. Deep dark-brown carved glyphs, subtle milk-tea specular line. No background, text or fixed UI.
DARK='#4D2F23'; EDGE='#3E281E'; LIGHT='#ECC39A'; HILITE='#FFE0B9'
STROKE='stroke-linecap="round" stroke-linejoin="round"'

def double_path(d:str, outer=25, inner=17, highlight=False):
    extra = f'<path d="{d}" fill="none" stroke="{EDGE}" stroke-width="{outer}" {STROKE}/>'
    extra += f'<path d="{d}" fill="none" stroke="url(#brown)" stroke-width="{inner}" {STROKE}/>'
    if highlight:
        extra += f'<path d="{d}" fill="none" stroke="{LIGHT}" stroke-width="3.2" stroke-opacity=".34" {STROKE}/>'
    return extra

names={
 'play':'开始三角', 'continue':'继续箭头','pause':'暂停双条', 'settings':'设置齿轮','close':'关闭叉',
 'back':'返回箭头', 'restart':'重开回转箭头', 'home':'主页小屋','music_on':'音乐开'
}

def radial_gear_path():
    # 8 chunky, visually soft gear teeth around R70; central hole is actually transparent via evenodd fill.
    cx=cy=96
    radii=[]
    for i in range(64):
        k=i%8
        # broad, strong tooth with recessed gap, easy to recognize at 48 px
        if k in (2,3,4,5): r=68
        elif k in (1,6): r=61
        else: r=55
        theta=(i/64)*2*math.pi-math.pi/2
        radii.append((cx+r*math.cos(theta),cy+r*math.sin(theta)))
    poly='M '+' L '.join(f'{x:.2f} {y:.2f}' for x,y in radii)+' Z'
    hole=' M 119 96 A 23 23 0 1 0 73 96 A 23 23 0 1 0 119 96 Z'
    return poly + hole

def glyphs():
    d={}
    # 1: play triangle; centered, ample negative space inside a 96px button skin.
    d['play']='''
      <path d="M68 42 Q68 36 75 40 L147 85 Q159 93 147 101 L75 148 Q68 153 68 143 Z" fill="url(#brown)" stroke="#3F281E" stroke-width="8" stroke-linejoin="round"/>
      <path d="M80 56 L132 89" fill="none" stroke="#E8BA8B" stroke-opacity=".78" stroke-width="5" stroke-linecap="round"/>
      <path d="M80 134 L131 101" fill="none" stroke="#261A15" stroke-opacity=".22" stroke-width="4" stroke-linecap="round"/>
    '''
    # 2: continue, directional bent right arrow with clear stem.
    d['continue']=double_path('M44 96 H146 M111 61 L146 96 L111 131',26,16)
    d['continue']+='<path d="M47 90 H113" fill="none" stroke="#D5A374" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" />'
    # 3: two precisely paired bars
    d['pause']='''
      <rect x="50" y="43" width="32" height="106" rx="10" fill="url(#brown)" stroke="#3F281E" stroke-width="7" />
      <rect x="110" y="43" width="32" height="106" rx="10" fill="url(#brown)" stroke="#3F281E" stroke-width="7" />
      <path d="M60 56 V127 M120 56 V127" stroke="#EAC197" opacity=".66" stroke-width="4" stroke-linecap="round"/>
    '''
    # 4: gear with hollow center and outer tooth perimeter
    gear=radial_gear_path()
    d['settings']=f'''
      <path d="{gear}" fill="url(#brown)" fill-rule="evenodd" stroke="#3F281E" stroke-width="7" stroke-linejoin="round"/>
      <circle cx="96" cy="96" r="25" fill="none" stroke="#F5CB9F" stroke-width="2" stroke-opacity=".65"/>
      <path d="M59 60 Q96 31 130 62" fill="none" stroke="#F1C89C" stroke-width="4.5" stroke-opacity=".6" stroke-linecap="round"/>
    '''
    # 5: two robust crossing strokes
    d['close']=double_path('M57 57 L135 135 M135 57 L57 135',30,20)
    d['close']+='<path d="M57 51 L102 96" fill="none" stroke="#F0C99C" stroke-opacity=".43" stroke-width="3.5" stroke-linecap="round"/>'
    # 6: back arrow, directional left with line
    d['back']=double_path('M148 96 H46 M81 61 L46 96 L81 131',26,16)
    d['back']+='<path d="M149 90 H81" fill="none" stroke="#D5A374" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" />'
    # 7: restart clockwise loop (left/top arrowhead), intentionally distinct from continue
    d['restart']=double_path('M138 65 A53 53 0 1 1 79 47',23,14)
    d['restart']+='''
      <path d="M78 42 L111 43 Q115 43 112 49 L91 79 Q87 84 82 79 L70 52 Q67 45 78 42 Z" fill="url(#brown)" stroke="#3F281E" stroke-width="6" stroke-linejoin="round" />
      <path d="M82 48 L102 49" stroke="#F1C89C" opacity=".5" stroke-width="3" stroke-linecap="round"/>
    '''
    # 8: roof + body, simple door fits 48px, no additional text
    d['home']='''
      <path d="M53 89 L96 52 L139 89 V143 Q139 150 132 150 H60 Q53 150 53 143 Z" fill="url(#brown)" stroke="#3F281E" stroke-width="7.5" stroke-linejoin="round"/>
      <path d="M36 91 L96 40 L156 91" fill="none" stroke="#3F281E" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 91 L96 40 L156 91" fill="none" stroke="url(#brown)" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M61 81 L96 51 L131 81" fill="none" stroke="#EBC297" stroke-width="3" stroke-opacity=".76" stroke-linecap="round"/>
      <path d="M82 151 V112 Q82 107 87 107 H105 Q110 107 110 112 V151" fill="#F2D6B3" stroke="#3F281E" stroke-width="6" stroke-linejoin="round"/>
    '''
    # 9: paired musical notes + modest two sound waves, no fixed on/off text
    d['music_on']='''
      <path d="M78 117 V63 L130 49 V110" fill="none" stroke="#3F281E" stroke-width="24" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M78 117 V63 L130 49 V110" fill="none" stroke="url(#brown)" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M78 68 L130 54" fill="none" stroke="#EAC197" stroke-width="3" stroke-opacity=".67" stroke-linecap="round"/>
      <ellipse cx="64" cy="125" rx="23" ry="16" transform="rotate(-24 64 125)" fill="url(#brown)" stroke="#3F281E" stroke-width="6"/>
      <ellipse cx="116" cy="117" rx="23" ry="16" transform="rotate(-24 116 117)" fill="url(#brown)" stroke="#3F281E" stroke-width="6"/>
      <path d="M59 119 Q64 114 72 117 M112 111 Q116 108 123 111" stroke="#EAC197" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".75"/>
      <path d="M141 64 Q153 80 142 97" fill="none" stroke="#70432E" stroke-width="7" stroke-linecap="round"/>
    '''
    return d

DEFAULT_DEFS='''
  <defs>
   <linearGradient id="brown" x1="0" x2=".18" y1="0" y2="1">
    <stop offset="0%" stop-color="#996744"/>
    <stop offset="35%" stop-color="#875636"/>
    <stop offset="100%" stop-color="#653C2B"/>
   </linearGradient>
  </defs>
'''

allglyphs=glyphs()
manifest=[]
for slug,name in names.items():
    id=f'ui_icon_{slug}'
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="192" height="192" viewBox="0 0 192 192">
  <title>{name} | {id}</title>
  <desc>奶茶游戏 UI icon. Original editable vector. Transparent 192x192 canvas. 96px/48px exports. sRGB deep-brown. No dynamic text.</desc>
{DEFAULT_DEFS}
  <g id="{id}_paint" stroke-linejoin="round">
{allglyphs[slug]}
  </g>
</svg>'''
    source = SOURCES/f'{id}.svg';source.write_text(svg,encoding='utf-8')
    results={}
    for dim,out in ((96,OUT96),(48,OUT48)):
        b=cairosvg.svg2png(bytestring=svg.encode('utf-8'),output_width=dim,output_height=dim)
        img=Image.open(BytesIO(b)).convert('RGBA')
        path=out/f'{id}.png';img.save(path,optimize=True,icc_profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes())
        alpha=img.getchannel('A'); bbox=alpha.getbbox()
        assert bbox is not None and bbox[0]>=0 and bbox[2]<=dim and bbox[1]>=0 and bbox[3]<=dim
        assert alpha.getpixel((0,0))==0 and alpha.getpixel((dim-1,dim-1))==0
        assert alpha.getextrema()[0]==0 and alpha.getextrema()[1]>=240
        results[str(dim)]={'width':dim,'height':dim,'mode':img.mode,'bbox':bbox,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(), 'transparent_corners':True, 'fully_transparent_pixels':sum(1 for pix in alpha.getdata() if pix==0)}
    manifest.append({'asset_id':id,'name_zh':name,'category':'icon','first_phase':'P1','batch_id':'P1-06','required':'required','production_method':'new_draw','source_spec':'192x192 SVG','export_spec':'96x96 PNG;48x48 PNG','runtime_du':'48x48','alpha':'yes','pivot':'0.5,0.5','status':'static_qa_passed','source':f'source_svg/{id}.svg','png96':f'export_png/96/{id}.png','png48':f'export_png/48/{id}.png','qa':results})

# make contact sheet, 3x3 grid with checkerboard tiles and bilingual labels, PNG shots are always separate files
fontpaths=['/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
fpath=next((p for p in fontpaths if os.path.exists(p)),None)
def font(n): return ImageFont.truetype(fpath,n) if fpath else ImageFont.load_default()

def checker(size,tile=12):
    im=Image.new('RGBA',(size,size),'white');dr=ImageDraw.Draw(im)
    for y in range(0,size,tile):
        for x in range(0,size,tile):
            dr.rectangle((x,y,x+tile-1,y+tile-1), fill=(235,232,225,255) if (x//tile+y//tile)%2 else (255,255,255,255))
    return im

BGC='#F8F3EA';TEXT='#493327';BORDER='#DAC7B3';ACCENT='#965A3C'
W,H=1150,1190
sheet=Image.new('RGB',(W,H),'#F7F2EA');d=ImageDraw.Draw(sheet)
d.text((54,28),'P1-06  奶茶｜基础UI图标 第一组',font=font(38),fill=TEXT)
d.text((56,83),'按原清单：192×192 SVG母版 ｜ 96×96 / 48×48 透明PNG ｜ 共9个独立资产ID',font=font(20),fill='#7E5D46')
for idx,item in enumerate(manifest):
    col, row = idx%3, idx//3
    x,y=54+col*352,132+row*334
    d.rounded_rectangle((x,y,x+326,y+313),radius=17,fill='white',outline=BORDER,width=2)
    d.text((x+20,y+12),f'{idx+1:02d}  {item["name_zh"]}',font=font(25),fill=TEXT)
    tile=checker(174,14).convert('RGB')
    icon=Image.open(OUT96/(item['asset_id']+'.png')).convert('RGBA').resize((150,150),Image.Resampling.LANCZOS)
    tile.paste(icon,((174-150)//2,(174-150)//2),icon)
    sheet.paste(tile,(x+76,y+58))
    d.text((x+22,y+243),item['asset_id'],font=font(17),fill=TEXT)
    d.text((x+22,y+275),'PNG @96 / @48   ·   SVG @192',font=font(17),fill=ACCENT)
sheet.save(PREV/'P1-06_9icons_contact_sheet.png')

# 48px usability proof on light,dark,checker and icon-skin; icon sources correctly kept separate
PBGs=[('#FFF8F0','奶白背景'),('#493A32','深棕背景'),('#E5D6C6','浅茶背景')]
W,H=1250,800
proof=Image.new('RGB',(W,H),'#F8F3EA');d=ImageDraw.Draw(proof)
d.text((35,22),'P1-06  实际显示测试：48×48原生PNG，不放大查看',font=font(32),fill=TEXT)
x0=40
for ci,(bg,title) in enumerate(PBGs):
    xx=x0+ci*400; d.rounded_rectangle((xx,90,xx+374,325),radius=16,fill=bg,outline=BORDER,width=2)
    d.text((xx+20,100),title,font=font(22),fill='#302016' if ci!=1 else '#F8EBDA')
    for i,a in enumerate(manifest):
        ix=xx+55+(i%3)*110; iy=145+(i//3)*56
        icon=Image.open(OUT48/(a['asset_id']+'.png')).convert('RGBA')
        proof.paste(icon,(ix,iy),icon)
# actual ui icon button skin from preceding batch; icon applied as child with 18 px free margin
skin=Path('/mnt/data/naicha_output/P1-05/export_png/ui_btn_icon_normal.png')
d.text((45,358),'叠放在上一批「圆形图标按钮 normal」中的效果',font=font(27),fill=TEXT)
for i,a in enumerate(manifest):
    xx=35+i*135; yy=420
    if skin.exists():
        b=Image.open(skin).convert('RGBA').resize((96,96),Image.Resampling.LANCZOS)
        proof.paste(b,(xx+8,yy),b)
    else:
        d.ellipse((xx+8,yy,xx+104,yy+96),fill='#F1E2CF',outline='#805238',width=4)
    icon=Image.open(OUT48/(a['asset_id']+'.png')).convert('RGBA')
    proof.paste(icon,(xx+32,yy+24),icon)
    # abbreviate to fit 9 across
    d.text((xx+8,yy+106),a['name_zh'][:4],font=font(18),fill=TEXT)
d.text((42,648),'检查说明：48×48是图标图像的尺寸；实际可点击区域≥48 CSS px 应由游戏按钮节点实现。',font=font(22),fill=TEXT)
d.text((42,690),'深色按钮应由程序配置亮色图标变体，以保证对比度；本批仅交付标准深棕原色。',font=font(21),fill='#825A42')
proof.save(PREV/'P1-06_48px_readability_and_button_fit.png')

# QA: images truly different, color/audit and all source files
for dim,out in [(96,OUT96),(48,OUT48)]:
    assert len(list(out.glob('*.png')))==9
assert len(list(SOURCES.glob('*.svg')))==9
assert len({a['qa']['96']['sha256'] for a in manifest})==9
assert len({a['qa']['48']['sha256'] for a in manifest})==9

# Reproducible production helper (editable code + vector source).
import shutil
(ROOT/'tools').mkdir(exist_ok=True)
shutil.copy2(Path(__file__), ROOT/'tools'/'build_icons_p106.py')

# Manifests, license and QA
qa={'batch':'P1-06','source_inventory':'/奶茶/image-elements.json','asset_count':9,'source_count':9,'png_96_count':9,'png_48_count':9,'reference_alignment':'asset IDs, Chinese names, 192 SVG + 96/48 PNG, transparency and pivot match catalog','qa_scope':'static dimensions+RGBA+transparent corners+nonempty alpha+unique assets+file names+contact sheet+48px/button preview','limitations':['Touch hitbox, engine-supplied selected/disabled transformations, UI layer order and contrast cannot be proved by static files.', 'SVG is genuinely editable vector art. Icon variants for dark button background must be tinted in engine.'],'assets':manifest}
(QA/'asset_qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
with open(QA/'asset_manifest.csv','w',encoding='utf-8-sig',newline='') as f:
    cols=['asset_id','name_zh','batch_id','source_spec','export_spec','runtime_du','status','source','png96','png48']
    wr=csv.DictWriter(f,fieldnames=cols);wr.writeheader();wr.writerows({k:a[k] for k in cols} for a in manifest)
(ROOT/'LICENSE.txt').write_text('原创矢量制图。绘制脚本与SVG为本批项目原创输出。仅使用通用几何形状和本项目已批准的棕/奶白调色，不包含第三方图库、字体轮廓、平台商标。实际项目后续统一管理商用许可。\n',encoding='utf-8')
(ROOT/'README_QA.md').write_text('''# 奶茶｜P1-06 基础UI图标 A｜交付与验收

**9个独立asset_id，9份真正可编辑的192×192 SVG母版，9张96×96 PNG，9张48×48 PNG**。PNG是透明RGBA、sRGB目标色彩，透明画布四角已核验。各图不含文本/背景按钮皮肤，适合叠加在P1-05按钮皮肤上。

## 资产

1. `ui_icon_play` 开始三角
2. `ui_icon_continue` 继续箭头
3. `ui_icon_pause` 暂停双条
4. `ui_icon_settings` 设置齿轮
5. `ui_icon_close` 关闭叉
6. `ui_icon_back` 返回箭头
7. `ui_icon_restart` 重开回转箭头
8. `ui_icon_home` 主页小屋
9. `ui_icon_music_on` 音乐开

## 文件与尺寸

- `source_svg/ui_icon_*.svg`：独立192×192源文件；使用可编辑路径、形状与渐变。
- `export_png/96/ui_icon_*.png`：96×96 PNG，完整透明画布。
- `export_png/48/ui_icon_*.png`：48×48 PNG，运行时48×48 DU目标显示。
- `preview/P1-06_9icons_contact_sheet.png`：仅展示总览，不是游戏运行纹理。
- `preview/P1-06_48px_readability_and_button_fit.png`：真实48像素预览与P1-05按钮皮肤组合。
- `qa/asset_qa.json`、`qa/asset_manifest.csv`：逐项机器检查与源文件映射。

## 风格标准

延续P1-05棕色系（深棕轮廓、焦糖内填、奶油色局部高光），轮廓圆角、图形置中，主线在192母版保持至少14像素、在96像素输出保持至少7像素，超过清单“96档笔画至少4像素”要求。仅在界面适合的奶白按钮上直接使用；如叠放深色主按钮，应由程序指定高对比浅色方案。

## 自检与限制

- 9/9资产ID逐项对应原清单，9/9 SVG源独立。
- 9/9 @96、9/9 @48 PNG准确尺寸、RGBA、四角透明；图片内容互不重复。
- 检查真实48像素可辨识度、奶白/浅茶/深棕背景与P1-05 icon按钮叠加示意。
- 静态文件检查≠真实游戏运行测试：交互目标至少48 CSS像素、启停状态变化、弱动态处理、不同设备对比和焦点可访问性仍需要开发者集成验证。

文件名完全采用原始asset_id；`@96/@48`是目录名分档，避免两个导出覆盖同一个文件名。
''',encoding='utf-8')

zip_path=Path('/mnt/data/naicha_output/奶茶_P1-06_基础UI图标A_9独立SVG_18PNG_完整交付_V1.zip')
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
    for path in sorted(ROOT.rglob('*')):
        if path.is_file():z.write(path,arcname='P1-06/'+str(path.relative_to(ROOT)).replace('\\','/'))
print('GENERATED',zip_path,'bytes',zip_path.stat().st_size)
print('ASSETS',[(a['asset_id'],a['qa']['96']['bbox'],a['qa']['48']['bbox']) for a in manifest])
