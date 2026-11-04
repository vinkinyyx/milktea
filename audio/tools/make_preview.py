#!/usr/bin/env python3
"""Optional NON-RUNTIME listener preview: early BGM plus all eight SFX in sequence."""
from pathlib import Path
import subprocess,tempfile
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'assets/audio'
rt=A/'runtime';qa=A/'qa';sr=44100
n=int(18.0*sr)
r=subprocess.run(['ffmpeg','-loglevel','error','-i',str(rt/'bgm_classic.mp3'),'-ar','44100','-ac','2','-f','f32le','pipe:1'],capture_output=True,check=True)
bg=np.frombuffer(r.stdout,dtype='<f4').reshape(-1,2)[:n]
canvas=bg*.35
# Spread events across first 17 seconds to let the listener distinguish each cue
schedule=[(1.6,'ui_tap'),(3.3,'drop'),(5.0,'collision_soft'),(6.9,'merge_small'),
          (8.8,'merge_large'),(10.8,'shake_start'),(13.1,'danger_tick'),(15.3,'result')]
for t,name in schedule:
    s,rate=sf.read(rt/(name+'.wav'),dtype='float32')
    assert rate==sr
    start=int(t*sr)
    canvas[start:start+len(s),:]+=s[:,None]*.7
canvas[-int(.5*sr):]*=np.linspace(1,0,int(.5*sr))[:,None]
assert np.max(np.abs(canvas))<1
with tempfile.TemporaryDirectory() as td:
    x=Path(td)/'preview.wav'
    sf.write(x,canvas,sr,subtype='PCM_16')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(x),'-c:a','libmp3lame','-b:a','128k',str(qa/'试听样片.mp3')],check=True)
print('generated preview', (qa/'试听样片.mp3').stat().st_size, 'bytes')
