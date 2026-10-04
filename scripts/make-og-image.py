# OGP画像(public/og.png、1200×630)を作り直すスクリプト
# 使い方: python scripts/make-og-image.py public/og.png
# 必要なもの: Python の Pillow、Windows に入っている Noto Serif JP / Noto Sans JP(可変フォント)
import sys
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER, INK, SUB, BODY, LINE, ALERT, CARD = '#F4F1EA', '#1C1F24', '#5A5F66', '#3C4148', '#C9C3B6', '#B4471F', '#FFFFFF'
SERIF = 'C:/Windows/Fonts/NotoSerifJP-VF.ttf'
SANS = 'C:/Windows/Fonts/NotoSansJP-VF.ttf'

def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    f.set_variation_by_axes([weight])
    return f

S = 3  # 描いてから縮小してなめらかにする
img = Image.new('RGB', (W * S, H * S), PAPER)
d = ImageDraw.Draw(img)

def cubic(p0, p1, p2, p3, n=24):
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*e for a, b, c, e in zip(p0, p1, p2, p3)) for t in (i/n for i in range(n+1))]

def shield(x, y, scale, color, width):
    # サイトのロゴと同じ形(viewBox 24×24)
    P = lambda px, py: (x + px*scale, y + py*scale)
    pts = [P(12, 3), P(20, 6), P(20, 12)]
    pts += cubic(P(20, 12), P(20, 16.5), P(16.6, 20.2), P(12, 21))
    pts += cubic(P(12, 21), P(7.4, 20.2), P(4, 16.5), P(4, 12))[1:]
    pts += [P(4, 6), P(12, 3)]
    d.line(pts, fill=color, width=width, joint='curve')
    d.line([P(9, 12), P(11, 14), P(15, 10)], fill=color, width=width, joint='curve')
    for p in (pts[0], P(9, 12), P(15, 10)):
        r = width / 2
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=color)

# 左の縦帯
d.rectangle([0, 0, 18*S, H*S], fill=ALERT)

left = 96 * S
# ロゴと見出しラベル
shield(left - 6*S, 78*S, 4.2*S, INK, int(7*S))
d.text((left + 100*S, 132*S), '詐欺SMS・フィッシングメールの事例集', font=font(SANS, 30*S, 700), fill=ALERT, anchor='lm')

# サイト名
d.text((left, 300*S), '詐欺SMS実録ノート', font=font(SERIF, 104*S, 700), fill=INK, anchor='ls')

# 説明
d.text((left, 378*S), '実際に届いた文面と、見分け方・対処法をまとめています', font=font(SANS, 36*S, 500), fill=BODY, anchor='ls')

# 下の帯
d.rectangle([18*S, 470*S, W*S, H*S], fill=INK)
d.text((left, 550*S), 'メッセージのURLは開かない。公式アプリで確かめる。', font=font(SANS, 38*S, 700), fill=PAPER, anchor='lm')

img = img.resize((W, H), Image.LANCZOS)
img.save(sys.argv[1], optimize=True)
print('saved', img.size)
