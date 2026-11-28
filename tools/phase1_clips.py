#!/usr/bin/env python3
"""Phase 1 real-audio rule: a recorded clip for every citizenship question, answer and Somali explanation.

    python3 tools/phase1_clips.py --dry-run     # list what is missing -> reports/phase1/clip-manifest.json
    python3 tools/phase1_clips.py               # synthesize with Edge TTS, bundle, register in audio/index.json

Needs the `edge-tts` Python package and network access to the Edge TTS endpoint (Mac/server route; the VM
cannot reach it). Voices: English en-US-AriaNeural, Somali so-SO-UbaxNeural. Bundles match the existing ones
(mp3, 22.05 kHz, mono, 48 kb/s, 0.4 s between clips) and are appended as audio/bundle-NN.mp3; each clip is
registered as [bundle index, start s, duration s], the shape lookupAudioClip() already reads.
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'audio', 'index.json')
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
FFPROBE = os.environ.get('FFPROBE', 'ffprobe')
VOICE = {'en': 'en-US-AriaNeural', 'so': 'so-SO-UbaxNeural'}
GAP = 0.4
PER_BUNDLE = 150
SR = 22050


def norm(s):  # audioNormKey() in app/core.js
    return re.sub(r'\s+', ' ', str(s)).lower().strip()


def lines():
    out, seen = [], set()
    for ed in ('2025', '2008'):
        for q in json.load(open(os.path.join(ROOT, 'data', 'civics-' + ed + '.json'), encoding='utf-8'))['questions']:
            for text, lang, kind in [(q['q'], 'en', 'question')] + [(a, 'en', 'answer') for a in q['answers']] + [(q['explain_so'], 'so', 'explanation')]:
                if text.strip() and norm(text) not in seen:
                    seen.add(norm(text)); out.append({'text': text, 'lang': lang, 'kind': kind, 'edition': ed, 'n': q['n']})
    return out


def duration(path):
    return float(subprocess.check_output([FFPROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode().strip())


async def synth(items, tmp):
    import edge_tts  # only needed for a real run
    for i, it in enumerate(items):
        it['mp3'] = os.path.join(tmp, '%04d.mp3' % i)
        for attempt in range(3):
            try:
                await edge_tts.Communicate(it['text'], VOICE[it['lang']]).save(it['mp3']); break
            except Exception as e:  # transient network errors: retry, then stop loudly
                if attempt == 2: raise SystemExit('Edge TTS failed on %r: %s' % (it['text'][:60], e))
        print('  %d/%d %s' % (i + 1, len(items), it['text'][:60]), flush=True)


def bundle(items, out_mp3, tmp):
    """Concatenate clips as PCM with GAP silence, encode once; return [start, dur] per clip."""
    parts, spans, t = [], [], 0.0
    silence = os.path.join(tmp, 'gap.wav')
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=%d:cl=mono' % SR, '-t', str(GAP), silence], check=True)
    for it in items:
        wav = it['mp3'][:-4] + '.wav'
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', it['mp3'], '-ar', str(SR), '-ac', '1', wav], check=True)
        d = duration(wav); spans.append([round(t, 3), round(d, 3)]); t += d + GAP
        parts += [wav, silence]
    lst = os.path.join(tmp, 'list.txt')
    open(lst, 'w').write(''.join("file '%s'\n" % p for p in parts))
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ac', '1', '-ar', str(SR), '-b:a', '48k', out_mp3], check=True)
    return spans


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--dry-run', action='store_true'); a = ap.parse_args()
    idx = json.load(open(INDEX, encoding='utf-8'))
    have = {norm(k) for k in idx['clips']}
    want = lines(); todo = [x for x in want if norm(x['text']) not in have]
    summary = {'lines': len(want), 'registered': len(want) - len(todo), 'missing': len(todo),
               'by_kind': {k: sum(1 for x in todo if x['kind'] == k) for k in ('question', 'answer', 'explanation')}, 'voices': VOICE}
    os.makedirs(os.path.join(ROOT, 'reports', 'phase1'), exist_ok=True)
    json.dump({'summary': summary, 'missing': todo}, open(os.path.join(ROOT, 'reports', 'phase1', 'clip-manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(summary, ensure_ascii=False))
    if a.dry_run or not todo:
        return
    with tempfile.TemporaryDirectory() as tmp:
        asyncio.run(synth(todo, tmp))
        for start in range(0, len(todo), PER_BUNDLE):
            chunk = todo[start:start + PER_BUNDLE]
            name = 'audio/bundle-%02d.mp3' % (len(idx['bundles']) + 1)
            spans = bundle(chunk, os.path.join(ROOT, name), tmp)
            idx['bundles'].append(name); b = len(idx['bundles']) - 1
            for it, (s, d) in zip(chunk, spans):
                idx['clips'][it['text']] = [b, s, d]
            open(INDEX, 'w', encoding='utf-8').write(json.dumps(idx, ensure_ascii=False))  # same layout as the existing file
            print('wrote', name, len(chunk), 'clips', flush=True)


if __name__ == '__main__':
    main()
