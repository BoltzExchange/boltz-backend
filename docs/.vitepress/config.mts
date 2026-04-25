import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

const docsRoot = 'https://docs.boltz.exchange';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Boltz API',
  description: 'Boltz API Docs',
  head: [['link', { rel: 'icon', href: '/assets/logo.svg' }]],
  themeConfig: {
    logo: '/assets/logo.svg',
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
    nav: [{ text: '🏠 Docs Home', link: docsRoot, target: '_self' }],
    sidebar: [
      {
        items: [
          { text: '👋 Introduction', link: '/index' },
          { text: '📙 Clients, SDKs & Libraries', link: '/libraries' },
          { text: '🤖 REST API v2', link: '/api-v2' },
          { text: '🔁 Swap Types & States', link: '/lifecycle' },
          { text: '💰 Swap Limits & Fees', link: '/swap-limits-and-fees' },
          { text: '♻️ Renegotiating Swaps', link: '/renegotiating' },
          { text: '🙋‍♂️ Claims & Refunds', link: '/claiming-swaps' },
          { text: '🔐 Commitment Swaps', link: '/commitment-swaps' },
          { text: '🛟 Swap Restore', link: '/swap-restore' },
          { text: '⛑️ Asset Rescue', link: '/asset-rescue' },
          { text: '⚠️ Common Mistakes', link: '/common-mistakes' },
          { text: "🚫 Don't trust. Verify!", link: '/dont-trust-verify' },
          { text: '🪄 Magic Routing Hints', link: '/magic-routing-hints' },
          { text: '⏩ 0-conf', link: '/0-conf' },
          { text: '🪝 Webhooks', link: '/webhooks' },
          { text: '✨ BOLT12', link: '/bolt12' },
          { text: '🏅 Pro', link: '/pro' },
          { text: '📜 Claim Covenants', link: '/claim-covenants' },
          { text: '🤝 Partner Program', link: '/partner-program' },
          { text: '🐳 Backend Development', link: '/backend-development' },
          { text: '🤖 REST API v1 (deprecated)', link: '/api-v1' },
          { text: '🏠 Docs Home', link: docsRoot, target: '_self' },
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
  vite: {
    // Note: `vitepress preview` serves llms.txt / llms-full.txt as
    // `text/plain` without a charset, so browsers fall back to Windows-1252
    // and mojibake the UTF-8 emoji/dash bytes. The files on disk are valid
    // UTF-8 and production (GitHub Pages) sets `charset=utf-8` correctly.
    plugins: [llmstxt()],
  },
});
