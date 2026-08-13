#!/usr/bin/env node
/* -------------------------------------------------------------------------
   linkiir.com static builder

   Wraps each file in src/pages/*.html with the shared head, nav and footer,
   then writes clean, extensionless URLs:

     src/pages/index.html    ->  /index.html          served at  /
     src/pages/pricing.html  ->  /pricing/index.html  served at  /pricing
     src/pages/404.html      ->  /404.html            (hosts expect it here)

   Internal links written as `foo.html` in source are rewritten to `foo/`,
   and asset paths get the right number of `../` for the page's depth. That
   keeps the output host-agnostic: it works from a domain root, a subfolder,
   or a GitHub Pages project URL with no configuration.

     node src/build.js
   ------------------------------------------------------------------------- */
const fs = require('fs');
const path = require('path');

const SRC  = __dirname;
const ROOT = path.resolve(__dirname, '..');
const nav    = fs.readFileSync(path.join(SRC, 'partials-nav.html'), 'utf8');
const footer = fs.readFileSync(path.join(SRC, 'partials-footer.html'), 'utf8');
const side   = fs.readFileSync(path.join(SRC, 'partials-side.html'), 'utf8');

/* -------------------------------------------------------------------------
   ANALYTICS / SEARCH CONSOLE

   Fill any of these in and every page picks it up on the next build. Leave a
   value as '' and nothing is emitted for it, so there are no stray requests.

     ga4        Google Analytics 4 measurement ID   e.g. 'G-ABCD123XYZ'
     gtm        Google Tag Manager container ID     e.g. 'GTM-ABCD123'
     siteVerify Google Search Console meta token    (the content="..." value)

   Use ga4 OR gtm, not both — if you load GA4 through Tag Manager, set gtm
   only, or you will count every page view twice.
   ------------------------------------------------------------------------- */
const ANALYTICS = {
  ga4:        'AW-18360438570',
  gtm:        '',
  siteVerify: ''
};

/* Public origin, used for canonical URLs and og:url. No trailing slash. */
const SITE_URL = 'https://linkiir.com';

function analyticsHead() {
  let out = '';
  if (ANALYTICS.siteVerify) {
    out += `<meta name="google-site-verification" content="${ANALYTICS.siteVerify}">\n`;
  }
  if (ANALYTICS.ga4) {
    out += `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.ga4}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${ANALYTICS.ga4}');
</script>\n`;
  }
  if (ANALYTICS.gtm) {
    out += `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${ANALYTICS.gtm}');</script>\n`;
  }
  return out;
}

function analyticsBody() {
  if (!ANALYTICS.gtm) return '';
  return `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${ANALYTICS.gtm}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n`;
}

/* Pages that stay at the repository root rather than getting a directory. */
const ROOT_PAGES = new Set(['index', '404']);

/* nav items that can be marked active */
const ACTIVE = {
  platform:   'Platform',
  developers: 'Developers',
  company:    'Company'
};
const ACTIVE_LINKS = {
  network: 'network.html',
  pricing: 'pricing.html'
};

/* <!--@side:Dashboard--> expands the Grid console sidebar with that item active */
function expandSide(html) {
  return html.replace(/<!--@side:([^>]*?)-->/g, function (_, key) {
    const k = key.trim();
    return side.replace('<span class="gu-ni" data-k="' + k + '"',
                        '<span class="gu-ni on" data-k="' + k + '"');
  });
}

function head(meta, prefix, canonical) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.desc}">${meta.noindex ? '\n<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Linkiir">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;550;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}assets/site.css">
<link rel="stylesheet" href="${prefix}assets/gridui.css">
<link rel="canonical" href="${canonical}">
${analyticsHead()}</head>
<body>
${analyticsBody()}`;
}

function markActive(navHtml, active) {
  if (!active) return navHtml;
  if (ACTIVE[active]) {
    return navHtml.replace(
      new RegExp('(<button class="nav-link" aria-expanded="false">)(' + ACTIVE[active] + ')'),
      '<button class="nav-link" aria-expanded="false" aria-current="page">$2'
    );
  }
  if (ACTIVE_LINKS[active]) {
    return navHtml.replace(
      '<a class="nav-link" href="' + ACTIVE_LINKS[active] + '"',
      '<a class="nav-link" href="' + ACTIVE_LINKS[active] + '" aria-current="page"'
    );
  }
  return navHtml;
}

/* foo.html -> foo/ ; index.html -> ./ or ../ ; assets/x -> ../assets/x */
function rewriteUrls(html, prefix) {
  return html
    .replace(/(href|src)="(?!https?:|mailto:|tel:|#|\/\/)([A-Za-z0-9_-]+)\.html(#[^"]*)?"/g,
      (m, attr, slug, hash) => {
        const frag = hash || '';
        if (slug === 'index') return `${attr}="${prefix || './'}${frag}"`;
        if (ROOT_PAGES.has(slug)) return `${attr}="${prefix}${slug}.html${frag}"`;
        return `${attr}="${prefix}${slug}/${frag}"`;
      })
    .replace(/(href|src)="assets\//g, (m, attr) => `${attr}="${prefix}assets/`);
}

const dir = path.join(SRC, 'pages');
let built = 0;
const written = [];

fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(file => {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  const m = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) { console.error('! no metadata block in ' + file); return; }
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length);

  const slug   = file.replace(/\.html$/, '');
  const atRoot = ROOT_PAGES.has(slug);
  const prefix = atRoot ? '' : '../';
  const outPath = atRoot
    ? path.join(ROOT, slug + '.html')
    : path.join(ROOT, slug, 'index.html');

  const scripts = [].concat(meta.script || [])
    .map(s => `<script src="${prefix}assets/${s}"></script>\n`).join('');

  const canonical = atRoot
    ? (slug === 'index' ? SITE_URL + '/' : SITE_URL + '/' + slug + '.html')
    : SITE_URL + '/' + slug;

  const page =
    head(meta, prefix, canonical) +
    rewriteUrls(markActive(nav, meta.active), prefix) + '\n' +
    rewriteUrls(expandSide(body.trim()), prefix) + '\n\n' +
    rewriteUrls(footer, prefix) + '\n\n' +
    `<script src="${prefix}assets/site.js"></script>\n` +
    scripts +
    '</body>\n</html>\n';

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, page);
  written.push(path.relative(ROOT, outPath));
  built++;
});

/* tidy: remove any stale flat *.html left over from the previous URL scheme */
fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).forEach(f => {
  const slug = f.replace(/\.html$/, '');
  if (!ROOT_PAGES.has(slug)) {
    fs.unlinkSync(path.join(ROOT, f));
    console.log('removed stale ' + f);
  }
});

written.sort().forEach(w => console.log('built ' + w));
console.log(built + ' page(s) written to ' + ROOT);
