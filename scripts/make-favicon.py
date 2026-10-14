# favicon(public/favicon.ico、16・32・48px)を作り直すスクリプト。絵柄は public/favicon.svg と同じ
# 使い方: python scripts/make-favicon.py public/favicon.ico
# 必要なもの: Python の Pillow
import sys
from PIL import Image, ImageDraw

PAPER, INK = '#F4F1EA', '#1C1F24'
S = 16  # 描いてから縮小してなめらかにする(32×32 の16倍)
img = Image.new('RGBA', (32 * S, 32 * S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([0, 0, 32 * S - 1, 32 * S - 1], radius=6 * S, fill=INK)

def cubic(p0, p1, p2, p3, n=24):
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*e for a, b, c, e in zip(p0, p1, p2, p3)) for t in (i/n for i in range(n+1))]

# サイトのロゴと同じ形(viewBox 24×24 を 4px ずらして置く)
P = lambda px, py: ((px + 4) * S, (py + 4) * S)
width = 2 * S
pts = [P(12, 3), P(20, 6), P(20, 12)]
pts += cubic(P(20, 12), P(20, 16.5), P(16.6, 20.2), P(12, 21))
pts += cubic(P(12, 21), P(7.4, 20.2), P(4, 16.5), P(4, 12))[1:]
pts += [P(4, 6), P(12, 3)]
d.line(pts, fill=PAPER, width=width, joint='curve')
d.line([P(9, 12), P(11, 14), P(15, 10)], fill=PAPER, width=width, joint='curve')
for p in (pts[0], P(9, 12), P(15, 10)):
    r = width / 2
    d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=PAPER)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/favicon.ico'
img.resize((48, 48), Image.LANCZOS).save(out, sizes=[(16, 16), (32, 32), (48, 48)])
print('saved', out)
