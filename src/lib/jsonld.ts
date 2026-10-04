// 構造化データ(schema.org)を組み立てる。Base の jsonLd に渡す

const SITE_NAME = '詐欺SMS実録ノート';

// パンくず。items は [表示名, パス] を、ホームから順に並べる
export function breadcrumb(site: URL, items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: new URL(path, site).href,
    })),
  };
}

// サイト全体の情報(トップページに付ける)
export function website(site: URL, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: new URL('/', site).href,
    description,
    inLanguage: 'ja',
  };
}
