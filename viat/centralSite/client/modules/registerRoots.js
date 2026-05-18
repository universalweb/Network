import { registerRoot } from 'webcomponent';
// Resolution roots for the component resolver — a `<root>-<rest>` tag
// auto-imports from here on first render. `ui-*` atoms live under
// components/global, app components under components/user. Manually-imported
// tags are skipped (already defined).
registerRoot('ui', new URL('../components/global/', import.meta.url).href);
registerRoot('user', new URL('../components/user/', import.meta.url).href);
