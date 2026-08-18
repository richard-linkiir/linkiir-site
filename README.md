# linkiir.com

Static marketing site for Linkiir: Grid (the integration engine), the engineers you get access to
with it, and Agent (launching March 2027).

Plain HTML, CSS and vanilla JS. **No build step is required to host it.** Every path is relative, so it
works from a domain root, a subfolder, or a GitHub Pages project URL without changes.

---

## Hosting on GitHub Pages

### Option A — commit and point Pages at the branch (simplest)

1. Create a repo and push these files to the repository **root** (so `index.html` is at the top level).
2. Repo → **Settings → Pages**.
3. **Source:** `Deploy from a branch`. **Branch:** `main`, folder `/ (root)`. Save.
4. The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so GitHub serves the files as-is instead of running them through Jekyll.

### Option B — GitHub Actions (included)

`.github/workflows/pages.yml` deploys on every push to `main`. To use it, set
**Settings → Pages → Source** to `GitHub Actions`. Nothing to configure — there is no build.

### Custom domain (linkiir.com)

1. **Settings → Pages → Custom domain:** enter `linkiir.com` and save. That writes a `CNAME` file.
2. At your DNS provider, add the GitHub Pages apex records:
   - `A` → `185.199.108.153`
   - `A` → `185.199.109.153`
   - `A` → `185.199.110.153`
   - `A` → `185.199.111.153`
   - `CNAME` `www` → `<user>.github.io`
3. Tick **Enforce HTTPS** once the certificate is issued (usually under an hour).

### Anywhere else

Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, or any web server: publish this folder.
No build command, no environment variables, no server runtime.

---

## Local preview

Open `index.html` directly, or serve it to be safe with relative paths:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Structure

```
index.html                 Homepage                     served at  /
platform-overview/         Platform > Overview (Grid)              /platform-overview
platform-security/         Platform > Security                     /platform-security
platform-services/         Platform > Services                     /platform-services
developers/                Developers > Get Started                /developers
downloads/                 Developers > Downloads (gated)          /downloads
latest/                    UNLISTED upgrade page, see below        /latest
pricing/                   Pricing (what's included)               /pricing
network/                   Integration Network (197 adapters)      /network
company/                   Company: founders, funding, governance  /company
events/                    Company > Events                        /events
contact/                   Talk to us                              /contact
404.html                   Not found (hosts expect it at the root)

assets/
  site.css                 Design system: tokens, layout, components, responsive
  gridui.css               Linkiir Grid console recreations (dark product UI)
  site.js                  Nav, scroll reveals, counters, code tabs, log stream
  pricing.js               Pricing calculator
  network.js               Integration Network search / filter / CSV export
  network-data.js          The 197-adapter registry (edit this to add adapters)
  downloads.js             Download gate + package matrix rendering
  downloads-data.js        Release manifest, edit this when you cut a release
  forms.js                 Web3Forms submission with inline success/failure
  logo.svg                 Wordmark lockup
  favicon.svg              Favicon

src/                       OPTIONAL source for regenerating the pages
  build.js                 Injects shared head/nav/footer into each page
  partials-nav.html        Shared header + navigation
  partials-footer.html     Shared footer
  partials-side.html       Grid console sidebar (used by the product mockups)
  pages/*.html             Page bodies + metadata
```

### Clean URLs

Pages are written as `<slug>/index.html`, so they are served at `/pricing`, `/network` and so on,
with no `.html` in the address bar. The builder handles this: write internal links in
`src/pages/*.html` as `pricing.html` and it rewrites them to `../pricing/` with the right depth of
`../` for assets. That keeps the output working from a domain root, a subfolder, or a GitHub Pages
project URL with no configuration.

`404.html` stays at the repository root because that is where static hosts look for it. Its links
are relative, so they resolve correctly for a missing page at the top level; a missing page several
directories deep will land on the right 404 but with relative links pointing one level too deep.

### You do need `src/` now

Because the published files live in per-page directories, editing them by hand means editing
`pricing/index.html` rather than `pricing.html`, and getting the `../` prefixes right yourself.
Easier to edit `src/pages/*.html` and run:

```bash
node src/build.js      # regenerates every page, and deletes stale flat *.html
```

---

## Editing guide

