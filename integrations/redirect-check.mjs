import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ビルドの最後に、リダイレクト(public/_redirects)の移転元と同じ URL のページができていないか調べる
// Cloudflare Pages ではリダイレクトが優先されるので、そのページは表示されなくなる(ビルドは続ける)
export default function redirectCheck() {
  return {
    name: 'redirect-check',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        let text;
        try {
          text = await fs.readFile(path.join(root, '_redirects'), 'utf-8');
        } catch {
          return;
        }
        const hidden = [];
        for (const line of text.split(/\r?\n/)) {
          const from = line.trim().split(/\s+/)[0];
          if (!from || from.startsWith('#')) continue;
          const file = path.join(root, from, from.endsWith('/') ? 'index.html' : '');
          try {
            await fs.access(file);
            hidden.push(from);
          } catch {}
        }
        if (hidden.length > 0) {
          logger.warn(
            `リダイレクトの移転元と同じ URL のページがあります。リダイレクトが優先されるため表示されません。\n` +
              `public/_redirects の該当する行を消してください。\n` +
              hidden.map((u) => `  - ${u}`).join('\n'),
          );
        }
      },
    },
  };
}
