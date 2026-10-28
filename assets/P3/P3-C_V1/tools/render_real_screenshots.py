#!/usr/bin/env python3
"""Replace P3-C screenshot placeholders with user-supplied, VERIFIED in-game captures.
Usage: python render_real_screenshots.py --captures /path/to/real_screenshots --out /path/to/output
Expected: play.png, merge.png, stages.png, rank.png in captures; do not use simulated/test-design images for publishing.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageCms
from pathlib import Path
import argparse
p=argparse.ArgumentParser();p.add_argument('--captures',required=True);p.add_argument('--out',required=True);args=p.parse_args()
root=Path(__file__).resolve().parent.parent
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
# Replace ALL visible placeholder content, including the warning banner. We copy screenshot pixels into a safe, clipped central region.
for name in ['play','merge','stages','rank']:
    src=Path(args.captures)/f'{name}.png'
    if not src.exists():raise FileNotFoundError(f'Missing actual game screenshot: {src}')
    capture=Image.open(src).convert('RGB')
    if capture.width<750 or capture.height<1334:raise ValueError(f'Real screenshot resolution too low: {src}')
    with Image.open(root/'master_png'/f'marketing_screenshot_{name}@1500x2668.png') as original:
        card=original.convert('RGB')
    x0,y0,x1,y1=(228,456,1272,2313);tw,th=x1-x0,y1-y0
    # central safe crop from actual screenshot; no distortion
    w,h=capture.size; scale=max(tw/w,th/h); resize=capture.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)
    x=(resize.width-tw)//2;y=(resize.height-th)//2
    resize=resize.crop((x,y,x+tw,y+th))
    mask=Image.new('L',(tw,th),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,tw-1,th-1),radius=45,fill=255)
    card.paste(resize,(x0,y0),mask)
    # remove inaccurate footer by replacing with project-approved plain background
    d=ImageDraw.Draw(card);d.rounded_rectangle((184,2430,1316,2565),radius=46,fill='#FFF8E9')
    card.resize((750,1334),Image.Resampling.LANCZOS).save(out/f'marketing_screenshot_{name}_FINAL.png',icc_profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes())
print('Four files rendered with real screenshots. Verify app store policy and safe area before publishing.')
