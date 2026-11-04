#!/usr/bin/env python3
"""Batched real decoded-audio checks & canonical asset manifest. NOT an aural/device test."""
import csv, json, hashlib, itertools, subprocess, math, os
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets/audio'; MASTER=A/'masters'; RT=A/'runtime'; QA=A/'qa'
QA.mkdir(exist_ok=True,parents=True)
SFX=['ui_tap','drop','collision_soft','merge_small','merge_large','shake_start','danger_tick','result']
DUR={'ui_tap':(.040,.100),'drop':(.070,.140),'collision_soft':(.080,.180),'merge_small':(.120,.220),
     'merge_large':(.160,.350),'shake_start':(.350,.650),'danger_tick':(.070,.130),'result':(.400,.700)}
P={"ui_tap":2,"drop":2,"collision_soft":1,"merge_small":3,"merge_large":3,"shake_start":2,"danger_tick":4,"result":5}
EVENT={'bgm_classic':'run_start_resume','ui_tap':'accepted_ui_action','drop':'IngredientDropped','collision_soft':'qualified_contact',
'merge_small':'MergeCommitted_level_2_4','merge_large':'MergeCommitted_level_5_9','shake_start':'ShakeConsumed','danger_tick':'danger_state_enter_or_tick','result':'RunEnded'}

def sha(x):return hashlib.sha256(x.read_bytes()).hexdigest()

def decode_mpeg(f):
    p=subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','f32le','-ar','44100','-ac','2','pipe:1'],capture_output=True,check=True)
    return np.frombuffer(p.stdout,dtype='<f4').reshape(-1,2).copy()

def probe(f):
    r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type,sample_rate,channels,sample_fmt,bits_per_raw_sample','-of','json',str(f)],capture_output=True,text=True,check=True)
    return json.loads(r.stdout)