**Nav or footer** → `src/partials-nav.html` / `src/partials-footer.html`, then `node src/build.js`.
(Or edit each root HTML file directly if you dropped `src/`.)

**Colours, spacing, type** → the `:root` token block at the top of `assets/site.css`.
Courier New is the `--mono` token and is used for eyebrows, labels, data tables, code and badges.

**Pricing** → `src/pages/pricing.html`. The page lists what's included and asks people to contact
you; there are no figures anywhere and no calculator. If you add a feature to the product, add a
card to the twelve-card grid.

**Product video** → a Loom embed appears twice: in the homepage hero (centred, directly under the
headline) and part-way down `/platform-overview`. To change the video, swap the `/embed/` id in the
`<iframe src>` in `src/pages/index.html` and `src/pages/platform-overview.html`.

The wrapper keeps a 16:9 box at any width:

```html
<div class="video-frame">
  <div class="video-embed">
    <iframe src="https://www.loom.com/embed/YOUR-ID" title="..." loading="lazy" allowfullscreen></iframe>
  </div>
</div>
```

Use `.hero-video` around it for the full-width hero treatment, or `.video-inline` for the narrower
in-page version.

**Releases** → `assets/downloads-data.js`. Set `version`, `released`, `baseUrl`, `checksums` and
`notes`, and both `/downloads` and `/latest` update. The catalogue currently ships Linux (Docker
amd64, Docker arm64, native systemd) and Windows; there is no macOS package. `LK_PACKAGES` defines the platform
matrix; `{v}` is the version and `{k}` is the broker slug, so one entry produces both the
bundled-Kafka and bring-your-own-broker filenames.

**Adapters** → `assets/network-data.js`. Append to `LK_ADAPTERS`; the counts, filters, category
dropdown and CSV export all derive from it. Flags: `i` inbound, `o` outbound, `h` HL7 v2,
`f` FHIR, `x` X12/EDI, `d` bulk & file, `a` real-time API, `k` streaming. The adapter total
appears as static copy on `index.html`, `pricing.html`, `network.html` and `contact.html` — update
those if the count changes.

**Product screenshots** → the dark Grid console panels are rendered in HTML/CSS
(`assets/gridui.css`), not images, so they stay sharp at any size and can animate. To swap in real
PNGs instead, replace the `<div class="gu">…</div>` block inside a `.frame` with
`<img src="assets/img/your-shot.png" alt="…">`.

---

## Analytics and Search Console

Open `src/build.js` and fill in the `ANALYTICS` block at the top, then rebuild. Every page picks it
up; leave a value blank and nothing is emitted for it, so there are no stray requests.

```js
const ANALYTICS = {
  ga4:        '',   // 'G-XXXXXXXXXX'  Google Analytics 4 measurement ID
  gtm:        '',   // 'GTM-XXXXXXX'   Google Tag Manager container ID
  siteVerify: ''    // Search Console meta token (the content="..." value)
};
```

Set `ga4` **or** `gtm`, not both. If GA4 is loaded through Tag Manager, set `gtm` only, otherwise
every page view is counted twice. The GTM `<noscript>` iframe is added straight after `<body>`
automatically when `gtm` is set.

`SITE_URL` just below it drives `<link rel="canonical">` and `og:url` on every page. Change it if
the site is served from anywhere other than `https://linkiir.com`.

**For being found**, the tag is not the part that matters. Already in place: a unique `<title>` and
meta description per page, Open Graph and Twitter card tags, canonical URLs, `robots.txt` and
`sitemap.xml` (which excludes the unlisted `/latest`). After launch, submit the sitemap in Search
Console: `https://linkiir.com/sitemap.xml`.

## Forms

Both forms on the site post to **Web3Forms**, into the inbox behind access key
`77637dea-cc8e-4bb4-a7b2-0ccde576c40f`:

- **`/contact`** — the enquiry form. It carries a real
  `action="https://api.web3forms.com/submit"`, so it works with JavaScript disabled; with JS,
  `assets/forms.js` submits it over fetch and shows the result inline instead of navigating away.
- **`/downloads`** — the gate. It posts the same details as a JSON payload so you know who took a
  build. A failed post never blocks the download.

