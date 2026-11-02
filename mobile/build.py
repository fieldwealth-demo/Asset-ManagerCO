"""Build the Field mobile prototype (mobile/index.html) from mobile/src and mobile/data.json.

Run from the repo root: python3 mobile/build.py  (needs esbuild, fonttools, brotli)

out/field-mobile.html  - page content for the Artifact tool (skeleton added at publish)
out/test.html          - the same page wrapped in a full document for local checks
"""
import base64, io, json, os, re, subprocess, sys
from fontTools.ttLib import TTFont
from fontTools import subset

M = os.path.dirname(os.path.abspath(__file__))
SRC = f'{M}/src'
OUT = f'{M}/out'
REPO = os.path.dirname(M)
ESBUILD = os.environ.get('ESBUILD', 'esbuild')  # npm i -g esbuild@0.23.1
os.makedirs(OUT, exist_ok=True)

def rd(p): return open(p, encoding='utf-8').read()

# 1. bundle the app
subprocess.run([ESBUILD, f'{SRC}/main.jsx', '--bundle', '--format=iife', '--target=es2019', '--minify',
                '--jsx-factory=React.createElement', '--jsx-fragment=React.Fragment', '--loader:.js=jsx',
                f'--outfile={OUT}/app.js', '--log-level=warning'], check=True)
app_js = rd(f'{OUT}/app.js')

# 2. data snapshot (trim to what the app reads)
data = json.load(open(f'{M}/data.json'))
data_js = 'window.__FIELD_DATA__=' + json.dumps({'answers': data['answers'], 'teams': data['teams'], 'rowsCount': data['rowsCount']}, separators=(',', ':')).replace('</', '<\\/') + ';'

# 3. icons: Font Awesome Pro (from the repo's font files), subset to the glyphs the app names
pro = TTFont(f'{REPO}/fonts/FontAwesome6Pro-Solid.otf')
cmap = pro.getBestCmap()
by_name = {}
for cp, g in cmap.items():
    by_name.setdefault(g, set()).add(cp)
pua = {g: min(c for c in cps if c >= 0xe000) for g, cps in by_name.items() if any(c >= 0xe000 for c in cps)}
text = ''.join(rd(f'{SRC}/{f}') for f in os.listdir(SRC)) + json.dumps(data)
tokens = set(re.findall(r'[a-z0-9]+(?:-[a-z0-9]+)*', text))
tokens |= {t[3:] for t in tokens if t.startswith('fa-')}
used = sorted(t for t in tokens if t in pua and len(t) > 2)
cps = set()
for n in used: cps |= by_name[n]

def woff2(path, unicodes):
    o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['*']; o.notdef_outline = True
    f = subset.load_font(path, o); s = subset.Subsetter(o); s.populate(unicodes=unicodes); s.subset(f)
    b = io.BytesIO(); subset.save_font(f, b, o)
    return base64.b64encode(b.getvalue()).decode()

icon_css = (
    f'@font-face{{font-family:"FA6P";font-weight:900;font-display:block;src:url(data:font/woff2;base64,{woff2(f"{REPO}/fonts/FontAwesome6Pro-Solid.otf", cps)}) format("woff2")}}\n'
    f'@font-face{{font-family:"FA6P";font-weight:400;font-display:block;src:url(data:font/woff2;base64,{woff2(f"{REPO}/fonts/FontAwesome6Pro-Regular.otf", cps)}) format("woff2")}}\n'
    '.fa{font-family:"FA6P";font-weight:900;font-style:normal;font-variant:normal;display:inline-block;line-height:1;text-rendering:auto;-webkit-font-smoothing:antialiased}\n'
    '.fa.fr{font-weight:400}\n'
    + ''.join(f'.fa-{n}::before{{content:"\\{pua[n]:x}"}}\n' for n in used)
)

css = rd(f'{SRC}/styles.css')
head = (
    '<title>Field Mobile</title>\n'
    '<meta name="claude:viewport-fit-sides" content="cover">\n'
    '<meta name="theme-color" content="#0b1524">\n'
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap">\n'
    f'<style>\n{icon_css}{css}</style>\n'
)
body = (
    '<div id="root"></div>\n'
    '<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>\n'
    '<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>\n'
    f'<script>{data_js}</script>\n'
    f'<script>{app_js}</script>\n'
)
page = head + body
open(f'{OUT}/field-mobile.html', 'w', encoding='utf-8').write(page)
open(f'{OUT}/test.html', 'w', encoding='utf-8').write(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + head + '</head><body>\n' + body + '</body></html>')
missing = sorted(t for t in re.findall(r'\bn="([a-z0-9-]+)"', text) if t not in pua)
print('icons', len(used), 'missing', missing, 'page bytes', len(page))

import shutil
shutil.copy(f'{OUT}/test.html', f'{M}/index.html')
