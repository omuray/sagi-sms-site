import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ビルドの最後に、伏せ忘れの電話番号がページに残っていないか調べる
// 見つかったらビルドを失敗させる(Cloudflare は前のサイトを出したままにする)
// 0 か 81 で始まり、区切りを除いて数字が10桁以上続くものを電話番号とみなす
const CANDIDATE = /(?<![\w\/=.●+-])(?:\+?81|0)[\d\s\-‑()]{8,16}\d/g;

async function htmlFiles(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function pageText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

export default function phoneCheck() {
  return {
    name: 'phone-check',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const found = [];
        for (const file of await htmlFiles(root)) {
          const text = pageText(await fs.readFile(file, 'utf-8'));
          for (const m of text.matchAll(CANDIDATE)) {
            if (m[0].replace(/\D/g, '').length >= 10) {
              found.push(`${path.relative(root, file)}: ${m[0].trim()}`);
            }
          }
        }
        if (found.length > 0) {
          throw new Error(
            `伏せられていない電話番号が見つかったため、ビルドを止めました。\n` +
              `src/lib/sheet.ts の PHONE を直すか、シートの本文を修正してください。\n` +
              found.map((f) => `  - ${f}`).join('\n'),
          );
        }
        logger.info('電話番号のチェック:問題なし');
      },
    },
  };
}