To change the destination inbox, replace the access key in **two** places: the hidden input in
`src/pages/contact.html`, and `accessKey` in `assets/downloads-data.js`. The key is public by
design; it identifies the inbox and cannot be used to read anything. Set `gateEndpoint` to `null`
in `downloads-data.js` if you would rather not record download leads at all.

## The download gate and the unlisted page

`downloads.html` is gated: name, work email, organisation and intended use, then the package
matrix is revealed and the choice is kept in `sessionStorage` for the rest of the session.

**This gate is not a security control.** A static site cannot enforce one. It records intent and
adds friction. To make it real:

1. Set `gateEndpoint` in `assets/downloads-data.js` to a URL that accepts a JSON POST (Formspree,
   HubSpot, a Lambda, your CRM). The form posts there and never blocks the download if it fails.
2. Put the artifacts themselves behind signed URLs or an authenticated origin. Until you do, the
   file URLs are guessable from the pattern.

`latest.html` is the **unlisted** page. It is not in the navigation, the footer or `sitemap.xml`,
and it carries `<meta name="robots" content="noindex, nofollow">`. It renders the same package
matrix with no gate, plus the rolling-upgrade procedure — share the URL directly with existing
customers. It is unlisted, not private: anyone with the link can use it. Note that adding it to
`robots.txt` would publish the URL, which is why it is not there.

## Notes on content

- The logo is the existing Linkiir mark — two overlapping rings — as inline SVG plus the
  `linkiir` wordmark. Replace `assets/logo.svg` and the inline `<svg>` in the nav/footer if you
  have the original vector file.
- **No em dashes.** The whole site was rewritten to avoid them. If you add copy, use commas,
  colons or full stops instead.
- **SOC 2 appears on `/platform-security` only** — described as *in progress* (observation
  window). It is deliberately absent from the homepage, the footer and every other page. HITRUST
  and ISO 27001 are not mentioned anywhere, since neither is held or in assessment.
- **"We never see PHI" is a positioning commitment, not just a control.** Support is described as
  diagnosing from structure, metadata and error codes, and the site actively tells customers not to
  send patient data even when they offer to. Keep that consistent in any new copy.
- **Engineers are included in the product**, not sold separately, and there are no support tiers
  anywhere on the site. The phrasing throughout is "you get the product and access to real
  engineers". There are deliberately no uptime guarantees, no service credits and no prominent
  response-time promises.
- **Adapters:** about 95% of the catalogue is marked Beta. Ten are "Available today" (Epic, Oracle
  Health, MEDITECH, athenahealth, eClinicalWorks, MLLP, SFTP, file watcher, Kafka, Rhapsody). The
  split is set by the `GA` list logic in `assets/network-data.js`; edit a row's `s:` value to move
  it.
- **Schema Builder** is the product name used in marketing copy. The console recreations still read
  "Schema Editor" because that is what the shipped UI says. Worth aligning one way or the other.
- **Linkiir Cloud** is marked *coming soon, within 3 months*; **Linkiir Agent** is marked *launching
  March 2027*. Both appear on the homepage, `platform-overview.html` and `company.html`. Search for
  those strings when the dates move.
- Support is delivered through **Jira Service Management** — there are no Slack or Teams references.
- The Company page describes three founders (CEO/CTO, Advisor, CFO), that Linkiir is funded, and a
  board of directors seated by January 2027. **Names, photographs and biographies are intentionally
  left out** rather than invented — drop them into the three cards in `src/pages/company.html`.
- **Events:** HIMSS27 dates and venue (6–8 April 2027, McCormick Place, Chicago; preconference
  5 April) are taken from the official HIMSS site and are real. The booth number, and every detail
  of Linkiir Connect beyond "October 2027, Toronto", are placeholders.
- There are no prices on the site. `/pricing` lists what's included and routes to contact.
- Release version, sizes and release notes in `assets/downloads-data.js` are placeholders.
- `contact.html` uses a `mailto:` form because a static host cannot accept a POST. Wire it to
  Formspree, Netlify Forms, HubSpot or your own endpoint by changing the `<form action>`.

## Browser support

Evergreen Chrome, Edge, Firefox and Safari. Degrades cleanly: `prefers-reduced-motion` disables
every animation, CSS container queries and `color-mix()` have fallbacks, and the whole site is
readable with JavaScript disabled (filters, the pricing calculator and the CSV export are the only
JS-dependent features).
