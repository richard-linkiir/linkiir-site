#!/usr/bin/env python3
"""One-off: replace every em dash in the source pages with correct punctuation."""
import pathlib, re, sys

SRC = pathlib.Path(__file__).parent

# ---- exact, case-by-case replacements -------------------------------------
PAIRS = [
 # page titles / meta
 ('"title":"Not found — Linkiir"', '"title":"Not found | Linkiir"'),
 ('"title":"Company — Linkiir"', '"title":"Company | Linkiir"'),
 ('"title":"Talk to us — Linkiir"', '"title":"Talk to us | Linkiir"'),
 ('"title":"Developers — get started, docs and API reference | Linkiir"', '"title":"Developers, get started | Linkiir"'),
 ('"title":"Downloads — Linkiir Grid"', '"title":"Downloads | Linkiir Grid"'),
 ('"title":"Events — Linkiir"', '"title":"Events | Linkiir"'),
 ('"title": "linkiir — the integration engine you want today"', '"title": "linkiir | the integration engine you want today"'),
 ('"title":"Latest release — Linkiir Grid"', '"title":"Latest release | Linkiir Grid"'),
 ('"title":"Integration Network — 197 adapters | Linkiir"', '"title":"Integration Network, 197 adapters | Linkiir"'),
 ('"title":"Platform overview — Linkiir Grid, the integration engine"', '"title":"Platform overview | Linkiir Grid, the integration engine"'),
 ('"title":"Platform security — Linkiir"', '"title":"Platform security | Linkiir"'),
 ('"title":"Platform services — access to real engineers | Linkiir"', '"title":"Platform services, access to real engineers | Linkiir"'),
 ('"title":"Pricing — Linkiir Grid"', '"title":"Pricing | Linkiir Grid"'),

 ('seen your exact problem before — no SDR round-trip, no discovery deck.',
  'seen your exact problem before. No SDR round-trip, no discovery deck.'),
 ('for macOS, Linux and Windows — Docker, native systemd or signed installer, with a bundled broker or pointed at your own Kafka.',
  'for macOS, Linux and Windows: Docker, native systemd or a signed installer, with a bundled broker or pointed at your own Kafka.'),
 ('and Linkiir Connect — our first user conference — in October 2027.',
  'and Linkiir Connect, our first user conference, in October 2027.'),

 # nav aria-label
 ('aria-label="linkiir — home"', 'aria-label="linkiir, home"'),

 # 404
 ("we can't replay it — but everything else is one click away.",
  "we can't replay it, but everything else is one click away."),

 # company
 ('a commercial integration engine used across acute care — first as an engineer, then running the group responsible for it.',
  'a commercial integration engine used across acute care, first as an engineer and then running the group responsible for it.'),
 ('Three decades in healthcare interoperability — vendor side and provider side.',
  'Three decades in healthcare interoperability, on the vendor side and the provider side.'),
 ("are ready to drop into these three cards — they're deliberately left out of this draft rather than invented.",
  "are ready to drop into these three cards. They're deliberately left out of this draft rather than invented."),
 ('<h4>Board of directors — seated by January 2027</h4>', '<h4>Board of directors, seated by January 2027</h4>'),
 ('<td class="small">Funded — details under NDA</td>', '<td class="small">Funded, details under NDA</td>'),
 ('No open listings right now — write to <a href="mailto:sales@linkiir.com">sales@linkiir.com</a> and it will reach a founder.',
  'No open listings right now. Write to <a href="mailto:sales@linkiir.com">sales@linkiir.com</a> and it will reach a founder.'),

 # contact
 ("Raise it in Jira Service Management — it's faster than anything on this page, and P1s page the on-shift engineer immediately.",
  "Raise it in Jira Service Management. It's faster than anything on this page, and urgent issues reach an engineer straight away."),
 ("Bring us your worst interface — the one with the 400-line script",
  "Bring us your worst interface: the one with the 400-line script"),
 ("opens your mail client with the details filled in — a static site can't post anywhere, and we'd rather be honest about that than pretend.",
  "opens your mail client with the details filled in, because a static site can't post anywhere and we'd rather say so than pretend."),

 # developers
 ('# 1 — unpack the release', '# 1. unpack the release'),
 ('# 2 — bring up the runtime, broker and console', '# 2. bring up the runtime, broker and console'),
 ('# 3 — create the demo project', '# 3. create the demo project'),
 ('# 4 — call it', '# 4. call it'),
 ('Tabs advance on their own — click to take over.', 'Tabs advance on their own. Click to take over.'),
 ('Every endpoint on the Grid control plane — projects, workflows, nodes, schemas, messages, replay, users and audit — with request and response examples.',
  'Every endpoint on the Grid control plane: projects, workflows, nodes, schemas, messages, replay, users and audit, each with request and response examples.'),
 ('Source, Transform and Destination nodes — every configuration option, the Lua scripting API, shared libraries, and worked samples per message type.',
  'Source, Transform and Destination nodes: every configuration option, the Lua scripting API, shared libraries, and worked samples per message type.'),
 ('Database choices, licensing limits, operating practices — and the questions people actually email us at 11&nbsp;p.m.',
  'Database choices, licensing limits, operating practices, and the questions people actually email us at 11&nbsp;p.m.'),
 ('Transforms run sandboxed Lua 5.4 — no host filesystem, no shell.',
  'Transforms run sandboxed Lua 5.4: no host filesystem, no shell.'),
 ('plus a licence file. Works offline — nothing calls home.',
  'plus a licence file. Works offline, with nothing calling home.'),
 ("Yes — <code>MsgOut:mapTree(MsgIn, {skip={'ZPD'}})</code>.",
  "Yes. <code>MsgOut:mapTree(MsgIn, {skip={'ZPD'}})</code>."),
 ('it reaches the people who build Grid — not a bot, not a triage script, not a case number that sits until someone reassigns it.',
  'it reaches the people who build Grid, not a bot, not a triage script, and not a case number that sits until someone reassigns it.'),

 # downloads
 ('<h1>Grid <span class="hl" data-version>1.0.0</span> — every package.</h1>',
  '<h1>Grid <span class="hl" data-version>1.0.0</span>, every package.</h1>'),
 ("so we know who's running Grid — which is how you get told about a security release instead of finding out from a blog.",
  "so we know who's running Grid, which is how you get told about a security release instead of finding out from a blog."),
 ('<option>Existing customer — new deployment</option>', '<option>Existing customer: new deployment</option>'),
 ('<option>Existing customer — upgrade</option>', '<option>Existing customer: upgrade</option>'),
 ('Fastest way to a running system — start here for evaluations and single-node deployments.',
  'Fastest way to a running system. Start here for evaluations and single-node deployments.'),
 ("and you can switch later without reinstalling — it's a configuration change, not a different product.",
  'and you can switch later without reinstalling, because it is a configuration change rather than a different product.'),
 ('<td class="small">Offline file — nothing calls home</td>', '<td class="small">Offline file, nothing calls home</td>'),

 # events
 ('watch what Grid does with it — which is a better use of twenty minutes than any slide we could show you.',
  'watch what Grid does with it, which is a better use of twenty minutes than any slide we could show you.'),
 ("with Grid running live — not a looping video, an actual engine you can throw a message at.",
  "with Grid running live. Not a looping video, an actual engine you can throw a message at."),
 ("Booth number confirmed closer to the date — <a href=\"contact.html\">ask us</a> and we'll send it along with a calendar link.",
  "Booth number confirmed closer to the date. <a href=\"contact.html\">Ask us</a> and we'll send it along with a calendar link."),
 ('Linkiir Connect 2027 — our first user conference</h2>', 'Linkiir Connect 2027, our first user conference</h2>'),
 ('HA topology and replay drills — on your own laptop, not a slide.',
  'HA topology and replay drills, on your own laptop rather than a slide.'),
 ("What we're building next and why — including the things we've decided not to build.",
  "What we're building next and why, including the things we've decided not to build."),
 ('an integration engineer in the room — ask.', 'an integration engineer in the room, ask.'),

 # index
 ('<h3 class="mt-2">The control surface <span class="dim" style="font-weight:600">— coming soon</span></h3>',
  '<h3 class="mt-2">The control surface <span class="dim" style="font-weight:600">(coming soon)</span></h3>'),
 ('rejection clusters and quiet endpoints — detected, explained, and fixed through Grid or your existing engine.',
  'rejection clusters and quiet endpoints, detected, explained and fixed through Grid or your existing engine.'),
 ('PHI-grade controls in the product, not in a roadmap deck — starting with the fact that we don\'t need to see your patient data to support you.',
  'PHI-grade controls in the product, not in a roadmap deck, starting with the fact that we don\'t need to see your patient data to support you.'),
 ('We diagnose from structure, metadata and error codes — never patient data.',
  'We diagnose from structure, metadata and error codes, never patient data.'),
 ('Live message log — every hop, every ack', 'Live message log: every hop, every ack'),
 ("No SDR round-trip, no discovery deck — we'll open the message and look at it with you.",
  "No SDR round-trip, no discovery deck. We'll open the message and look at it with you."),

 # latest
 ('UNLISTED PAGE — /latest.html', 'UNLISTED PAGE: /latest.html'),
 ("No gate on this page — it's for customers already running Grid who just need the build.",
  "No gate on this page. It's for customers already running Grid who just need the build."),
 ('Switching between them is a configuration change, not a reinstall — but do it as a separate step, not during an upgrade.',
  'Switching between them is a configuration change rather than a reinstall, but do it as a separate step, not during an upgrade.'),
 ('expect a short window while the runtime restarts — queued messages are not lost.',
  'expect a short window while the runtime restarts. Queued messages are not lost.'),
 ('Raise a P1 in Jira Service Management — 15-minute response, any hour. Rolling back is',
  'Raise it in Jira Service Management and an engineer will pick it up. Rolling back is'),
 ("This page is unlisted — it isn't in the navigation, the sitemap or search results.",
  "This page is unlisted. It isn't in the navigation, the sitemap or search results."),

 # network
 ("The catalogue is what we've already tested and templated — not the boundary of what Grid can talk to.",
  "The catalogue is what we've already tested and templated, not the boundary of what Grid can talk to."),
 ("When we build one, every customer gets it — we don't charge the person who asked first.",
  "When we build one, every customer gets it. We don't charge the person who asked first."),
 ('while we prove parity on live traffic — so cutover is a routing change, not a weekend.',
  'while we prove parity on live traffic, so cutover is a routing change rather than a weekend.'),
 ("has almost certainly integrated it before — and will tell you honestly if they haven't.",
  "has almost certainly integrated it before, and will tell you honestly if they haven't."),

 # platform-overview
 ('encryption in transit and at rest, BAA-ready — and a support model that never requires us to see patient data.',
  'encryption in transit and at rest, BAA-ready, and a support model that never requires us to see patient data.'),
 ('collaborators for one integration programme — a hospital, a customer, a migration.',
  'collaborators for one integration programme: a hospital, a customer, a migration.'),
 ("hunt through a config file for is on the panel — with the documentation next to it, not in a PDF from 2014.",
  "hunt through a config file for is on the panel, with the documentation next to it rather than in a PDF from 2014."),
 ('get a first-pass transform in readable Lua — one you can review, correct and own.',
  'get a first-pass transform in readable Lua, one you can review, correct and own.'),
 ('and execute through Grid — or through the engine you already have.',
  'and execute through Grid, or through the engine you already have.'),
 ('what it saw and what it wants to do — merge, resubmit, re-route, hold.',
  'what it saw and what it wants to do: merge, resubmit, re-route, hold.'),
 ('X12 5010 full set — 837P/I/D,', 'X12 5010 full set: 837P/I/D,'),

 # platform-security
 ('So Grid is built so that <strong>we never see it</strong> — our engineers diagnose from structure, metadata and error codes.',
  'So Grid is built so that <strong>we never see it</strong>. Our engineers diagnose from structure, metadata and error codes.'),
 ("We don't ask for patient data, and we advise you not to send it — to us or to anyone.",
  "We don't ask for patient data, and we advise you not to send it, to us or to anyone."),
 ('MLLP over TLS for legacy HL7 links that will accept it — and honest advice when they won\'t',
  'MLLP over TLS for legacy HL7 links that will accept it, and honest advice when they won\'t'),
 ('Export to your SIEM — Splunk, Sentinel, Elastic, S3', 'Export to your SIEM: Splunk, Sentinel, Elastic, S3'),
 ('PHI masking in logs on by default — our engineers work from structure, never patient data',
  'PHI masking in logs on by default, so our engineers work from structure rather than patient data'),
 ('work from message structure, metadata, headers and error codes — never patient data — and the support model is designed',
  'work from message structure, metadata, headers and error codes, never patient data, and the support model is designed'),
 ('You get a full export — workflows, transforms, schemas, variables and message archive — in open formats, plus 30 days to verify it.',
  'You get a full export of workflows, transforms, schemas, variables and the message archive, in open formats, plus 30 days to verify it.'),
 ('nothing from your traffic is retained for model training — by us or by a subprocessor.',
  'nothing from your traffic is retained for model training, by us or by a subprocessor.'),
 ('CAIQ, HECVAT, your own 300-row spreadsheet — an engineer fills it in, not a marketing team.',
  'CAIQ, HECVAT, your own 300-row spreadsheet. An engineer fills it in, not a marketing team.'),
]

