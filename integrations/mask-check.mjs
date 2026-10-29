import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ビルドの最後に、伏せ忘れがページに残っていないか調べる
// 見つかったらビルドを失敗させる(Cloudflare は前のサイトを出したままにする)
// 伏せ字のルールは src/lib/sheet.ts の sanitize。ここはその取りこぼしを見つける役目

// ビルドを止めるもの(形がはっきりしているもの)
const ERRORS = [
  {
    label: '電話番号',
    // 0 か 81 で始まり、区切りを除いて数字が10桁以上続くものを電話番号とみなす
    pattern: /(?<![\w\/=.●+-])(?:\+?81|0)[\d\s\-‑()]{8,16}\d/g,
    test: (m) => m.replace(/\D/g, '').length >= 10,
  },
  {
    // ID=98893885、LINE ID:abc123 など(伏せ済みの ID=*** は対象外)
    label: 'ID',
    pattern: /(?<![A-Za-z])(?:ID|Id|id|ＩＤ)\s*[=:：＝]\s*[A-Za-z0-9][\w.@-]*/g,
  },
  {
    // CL=37731562597282 など、英字の短い見出しに続く識別番号
    label: '識別番号',
    pattern: /(?<![A-Za-z0-9])[A-Za-z]{1,4}\s*[=＝]\s*\d{6,}/g,
  },
  {
    // お問い合わせ番号・受付番号・注文番号・請求書番号など
    label: '〇〇番号',
    // 値が次の行にあるもの(「注文番号」の行の次に値だけの行)も含む
    pattern: /番号[ \t　]*(?:[=:：＝]|\n)\s*[A-Za-z0-9][A-Za-z0-9-]{3,}/g,
  },
  {
    // LINE:wl4281、Telegram:@abc など、メッセージアプリの名前に続くID
    label: 'アプリのID',
    pattern: /(?<![A-Za-z])(?:LINE|Line|Telegram|テレグラム|WhatsApp|Signal|WeChat|微信|Instagram|インスタ(?:グラム)?|Discord|KakaoTalk|Kakao|カカオトーク|Skype|Viber|TikTok|Facebook|Messenger|QQ|Zalo|Snapchat|Potato)\s*(?:アカウント)?\s*[=:：＝]\s*@?[A-Za-z0-9][\w.-]*/g,
  },
  {
    // 見出しのない @〇〇(Telegram や X のアカウント名)。伏せ済みの @*** は対象外
    label: '@アカウント名',
    pattern: /(?<![\w.@\/\[])@[A-Za-z0-9_][\w.]{2,}/g,
  },
  {
    // 友だち追加・招待リンク(line[.]me/ti/p/〇〇 など)のアカウント部分。伏せ済みの /*** は対象外
    label: '招待リンク',
    pattern: /(?<![\w-])(?:line\[\.\]me|lin\[\.\]ee|t\[\.\]me|telegram\[\.\](?:me|org)|wa\[\.\]me|chat\[\.\]whatsapp\[\.\]com|discord\[\.\](?:gg|com)|m\[\.\]me|instagram\[\.\]com|x\[\.\]com|twitter\[\.\]com|tiktok\[\.\]com|facebook\[\.\]com|signal\[\.\]me|qm\[\.\]qq\[\.\]com|u\[\.\]wechat\[\.\]com)\/(?!\*\*\*)[!-~]+/gi,
  },
];

// 警告だけ出すもの(金額や日付と紛らわしいので、ビルドは止めない)
const WARNINGS = [
  {
    label: '8桁以上の数字',
    pattern: /(?<![\w*\/.=-])\d{8,}(?![\d*])/g,
  },
];

// ページ(.html)と、本文を含むサイト内検索の索引(search-index.json)を調べる
async function htmlFiles(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html') || e.name === 'search-index.json') out.push(p);
  }
  return out;
}

function pageText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function scan(text, rules, file) {
  const found = [];
  for (const rule of rules) {
    for (const m of text.matchAll(rule.pattern)) {
      if (rule.test && !rule.test(m[0])) continue;
      found.push(`${file}: [${rule.label}] ${m[0].replace(/\s+/g, ' ').trim()}`);
    }
  }
  return found;
}

export default function maskCheck() {
  return {
    name: 'mask-check',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const errors = [];
        const warnings = [];
        for (const file of await htmlFiles(root)) {
          const text = pageText(await fs.readFile(file, 'utf-8'));
          const name = path.relative(root, file);
          errors.push(...scan(text, ERRORS, name));
          warnings.push(...scan(text, WARNINGS, name));
        }
        if (warnings.length > 0) {
          logger.warn(
            `伏せ忘れの可能性がある数字があります(ビルドは続けます)。個人を特定できる番号なら伏せてください。\n` +
              warnings.map((f) => `  - ${f}`).join('\n'),
          );
        }
        if (errors.length > 0) {
          throw new Error(
            `伏せられていない電話番号・ID・番号・アプリのアカウントが見つかったため、ビルドを止めました。\n` +
              `src/lib/sheet.ts の sanitize を直すか、シートの本文を修正してください。\n` +
              `手書きのガイド(src/content/guides/*.md)に引用した値が原因のこともあります。\n` +
              errors.map((f) => `  - ${f}`).join('\n'),
          );
        }
        logger.info('伏せ忘れのチェック:問題なし');
      },
    },
  };
}
