"""Build the original classic-cup composition draft; no rendering or runtime edits.

Standard-library SMF writer informed by compose-game-music's MIT demo writer.
This score is new; upstream demo melodies are not used.
"""
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio/design'
PPQ = 480
BARS = 24
END = BARS * 4 * PPQ


def pitch(name):
    offsets = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    return (int(name[-1]) + 1) * 12 + offsets[name[0]]


def vlq(value):
    assert value >= 0
    data = [value & 127]
    value >>= 7
    while value:
        data.append((value & 127) | 128)
        value >>= 7
    return bytes(reversed(data))


def meta(kind, text):
    data = text.encode('utf-8') if isinstance(text, str) else text
    return bytes([255, kind]) + vlq(len(data)) + data


def chunk(events):
    previous = 0
    body = bytearray()
    for when, priority, payload in sorted(events, key=lambda event: (event[0], event[1])):
        assert previous <= when <= END
        body += vlq(when - previous) + payload
        previous = when
    body += vlq(END - previous) + meta(47, b'')
    return b'MTrk' + struct.pack('>I', len(body)) + body


def add(track, bar, beat, dur, note, vel):
    assert 1 <= bar <= BARS and 1 <= beat < 5
    assert dur > 0 and (bar - 1) * 4 + beat - 1 + dur <= BARS * 4
    assert 0 < vel <= 1 and 0 <= pitch(note) <= 127
    track['notes'].append(dict(bar=bar, beat=beat, dur=dur, note=note, vel=vel))


def build():
    tracks = [dict(name=name, role=role, gmProgramZeroBased=program, notes=[]) for name, role, program in [
        ('electric_piano', 'warm sustained common-tone harmony', 4),
        ('motif', 'soft mallet phrase with rests', 11),
        ('bass', 'root, fifth and return motion', 32),
        ('answer_pluck', 'sparse answer during lead rests', 24),
    ]]
    harmony, lead, bass, answer = tracks
    # Each pair lasts two bars. Common voices are tied across adjacent groups.
    voicings = [('C4','E4','A4'), ('C4','E4','G4','A4'), ('C4','E4','F4','A4'), ('D4','G4','C5'),
                ('C4','E4','A4'), ('C4','E4','G4','A4'), ('C4','E4','F4','A4'), ('D4','G4','B4'),
                ('C4','E4','G4','A4'), ('C4','E4','F4','A4'), ('C4','D4','F4','A4'), ('D4','G4','C5')]
    active = {}
    for index, chord in enumerate(voicings):
        start = index * 8 + 0.25
        for note in list(active):
            if note not in chord:
                onset = active.pop(note)
                add(harmony, int(onset // 4) + 1, onset % 4 + 1, start - onset, note, 0.34)
        for note in chord:
            active.setdefault(note, start)
    for note, onset in active.items():
        add(harmony, int(onset // 4) + 1, onset % 4 + 1, 95.75 - onset, note, 0.34)

    phrases = [
        [(1.5,.5,'E5'),(2,.75,'G5'),(3,.5,'A5'),(3.5,.75,'G5')],
        [(2,1,'E5'),(3.5,.5,'D5')],
        [(1.5,.5,'E5'),(2,.75,'G5'),(3,.5,'A5'),(3.5,.75,'G5')],
        [(1,1.5,'C5')],
        [(1.5,.5,'A5'),(2,.75,'G5'),(3,.5,'E5'),(3.5,.75,'D5')],
        [(2,1,'E5'),(3.5,.5,'G5')],
        [(1.5,.5,'G5'),(2,.75,'E5'),(3,.5,'D5')],
        [(1,1,'D5')],
    ]
    roots = ['C2','C2','A2','A2','F2','F2','G2','G2'] * 2 + ['A2','A2','F2','F2','D2','D2','G2','G2']
    fifths = {'C2':'G2','A2':'E2','F2':'C3','G2':'D2','D2':'A2'}
    for bar in range(1, BARS + 1):
        phrase = phrases[(bar - 1) % 8]
        if 17 <= bar <= 22:
            phrase = phrase[:2] if bar % 2 else [(2, 1.5, 'C5')]
        if bar == 23:
            phrase = [(1.5, .5, 'E5'), (2.5, 1, 'D5')]
        if bar == 24:
            phrase = [(1, 1, 'D5'), (3, .5, 'G4')]
        for beat, dur, note in phrase:
            add(lead, bar, beat, dur, note, .48 if bar <= 16 else .43)
        add(bass, bar, 1, 1.4, roots[bar-1], .42)
        add(bass, bar, 3, .85, fifths[roots[bar-1]], .35)
        if bar in (4, 8, 12, 16, 20):
            for beat, note in [(3, 'E4'), (3.5, 'G4')]:
                add(answer, bar, beat, .4, note, .29)
    score = dict(title='杯里的一小会儿', cue='bgm_classic', sourceType='original symbolic composition draft',
                 bpm=84, meter='4/4', scale='C major harmony; C D E G A pentatonic motif', loopBars=BARS,
                 loopSeconds=480/7, tracks=tracks, runtimeIntegrated=False, rendered=False, listeningVerified=False,
                 transitions=[dict(state='danger', action='duck music by 4 dB, do not change tempo'),
                              dict(state='background', action='pause; discard expired SFX')])
    events = [(0, 0, meta(3, 'Classic Cup Conductor')),
              (0, 1, meta(81, round(60_000_000/84).to_bytes(3, 'big'))),
              (0, 2, meta(88, bytes([4, 2, 24, 8]))), (0, 3, meta(6, 'LOOP_START')),
              (END, 0, meta(6, 'LOOP_END'))]
    chunks = [chunk(events)]
    for channel, track in enumerate(tracks):
        events = [(0, 0, meta(3, track['name'])),
                  (0, 1, bytes([192 | channel, track['gmProgramZeroBased']])),
                  (0, 2, bytes([176 | channel, 7, 90])),
                  (0, 3, bytes([176 | channel, 10, [60, 68, 64, 56][channel]]))]
        for note in track['notes']:
            start = round(((note['bar']-1)*4 + note['beat']-1)*PPQ)
            stop = start + round(note['dur']*PPQ)
            events.extend([(start, 5, bytes([144 | channel, pitch(note['note']), round(note['vel']*127)])),
                           (stop, 4, bytes([128 | channel, pitch(note['note']), 0]))])
        chunks.append(chunk(events))
    midi = b'MThd' + struct.pack('>IHHH', 6, 1, len(chunks), PPQ) + b''.join(chunks)
    # Validate independent chunk framing and declared lengths before writing.
    offset = 14
    for _ in chunks:
        assert midi[offset:offset+4] == b'MTrk'
        size = struct.unpack('>I', midi[offset+4:offset+8])[0]
        offset += 8 + size
    assert offset == len(midi) and len(chunks) == len(tracks) + 1
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT/'bgm_classic.music.json').write_text(json.dumps(score, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (OUT/'bgm_classic.mid').write_bytes(midi)
    report = dict(status='symbolic-validation-only', bpm=84, bars=BARS, tracks=len(tracks),
                  totalNotes=sum(len(t['notes']) for t in tracks), midiBytes=len(midi),
                  sha256=hashlib.sha256(midi).hexdigest(), loopSeconds=480/7,
                  heard=False, finalAudioProduced=False, runtimeIntegrated=False)
    (OUT/'validation.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    build()