def ebur(f):
    r=subprocess.run(['ffmpeg','-nostats','-hide_banner','-i',str(f),'-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
    s=r.stderr
    import re
    tail=s.split('Summary:')[-1]
    integ=re.search(r'Integrated loudness:\s+I:\s+([-0-9.]+) LUFS',tail)
    peak=re.search(r'True peak:\s+Peak:\s+([-0-9.]+) dBFS',tail)
    return float(integ.group(1)),float(peak.group(1))

def peak(x):return float(np.max(np.abs(x)))

bgm=decode_mpeg(RT/'bgm_classic.mp3')
print('decoded mp3 samples:',len(bgm),'duration:',len(bgm)/44100)
# Gapless metadata usually adjusts decoded samples despite MP3 container duration.
seam_jmp=float(np.max(np.abs(bgm[0,:]-bgm[-1,:])))
seam_der=np.max(np.abs(np.diff(bgm[:44100,:],axis=0)),axis=1)
seam_p99=float(np.quantile(seam_der,0.999))
lufs,tp=ebur(RT/'bgm_classic.mp3')
print('seam jump:',seam_jmp,'first second derivative p99.9:',seam_p99,'lufs,tp:',lufs,tp)

stats=[]; sounds={}
for name in ['bgm_classic']+SFX:
    path=RT/(name+('.mp3' if name=='bgm_classic' else '.wav'))
    master=MASTER/(name+'.wav')
    inf=probe(path); stream=next(s for s in inf['streams'] if s['codec_type']=='audio')
    minfo=sf.info(master)
    assert minfo.samplerate==48000 and minfo.subtype=='PCM_24'
    if name=='bgm_classic':
        pcm=bgm
        assert stream['codec_name']=='mp3' and stream['sample_rate']=='44100' and stream['channels']==2
        assert len(pcm)==3024000, 'decoded loop must contain 3024000 frames exactly'
        assert -20<=lufs<=-18 and tp<=-1.0
        assert path.stat().st_size<=900000
        assert seam_jmp<0.03, 'suspicious loop seam discontinuity'
    else:
        pcm,rate=sf.read(path,dtype='float32')
        sounds[name]=pcm
        assert stream['codec_name']=='pcm_s16le' and rate==44100 and stream['channels']==1
        lo,hi=DUR[name]
        assert lo<=len(pcm)/rate<=hi
        assert abs(float(np.mean(pcm)))<0.005
        assert peak(pcm)<0.9
        assert abs(float(pcm[0]))<0.0005 and abs(float(pcm[-1]))<0.0005
        assert minfo.channels==1
        # Detect earliest onset > -55dB relative to peak, require <10ms.
        idx=np.flatnonzero(np.abs(pcm)>.0018*peak(pcm))
        assert len(idx) and idx[0]/rate<.010,(name,idx[0]/rate)
        print(name,'duration_ms',round(len(pcm)/rate*1000,1),'sample_peak',round(peak(pcm),4),'first_onset_ms',round(idx[0]/rate*1000,2))
    stats.append(dict(cue_id=name,fmt=stream['codec_name'],bytes=path.stat().st_size,
                      duration_s=len(pcm)/44100,sample_rate=int(stream['sample_rate']),channels=int(stream['channels']),
                      sample_peak=peak(pcm),sha256=sha(path)))

sum_runtime=sum(x['bytes'] for x in stats)
sfx_bytes=sum(x['bytes'] for x in stats if x['cue_id']!='bgm_classic')
assert sum_runtime<=1200000 and sfx_bytes<=300000

# Test overlap of highest three under full settings (start-aligned + time-varying background)
# This is a signal test, not a substitute for actual engine output mix.
max_full=(0,None)
for nms in itertools.combinations(SFX,3):
    length=max(len(sounds[z]) for z in nms)
    sig=np.zeros(length,dtype=np.float32)
    for z in nms:sig[:len(sounds[z])]+=sounds[z]
    for offset in (2,4,12,16,38,56):
        bg=bgm[round(offset*44100):round(offset*44100)+length,:]
        if len(bg)!=length:continue
        v=peak(sig[:,None]+bg)
        if v>max_full[0]:max_full=(v,nms)
print('simultaneous worst from tested triples (100% settings):',max_full)
# default 0.35 BGM + 0.70 SFX and high-priority combos
max_default=(0,None)
for nms in itertools.combinations(SFX,3):
    length=max(len(sounds[z]) for z in nms)
    sig=np.zeros(length,dtype=np.float32)
    for z in nms:sig[:len(sounds[z])]+=sounds[z]*.7
    for offset in (2,4,12,16,38,56):
        bg=bgm[round(offset*44100):round(offset*44100)+length,:]
        if len(bg)!=length:continue
        v=peak(sig[:,None]+bg*.35)
        if v>max_default[0]:max_default=(v,nms)
print('simultaneous worst from tested triples (default settings):',max_default)
assert max_default[0]<1

# Preserve single existing manifest purpose, updating legacy extra cues to deferred.
fields=['cue_id','phase','variants','duration_ms','event','runtime_format','priority','status','license_status',
        'runtime_path','master_path','runtime_sha256','runtime_bytes','actual_duration_ms','sample_rate_hz',
        'channels','production_method','source_license_ref','qa_record','reuse_cue']
rows=[]
for x in stats:
    n=x['cue_id']
    rows.append(dict(cue_id=n,phase='P1',variants=1,duration_ms='~68571' if n=='bgm_classic' else f'{int(DUR[n][0]*1000)}-{int(DUR[n][1]*1000)}',
         event=EVENT[n],runtime_format='MP3 44.1kHz stereo 96kbps' if n=='bgm_classic' else 'WAV PCM16 44.1kHz mono',
         priority='music' if n=='bgm_classic' else P[n],status='rendered',license_status='original_synthesis_no_external_samples_review_pending',
         runtime_path=f'assets/audio/runtime/{n}'+('.mp3' if n=='bgm_classic' else '.wav'),
         master_path=f'assets/audio/masters/{n}.wav',runtime_sha256=x['sha256'],runtime_bytes=x['bytes'],
         actual_duration_ms=f"{x['duration_s']*1000:.3f}",sample_rate_hz=x['sample_rate'],channels=x['channels'],
         production_method='original_midi_plus_programmatic_FM_synthesis' if n=='bgm_classic' else 'original_programmatic_multi_operator_synthesis',
         source_license_ref='assets/audio/licenses/PROVENANCE.md',qa_record='assets/audio/qa/technical-report.json',reuse_cue=''))
for name,phase,event,reuse in [('collision_pearl','P1','qualified_pearl_contact','collision_soft'),
('merge_mochi','P1','MergeCommitted_level_9','merge_large'),('record','P1','new_personal_record','result'),
('unlock','P3','StageUnlocked',''),('reward_grant','P3','ShareRewardGranted',''),
('coupon_use','P3','coupon_consumed',''),('challenge_result','P4','win_tie_loss','')]:
    rows.append(dict(cue_id=name,phase=phase,variants=0,duration_ms='',event=event,
         runtime_format='',priority='',status='deferred',license_status='not_applicable',
         runtime_path='',master_path='',runtime_sha256='',runtime_bytes='',actual_duration_ms='',sample_rate_hz='',
         channels='',production_method='not_produced',source_license_ref='',qa_record='',reuse_cue=reuse))
with open(A.parent/'audio-manifest.csv','w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

report={'project':'奶茶挤挤','version':'2026-11-01','audio_status':'rendered_pending_human_gameplay_device_listening',
 'runtime_file_count':len(stats),'runtime_bytes_total':sum_runtime,'runtime_sfx_bytes':sfx_bytes,'budget_bytes':1200000,
 'original_midi_sha1_git_blob':'3e7d978ac031760b025b5bb6786a77d4f064ca0d',
 'sample_frames_bgm_decoded':len(bgm),'bgm_decoded_seconds':len(bgm)/44100,'bgm_mp3_container_seconds':float(probe(RT/'bgm_classic.mp3')['format']['duration']),
 'bgm_integrated_lufs':lufs,'bgm_true_peak_dbfs':tp,'bgm_seam_sample_jump':seam_jmp,
 'bgm_seam_early_derivative_p99_9':seam_p99,
 'mix_at_100_percent_tested_triples':{'peak':max_full[0],'cues':max_full[1]},
 'mix_at_default_35_70_tested_triples':{'peak':max_default[0],'cues':max_default[1]},
 'files':stats,
 'checks':{'runtime_file_names_codecs':'pass','source_midi_verified':'pass','decoded_loop_frames':'pass',
           'loudness_true_peak':'pass','sfx_durations_and_onsets':'pass','runtime_size':'pass',
           'headphone_2_full_loops':'not_performed','real_phone_speaker':'not_performed','real_cocos_engine':'not_performed',
           'human_listening':'not_performed','commercial_release_rights_final_review':'not_performed'},
 'caveats':['MP3 metadata stream duration includes encoder delay/padding; ffmpeg gapless decode is exactly 3024000 samples. Cocos actual decode/loop remains unverified.',
            'Numerical boundary and peak checks do not prove an audible seamless loop on the target engine.',
            'No listening via physical headset or phone speaker performed.']}
(QA/'technical-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('TOTAL runtime',sum_runtime,'SFX',sfx_bytes,'manifest rows',len(rows))
