import { defineConfig } from 'vitepress';

const docsRoot = 'https://docs.boltz.exchange';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Boltz API',
  description: 'Boltz API Docs',
  head: [['link', { rel: 'icon', href: '/assets/logo.svg' }]],
  themeConfig: {
    logo: '/assets/logo.svg',
    logoLink: { link: docsRoot, target: '_self', rel: '' },
    siteTitle: 'Boltz API',
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
    nav: [{ text: 'Docs Home', link: docsRoot, target: '_self' }],
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: true,
        items: [
          { text: 'Introduction', link: '/index' },
          { text: 'Clients, SDKs & Libraries', link: '/libraries' },
        ],
      },
      {
        text: 'API Reference',
        collapsed: true,
        items: [
          { text: 'REST API v2', link: '/api-v2' },
          { text: 'REST API v1 (deprecated)', link: '/api-v1' },
        ],
      },
      {
        text: 'Swaps',
        collapsed: true,
        items: [
          { text: 'Swap Types & States', link: '/lifecycle' },
          { text: 'Swap Limits & Fees', link: '/swap-limits-and-fees' },
          { text: 'Renegotiating Swaps', link: '/renegotiating' },
          { text: 'Claims & Refunds', link: '/claiming-swaps' },
          { text: 'Commitment Swaps', link: '/commitment-swaps' },
        ],
      },
      {
        text: 'Advanced Features',
        collapsed: true,
        items: [
          { text: '0-conf', link: '/0-conf' },
          { text: 'Magic Routing Hints', link: '/magic-routing-hints' },
          { text: 'Webhooks', link: '/webhooks' },
          { text: 'BOLT12', link: '/bolt12' },
          { text: 'Pro', link: '/pro' },
          { text: 'Claim Covenants', link: '/claim-covenants' },
        ],
      },
      {
        text: 'Recovery & Safety',
        collapsed: true,
        items: [
          { text: 'Swap Restore', link: '/swap-restore' },
          { text: 'Asset Rescue', link: '/asset-rescue' },
          { text: 'Common Mistakes', link: '/common-mistakes' },
          { text: "Don't trust. Verify!", link: '/dont-trust-verify' },
        ],
      },
      {
        text: 'Development & Community',
        collapsed: true,
        items: [
          { text: 'Backend Development', link: '/backend-development' },
          { text: 'Partner Program', link: '/partner-program' },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/BoltzExchange/boltz-backend',
      },
    ],
  },
  // Ignore dead links to localhost
  ignoreDeadLinks: [/https?:\/\/localhost/],
});
