import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vitepress';

const docsRoot = 'https://docs.boltz.exchange';
const siteUrl = 'https://api.docs.boltz.exchange';

const sidebarItems: {
  text: string;
  link: string;
  target?: string;
}[] = [
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
];

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
    sidebar: [{ items: sidebarItems }],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/BoltzExchange/boltz-backend',
      },
    ],
  },
  // Ignore dead links to localhost
  ignoreDeadLinks: [/https?:\/\/localhost/],

  async buildEnd(siteConfig) {
    // Copy raw markdown sources into the build output so each page is also
    // reachable as `/<page>.md` next to `/<page>.html` (for LLM crawlers,
    // `curl`, etc.).
    await Promise.all(
      siteConfig.pages.map(async (page) => {
        const src = join(siteConfig.srcDir, page);
        const dest = join(siteConfig.outDir, page);
        await mkdir(dirname(dest), { recursive: true });
        await copyFile(src, dest);
      }),
    );

    // Emit an `llms.txt` index following https://llmstxt.org/ so LLM crawlers
    // can discover the markdown sources.
    const links = sidebarItems
      .filter((item) => item.link.startsWith('/'))
      .map((item) => `- [${item.text}](${siteUrl}${item.link}.md)`)
      .join('\n');
    const llmsTxt = `# ${siteConfig.site.title}\n\n> ${siteConfig.site.description}\n\n## Docs\n\n${links}\n`;
    await writeFile(join(siteConfig.outDir, 'llms.txt'), llmsTxt);
  },
});
