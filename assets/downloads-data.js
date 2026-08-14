/* =========================================================================
   linkiir.com — release manifest
   Single source of truth for the Downloads page and the unlisted
   /latest.html upgrade page. Edit this file when you cut a release.
   ========================================================================= */

window.LK_RELEASE = {
  version:   '1.0.0',
  released:  '2026-08-05',
  channel:   'stable',

  // Where the artifacts actually live (GitHub Releases).
  baseUrl:   'https://github.com/Linkiir/linkiir-releases/releases/download/v1.0.0/',

  // Checksums file published alongside every release.
  checksums: 'https://github.com/Linkiir/linkiir-releases/releases/download/v1.0.0/SHA256SUMS',

  // Where download-gate submissions are sent. Same Web3Forms inbox as the
  // contact form. Set gateEndpoint to null to stop recording them; the gate
  // still unlocks either way, and a failed post never blocks a download.
  gateEndpoint: 'https://api.web3forms.com/submit',
  accessKey:    '77637dea-cc8e-4bb4-a7b2-0ccde576c40f',

  notes: [
    'Schema Editor: matching rules on message definitions, and Raw JSON round-tripping.',
    'Workflow Builder: resend-on-ack-timeout and configurable LLP delimiters on Destination nodes.',
    'Runtime: ~18% faster HL7 v2 parse on large ORU batches; archiver memory ceiling honoured under backlog.',
    'Scripting: mapTree() now accepts a skip list or predicate.',
    'Adapters: 11 added, including Palantir Foundry, Microsoft Fabric and TEFCA QHIN gateway (beta).'
  ]
};

/* Kafka packaging choice.
   Every package except the Windows installer ships in two flavours:
   one with the broker bundled, one that points at a broker you already run. */
window.LK_KAFKA = {
  bundled:  {
    label: 'Bundled Kafka',
    slug:  'kafka',
    desc:  'Ships with a preconfigured broker. Fastest way to a running system — start here for evaluations and single-node deployments.'
  },
  external: {
    label: 'Bring your own broker',
    slug:  'external',
    desc:  'No broker included. Point Grid at your existing Kafka or Redpanda cluster. Use this for production and anything HA.'
  }
};

/* dir  — release subdirectory
   file — filename template; {v} = version, {k} = kafka slug
   kafka — 'both' or 'bundled' (Windows bundles the broker in the installer) */
window.LK_PACKAGES = [
  {
    os: 'Linux server', variant: 'Docker, Intel/AMD', arch: 'amd64', form: 'Docker',
    dir: '', file: 'linkiir-{v}-linux-docker-{k}-amd64.tar.gz',
    kafka: 'both', size: '396 MB', recommended: true,
    note: 'Docker Engine 24+ or Podman 5+. The usual production choice.'
  },
  {
    os: 'Linux server', variant: 'Docker, Graviton/arm64', arch: 'arm64', form: 'Docker',
    dir: '', file: 'linkiir-{v}-linux-docker-{k}-arm64.tar.gz',
    kafka: 'both', size: '389 MB',
    note: 'AWS Graviton, Ampere and other arm64 hosts.'
  },
  {
    os: 'Linux server', variant: 'native systemd, Intel/AMD', arch: 'x64', form: 'Native',
    dir: '', file: 'linkiir-{v}-linux-x64-{k}.tar.gz',
    kafka: 'both', size: '244 MB',
    note: 'RHEL 8+, Rocky, Ubuntu 22.04+, SLES 15+. For estates where containers are not permitted.'
  },
  {
    os: 'Windows', variant: 'Intel/AMD', arch: 'x64', form: 'Installer',
    dir: '', file: 'LinkiirSetup-{v}-x64.exe',
    kafka: 'bundled', size: '286 MB',
    note: 'Windows Server 2019+. Signed installer; the broker is bundled.'
  }
];
