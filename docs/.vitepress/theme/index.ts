// https://vitepress.dev/guide/custom-theme
import { Icon as RawIcon, addCollection } from '@iconify/vue';
import tablerIcons from '@iconify-json/tabler/icons.json';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { defineComponent, h } from 'vue';
import './style.css';

addCollection(tablerIcons);

// SSR-safe wrapper: always pass `ssr: true` so icons render in the
// static HTML VitePress emits at build time.
const Icon = defineComponent({
  name: 'Icon',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h(RawIcon, { ...attrs, ssr: true });
  },
});

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app }) {
    app.component('Icon', Icon);
  },
} satisfies Theme;
