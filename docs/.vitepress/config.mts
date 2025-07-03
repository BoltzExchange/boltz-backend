import { defineConfig } from 'vitepress';

const docsRoot = 'https://docs.boltz.exchange';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Boltz API',
  description: 'Boltz API Docs',
  themeConfig: {
    logo: './assets/logo.svg',
    search: {
      provider: 'local',
    },
    nav: [{ text: 'Home', link: docsRoot }],
    sidebar: [
      {
        items: [
          { text: '👋 Introduction', link: '/index' },
          { text: '📙 Libraries', link: '/libraries' },
          { text: '🤖 REST API v2', link: '/api-v2' },
          { text: '🤖 REST API v1 (deprecated)', link: '/api-v1' },
          { text: '🔁 Swap Types & States', link: '/lifecycle' },
          { text: '🙋‍♂️ Claims & Refunds', link: '/claiming-swaps' },
          { text: '⚠️ Common Mistakes', link: '/common-mistakes' },
          { text: "🚫 Don't trust. Verify!", link: '/dont-trust-verify' },
          { text: '🪄 Magic Routing Hints', link: '/magic-routing-hints' },
          { text: '⏩ 0-conf', link: '/0-conf' },
          { text: '🪝 Webhooks', link: '/webhooks' },
          { text: '✨ BOLT12', link: '/bolt12' },
          { text: '🏅 Pro', link: '/pro' },
          { text: '📜 Claim Covenants', link: '/claim-covenants' },
          { text: '🤝 Referral Program', link: '/referral-program' },
          { text: '🐳 Backend Development', link: '/backend-development' },

          { text: '🔙 Home', link: docsRoot },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/BoltzExchange/boltz-web-app',
      },
    ],
  },
  // Ignore dead links to localhost
  ignoreDeadLinks: [/https?:\/\/localhost/],
});
