# 事例ページごとのOGP画像(src/pages/og/cases/[slug].png.ts)で使うフォントを作るスクリプト
# 使い方: python scripts/make-og-fonts.py
# 必要なもの: Python の fonttools(pip install fonttools)、Windows に入っている Noto Serif JP / Noto Sans JP(可変フォント)
#
# 画像を作る satori は可変フォントを読めないので、太さを 700 に固定し、
# ファイルを小さくするため JIS第1・第2水準(JIS X 0208)と半角英数・全角英数などの文字だけを残す。
# 残した文字の一覧は fonts/og-chars.txt に書き出し、ビルド時にフォントにない文字が来たら警告する。
# Noto フォントは SIL Open Font License 1.1(fonts/OFL.txt)。
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

ROOT = os.path.join(os.path.dirname(__file__), '..', 'fonts')
FONTS = {
    'NotoSerifJP-Bold.ttf': 'C:/Windows/Fonts/NotoSerifJP-VF.ttf',
    'NotoSansJP-Bold.ttf': 'C:/Windows/Fonts/NotoSansJP-VF.ttf',
}

def jis_chars():
    chars = set(chr(c) for c in range(0x20, 0x7F))  # 半角英数・記号
    chars |= set(chr(c) for c in range(0xFF01, 0xFFA0))  # 全角英数・半角カナ
    for hi in range(0xA1, 0xFF):  # JIS X 0208(EUC-JP の2バイト)
        for lo in range(0xA1, 0xFF):
            try:
                chars |= set(bytes([hi, lo]).decode('euc_jp'))
            except UnicodeDecodeError:
                pass
    chars |= set('～‐–—―“”‘’…‥・、。「」『』【】〈〉《》〔〕（）©®™€¥①②③④⑤⑥⑦⑧⑨⑩')
    return sorted(c for c in chars if c.isprintable() or c == ' ')

chars = jis_chars()
os.makedirs(ROOT, exist_ok=True)
for name, src in FONTS.items():
    font = instantiateVariableFont(TTFont(src), {'wght': 700})
    opts = subset.Options()
    opts.layout_features = ['kern', 'palt']  # 横書きの字詰めだけ残す(縦書きなどの字形は使わない)
    opts.hinting = False  # 画像に描くだけなのでヒンティングは不要
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(c) for c in chars])
    sub.subset(font)
    out = os.path.join(ROOT, name)
    font.save(out)
    print('saved', out, os.path.getsize(out) // 1024, 'KB')

with open(os.path.join(ROOT, 'og-chars.txt'), 'w', encoding='utf-8') as f:
    f.write(''.join(chars))
print(len(chars), 'chars')
