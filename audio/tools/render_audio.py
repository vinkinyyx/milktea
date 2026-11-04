#!/usr/bin/env python3
"""Reproducible original-synthesis renderer for 奶茶挤挤 2026-11-01.
Uses the original Git-verified multi-track MIDI as the exact BGM note/timing source.
No sampled instruments, external soundfonts, voices, models, or recordings.
"""
import json, math, hashlib, subprocess, tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
import mido
import pyloudnorm as pyln

ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets/audio'; MASTER=A/'masters'; RT=A/'runtime'; DESIGN=A/'design'
SR=48000; SRS=44100
BPM=84; BARS=24; N=round(60/BPM*4*BARS*SR)
RNG=np.random.default_rng(782035)

for p in [MASTER,RT]:p.mkdir(parents=True,exist_ok=True)

def note_freq(n):return 440*2**((n-69)/12)

def ease_attack(t,a=0.007):return 1-np.exp(-t/max(a,0.0001))

def release(t,dur,rel):
    return np.exp(-np.maximum(t-dur,0)/rel) * np.minimum(1.0, np.maximum((dur+rel*6-t)*SR/30,0))

def softsat(x):return np.tanh(x*1.14)/1.14

def fm_note(note,vel,dur,inst):
    freq=note_freq(note)
    rel={'electric_piano':0.64,'motif':0.16,'bass':0.12,'answer_pluck':0.15}[inst]
    n=int(min(dur+rel*7,18)*SR)
    t=np.arange(n,dtype=np.float64)/SR
    p=2*np.pi*freq*t
    if inst=='electric_piano':
        # Rhodes-like layered tine/body FM, mild chorusing, slowly breathing felt body
        idx=0.34*np.exp(-t/0.8)+0.018
        tine=np.sin(p+idx*np.sin(2.011*p))
        warmth=0.26*np.sin(2*p+0.12*np.exp(-t*3)*np.sin(3*p))
        chor=0.15*np.sin(2*np.pi*(freq*1.0021)*t+0.2)
        wood=0.09*np.sin(3*p)*np.exp(-t*1.4)
        osc=tine+warmth+chor+wood
        env=ease_attack(t,0.014)*(0.52*np.exp(-t/3.8)+0.35*np.exp(-t/9.0)+0.13*np.exp(-t/1.0))*release(t,dur,rel)
        g=0.068*(vel/49)**0.68
    elif inst=='motif':
        # Composite soft mallet: slightly inharmonic wood resonances, no bright ringing.
        wob=np.sin(p+0.26*np.exp(-t/0.17)*np.sin(2.9*p))
        osc=wob+0.26*np.sin(2.01*p)*np.exp(-t/0.18)+0.095*np.sin(3.95*p)*np.exp(-t/0.09)
        env=ease_attack(t,0.007)*(0.63*np.exp(-t/0.36)+0.25*np.exp(-t/0.83)+0.12*np.exp(-t/0.13))*release(t,dur,rel)
        g=0.16*(vel/62)**0.75
    elif inst=='bass':
        # Plucked bass: upper partials intentionally audible on small phone speakers.
        osc=np.sin(p+0.38*np.exp(-t/0.27)*np.sin(2*p))+0.36*np.sin(2*p)*np.exp(-t/0.5)+0.17*np.sin(3*p)*np.exp(-t/0.23)
        env=ease_attack(t,0.013)*(0.58*np.exp(-t/0.45)+0.42*np.exp(-t/1.35))*release(t,dur,rel)
        g=0.133*(vel/53)**0.8
    else:
        osc=np.sin(p+0.22*np.exp(-t/0.08)*np.sin(3*p))+0.24*np.sin(2*p)*np.exp(-t/0.17)+0.10*np.sin(3*p)*np.exp(-t/0.1)
        env=ease_attack(t,0.005)*np.exp(-t/0.22)*release(t,dur,rel)
        g=0.082*(vel/36)**0.7
    return (g*env*osc).astype(np.float32)

def cyclic_add(out,x,start,ch_gain=(1,1)):
    idx=(np.arange(len(x),dtype=np.int64)+int(start))%len(out)
    # For spans crossing loop boundary, values do not have repeated indices (notes <= 18s)
    out[idx,0]+=x*ch_gain[0]
    out[idx,1]+=x*ch_gain[1]

def read_midi_notes():
    midi=mido.MidiFile(DESIGN/'bgm_classic.mid')
    assert midi.ticks_per_beat==480
    parsed={}
    for tr in midi.tracks:
        name=tr.name
        if name not in ('electric_piano','motif','bass','answer_pluck'):continue
        tick=0; open_notes={}; notes=[]
        for ev in tr:
            tick+=ev.time
            if ev.type=='note_on' and ev.velocity>0:
                open_notes.setdefault(ev.note,[]).append((tick,ev.velocity))
            if ev.type=='note_off' or (ev.type=='note_on' and ev.velocity==0):
                start,vel=open_notes[ev.note].pop(0)
                notes.append({'beat':start/480,'duration_beats':(tick-start)/480,
                              'note_number':ev.note,'velocity':vel})
        assert not any(open_notes.values()),name
        parsed[name]=notes
    return parsed