# ---- pattern rules --------------------------------------------------------
def strong_rule(s):
    """<strong>Label</strong> — Rest  ->  <strong>Label.</strong> Rest"""
    def rep(m):
        rest = m.group(2)
        # capitalise the first plain letter if the fragment starts with prose
        mm = re.match(r'([a-z])', rest)
        if mm:
            rest = rest[0].upper() + rest[1:]
        return '.</strong> ' + rest
    return re.sub(r'</strong> — (.{0,4}?)(?=\S)' , lambda m: '.</strong> ', s) if False else \
           re.sub(r'</strong> — (\S)', lambda m: '.</strong> ' + (m.group(1).upper() if m.group(1).islower() else m.group(1)), s)

def frame_caption(s):
    return s.replace('Linkiir Grid — ', 'Linkiir Grid: ')

def table_dash(s):
    # "no value" markers inside the product-console tables
    return s.replace('<td>—</td>', '<td>–</td>')

def placeholder(s):
    return s.replace('<span data-released>—</span>', '<span data-released>…</span>')

RULES = [strong_rule, frame_caption, table_dash, placeholder]

changed = 0
for f in sorted(SRC.glob('pages/*.html')) + [SRC / 'partials-nav.html', SRC / 'partials-footer.html']:
    s = orig = f.read_text(encoding='utf-8')
    for old, new in PAIRS:
        s = s.replace(old, new)
    for rule in RULES:
        s = rule(s)
    if s != orig:
        f.write_text(s, encoding='utf-8')
        changed += 1

# report anything left
left = 0
for f in sorted(SRC.glob('pages/*.html')) + [SRC / 'partials-nav.html', SRC / 'partials-footer.html']:
    s = f.read_text(encoding='utf-8')
    for m in re.finditer('—', s):
        left += 1
        frag = re.sub(r'\s+', ' ', s[max(0, m.start()-70):m.end()+70])
        print(f'LEFT [{f.name}] …{frag}…')
print(f'\nfiles changed: {changed}   em dashes remaining: {left}')