def ring_effect(m):
    # Circular very short 'room', no delay gap or discarded reverb tails.
    wet=np.empty_like(m)
    for ch in range(2):
        wet[:,ch]=(m[:,ch]+0.090*np.roll(m[:,1-ch],round((0.057+0.013*ch)*SR))
                   +0.048*np.roll(m[:,ch],round((0.139+0.017*ch)*SR)))
    return wet

def render_bgm():
    notes=read_midi_notes()
    score=[]
    out=np.zeros((N,2),dtype=np.float32)
    counts={}
    for tr,ns in notes.items():
        counts[tr]=len(ns)
        for ev in ns:
            t=ev['beat']*60/BPM
            dur=ev['duration_beats']*60/BPM
            # Import original MIDI pitch and duration unchanged.
            v=fm_note(ev['note_number'],ev['velocity'],dur,tr)
            pan={'electric_piano':(0.97,0.93),'motif':(0.93,1.00),'bass':(0.89,0.89),'answer_pluck':(1.00,0.89)}[tr]
            cyclic_add(out,v,round(t*SR),pan)
            score.append({'track':tr,'beat':ev['beat'],'duration_beats':ev['duration_beats'],
                          'note_midi':ev['note_number'],'velocity_midi':ev['velocity']})
    out=ring_effect(out)
    out=softsat(out)
    # Avoid pulse at exact seam, WITHOUT fading to silence or changing length:
    # extremely short equal-power cross-boundary repair in sample domain.
    # Extend last sample to align with first with a 2ms smooth residual correction.
    delta=out[0,:]-out[-1,:]
    seam=round(0.0025*SR)
    out[-seam:,:]+=delta[None,:]*np.linspace(0,1,seam,endpoint=True)[:,None]
    meter=pyln.Meter(SR)
    lufs=meter.integrated_loudness(out)
    gain=10**((-19.0-lufs)/20)
    out=(out*gain).astype(np.float32)
    peak=np.max(np.abs(out))
    if peak>0.87:
        raise ValueError(f'LUFS target produces too hot an audio sample peak: {peak}')
    sf.write(MASTER/'bgm_classic.wav',out,SR,subtype='PCM_24')
    (DESIGN/'bgm_classic.transcribed-notes.json').write_text(json.dumps({
        'description':'Generated note transcription from SHA-verified upstream original MIDI; not a replacement for original .music.json',
        'source_midi_repository':'vinkinyyx/milktea',
        'source_midi_git_blob_sha':'3e7d978ac031760b025b5bb6786a77d4f064ca0d',
        'bpm':BPM,'bars':BARS,'meter':'4/4','target_seconds':N/SR,
        'notes':score
    },ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('BGM',round(N/SR,6),'notes',counts,'pre_lufs',round(lufs,2),'gain_db',round(20*math.log10(gain),2),'peak',round(peak,4))

# ===== Sound effects: layered original synthesizer, no outside samples =====

def filtered_noise(n,hi=2000,lo=120):
    x=RNG.normal(0,1,n)
    sos=butter(2,[lo,hi],btype='bandpass',fs=SR,output='sos')
    y=sosfilt(sos,x)
    y/=max(np.std(y),1e-9)
    return y

def sweep(t, start, end, dur, phase=0):
    # Integral of exponential or linear pitch sweep to avoid pitch discontinuities
    k=(end-start)/dur
    return np.sin(2*np.pi*(start*t+k*(t*t)/2)+phase)

def tone(t,f,ratio=0.19):
    p=2*np.pi*f*t
    return np.sin(p+0.18*np.sin(2*p)) + ratio*np.sin(2.02*p)+0.06*np.sin(3.9*p)

def mallet(t,f,attack=0.004,decay=.15):
    return tone(t,f,0.19)*ease_attack(t,attack)*np.exp(-t/decay)

def bump(t,start,dur,curvature=1.0):
    x=(t-start)/dur
    v=np.zeros_like(t)
    good=(x>=0)&(x<1)
    v[good]=np.sin(np.pi*x[good])**curvature
    return v

def sfx(name,seconds):
    n=round(seconds*SR)
    t=np.arange(n)/SR
    if name=='ui_tap':
        y=.61*sweep(t,580,315,seconds)*np.exp(-t/0.020)*ease_attack(t,.0012)
        y+=.115*filtered_noise(n,2400,540)*np.exp(-t/.009)*ease_attack(t,.0008)
        y+=.18*tone(t,385)*np.exp(-t/.029)*ease_attack(t,.002)
    elif name=='drop':
        y=.46*sweep(t,505,285,seconds)*np.exp(-t/0.041)*ease_attack(t,.003)
        y+=.115*sweep(t,1200,520,seconds)*np.exp(-t/.019)*ease_attack(t,.001)
        y+=.11*filtered_noise(n,1900,260)*np.exp(-t/.023)*ease_attack(t,.001)
    elif name=='collision_soft':
        y=.35*sweep(t,263,163,seconds)*np.exp(-t/.044)*ease_attack(t,.004)
        y+=.15*tone(t,207,0.06)*np.exp(-t/.059)*ease_attack(t,.003)
        y+=.13*filtered_noise(n,800,105)*np.exp(-t/.033)*ease_attack(t,.002)
    elif name=='merge_small':
        y=.64*mallet(t,659,.006,.095)
        shift=.055
        u=np.maximum(t-shift,0)
        y+=.61*mallet(u,784,.006,.087)*(t>=shift)
        y+=.10*tone(t,330)*np.exp(-t/.07)*ease_attack(t,.01)
    elif name=='merge_large':
        y=.32*mallet(t,523,.006,.17)
        for start,f,g in [(.037,659,.47),(.086,784,.50),(.133,1047,.20)]:
            u=np.maximum(t-start,0)
            y+=g*mallet(u,f,.007,.106)*(t>=start)
        y+=.22*tone(t,261)*np.exp(-t/.16)*ease_attack(t,.007)
    elif name=='shake_start':
        env=.35*bump(t,0,.23,.85)+.49*bump(t,.17,.28,.9)+.19*bump(t,.37,.12,1.1)
        texture=filtered_noise(n,1950,260)
        # Light moving liquid/cloth material, not persistent ambience or loud splash.
        y=texture*env
        y+=.10*np.sin(2*np.pi*(185*t+80*t*t))*bump(t,.04,.38,1)
        y+=.05*filtered_noise(n,900,140)*env
    elif name=='danger_tick':
        y=.43*tone(t,392,.14)*np.exp(-t/.043)*ease_attack(t,.003)
        y+=.24*tone(t,330,.11)*np.exp(-t/.041)*ease_attack(t,.003)
    elif name=='result':
        y=np.zeros(n)
        for start,f,g,dec in [(0,392,.36,.18),(.148,330,.40,.175),(.322,262,.52,.18)]:
            u=np.maximum(t-start,0)
            y+=g*(mallet(u,f,.01,dec)+.14*np.sin(2*np.pi*(f/2)*u)*np.exp(-u/.23))* (t>=start)
    else:raise ValueError(name)
    # Remove DC, 1-3ms fade in/out, deliberate peak differentiation rather than normalization.
    y-=np.mean(y)
    fade_in=min(round(SR*.002),n//8);fade_out=min(round(SR*.007),n//6)
    y[:fade_in]*=np.linspace(0,1,fade_in)
    y[-fade_out:]*=np.linspace(1,0,fade_out)
    target_db={'ui_tap':-14.7,'drop':-14.0,'collision_soft':-20.0,
               'merge_small':-12.6,'merge_large':-11.3,'shake_start':-14.1,
               'danger_tick':-13.3,'result':-10.9}[name]
    y*=10**(target_db/20)/np.max(np.abs(y))
    return np.asarray(y,dtype=np.float32)

SFX_DURATION={'ui_tap':.076,'drop':.119,'collision_soft':.142,
              'merge_small':.187,'merge_large':.286,'shake_start':.514,
              'danger_tick':.104,'result':.614}

def ffmpeg(*args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

def main():
    render_bgm()
    # Exact 3024000-frame intermediate is essential for correct LAME gapless metadata.
    # Direct WAV->MP3 filter resampling can append ~47 frames of output flush.
    with tempfile.TemporaryDirectory() as td:
        intermediate=Path(td)/'preencode_44100.wav'
        ffmpeg('-i',MASTER/'bgm_classic.wav',
               '-af','aresample=44100,atrim=end_sample=3024000,asetpts=N/SR/TB',
               '-c:a','pcm_s24le',intermediate)
        ffmpeg('-i',intermediate,'-c:a','libmp3lame','-b:a','96k',
               '-write_xing','1','-id3v2_version','0','-map_metadata','-1',RT/'bgm_classic.mp3')
    for name,d in SFX_DURATION.items():
        wav=sfx(name,d)
        sf.write(MASTER/f'{name}.wav',wav,SR,subtype='PCM_24')
        ffmpeg('-i',MASTER/f'{name}.wav','-ar','44100','-ac','1','-c:a','pcm_s16le',RT/f'{name}.wav')
        print(name,d,'sec','peak',round(float(np.max(np.abs(wav))),4))

if __name__=='__main__':main()
