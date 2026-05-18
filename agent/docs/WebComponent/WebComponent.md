# WebComponent — quick reference for agents

Source: `viat/centralSite/client/components/core/base.js`
Public surface: `viat/centralSite/client/components/core/index.js` (re-exports the curated API)
Canonical docs: `docs/library/WebComponent/README.md` + `docs/library/WebComponent/lifecycle.md`
Auto-generated class index: `agent/docs/classes/core/WebComponent.json` (regenerate with `node ./agent/indexCodebase.js --class WebComponent`)

## What it is
The base class every UWC custom element extends. Reactive state, declarative templates, lifecycle, automatic cleanup, AXON agent surface. No build step, no virtual DOM, no compiler.

## Import path
The app's importmap aliases `webcomponent` → `components/core/index.js`. Prefer the bare specifier over relative paths:
```js
import { WebComponent, classList, each, list } from 'webcomponent';
```

## Skeleton
```js
import { WebComponent } from 'webcomponent';

class MyThing extends WebComponent {
  static url = import.meta.url;
  static styles = { mything: './mything.css' };
  static state = { count: 0 };           // reactive class-level defaults
  static attrs = {};                     // optional, typed attribute proxy
  static config = {};                    // optional, non-reactive ctor params
  // Optional framework flags (defaults shown):
  // static mergeState = true;        // chain-merge static state through inheritance
  // static mergeObjects = false;     // deep-merge containers when merging
  // static skipStaticState = false;  // bypass static state pipeline entirely

  onConnect() {}           // setup before first render
  beforeRender() {}        // sync/async prep; can return false to skip render
  render() {
    return this.html`
      <button @click=${this.handleClick}>${this.state.count}</button>
    `;
  }
  onRendered() {}          // after this render + all child renders
  onMount() {}             // first render of this connect cycle done
  onLive() {}              // one rAF after mount
  onDisconnect() {}        // teardown (most things auto-clean)

  handleClick() { this.state.count++; }
}

customElements.define('my-thing', MyThing);
```

## Constructor signature
```js
new MyThing(state, config, flags)
//        ↑ per-instance state (Object.assign, no smartClone)
//               ↑ per-instance config override (plain assign)
//                       ↑ per-instance flag override (e.g. { skipStaticState: true })
```
`static state` is the class-level template — chain-merged across inheritance, smart-cloned per instance. Constructor-arg `state` is the absolute final word (overrides static).

## Custom Elements upgrade pattern (automatic)
The base constructor calls `upgradeShadowedProperties()` after `initState()`. It walks the instance's OWN keys, and if any of them shadow a prototype setter, it deletes the instance key and re-assigns through the setter. This rescues the "framework upgraded the element AFTER the parent did `el.state = {...}` / `el.foo = bar`" race — you do NOT need a manual upgrade dance in your subclasses. Just declare the setter; the framework forwards the pre-upgrade assignment correctly. `state` specifically is routed through `assignState` so it stays reactive.

## Template sigils
| Sigil | Use | Example |
|---|---|---|
| `${expr}` | text / element / list / function spot | `${() => this.state.count}` |
| `attr=${x}` | string attribute (quote interpolations) | `class="${cls}"` |
| `?attr=${x}` | boolean attribute | `?disabled=${state.busy}` |
| `.prop=${x}` | DOM property | `.value=${state.text}` |
| `@event=${fn}` | listener (engine binds `this`) | `@click=${this.handleClick}` |
| `@${fn}` | listener with name deduced from `fn.name` | `@${this.dockSelect}` |
| `$attr="key"` | two-way binding shorthand (state key must equal attr name) | `$value=${state.value}` |
| `#name` | per-component element ref → `this.refs.name` | `<input #email>` |

**Pass bare method refs** (`@click=${this.handleClick}`), not arrow wrappers. The framework calls handlers via `.call(this, …)`. Use arrows only when you need a closure (args, getters, inline expressions).

**Ref names must match `/^[a-z_][a-z0-9_]*$/`** — all-lowercase, may use underscores. The framework lowercases attribute names during HTML parsing, so `#createWalletSave` silently becomes `createwalletsave` and `this.refs.createWalletSave` is `undefined`. Use `#create_wallet_save` and read `this.refs.create_wallet_save`.

## State
- `this.state.x = y` → tracked via Proxy → fine-grained spot updates or whole-component re-render (depending on whether the spot is a function or a bare read)
- `this.assignState({ a, b })` → batched multi-key write (proxy-bypassing, one notify per key); preferred over `Object.assign(this.state, …)`
- `this.STATE` → raw object (writes do not notify — avoid in user code)
- `Set` and `Map` values inside state are wrapped in a reactive `CollectionProxyHandler`. Calling `add` / `delete` / `clear` on `state.classes` (Set) triggers updates the same way property writes do. Idiomatic pattern for reactive class lists:
  ```js
  static state = { classes: new Set(['panel']) };
  // ...
  this.state.classes.add('is-open');  // reactive, no re-render needed for class-list spots
  ```

## Template helpers
| Helper | Purpose |
|---|---|
| `classList('foo', () => active && 'is-on')` | Reactive class-list spot. Strings + bool-returning fns + `Set` values all collapse into a deduped class string with per-token diffing. Pair with `class=${classList(...)}`. |
| `list(stateKey, ChildClass, keyFn?)` | Keyed list bound to `this.state[stateKey]`. Mounts/destroys instances of `ChildClass` per item; reorders by `keyFn`. |
| `each(items, ChildClass, keyFn?)` | Same machinery as `list` but works on an arbitrary array reference instead of a state key — useful inside derived getters. |
| `liveList(items, target, keyFn?)` | Imperative variant for rendering keyed lists outside templates. |
| `comp(value)` | Wraps a value as a `ComponentBinding` for advanced template spots. |

## Events across components
- **Emit upward**: `this.emit('thing:happened', { id })` — bubbles, composed, reaches document
- **Listen in a template**: `<child @thing:happened=${this.handleThing}>`
- **Listen anywhere in the tree**: `this.delegate('thing:happened', this.handleThing)` in `onConnect` — one shared document listener per channel, auto-cleaned on disconnect
- **Don't** use `document.addEventListener` / `window.addEventListener` for cross-component events. Use `delegate`.

## DOM access — never query
- **Never** call `this.shadowRoot.querySelector(...)`. Use `#name` in the template and `this.refs.name`.
- `this.refs` is a Proxy over `Map<refName, WeakRef<Element>>` with `FinalizationRegistry` cleanup.
- For repeated hot reads, cache `const el = this.refs.foo` once in `onLive` and use the bare element.

## Component lookup (`getComponent` / `getComponents` / `findComponent`)
All three operate on the host's OWN shadow registry — **direct shadow children only, not recursive**. To find a component nested inside another shadow root, walk through each parent:

```js
const dashboard = this.getComponent('app-dashboard');
const transmits = dashboard?.getComponents('transmit-panel') || [];
```

Or if you need every instance of a tag across multiple known parents, iterate them yourself:
```js
const roots = [this.getComponent('app-dashboard'), this.getComponent('mobile-dashboard')];
for (let r = 0; r < roots.length; r += 1) {
  const list = roots[r]?.getComponents('transmit-panel') || [];
  // ...
}
```

`findComponent(tag, predicate)` returns the first match where `predicate(component)` is truthy (again, direct children only).

## Lifecycle promises (`this.lifecycle.*`)
`this.lifecycle.whenConnected`, `whenRendered`, `whenMounted`, `whenLive`, `whenVisible`, `whenDisconnected`, `whenDestroyed`. Plus the top-level prototype getter `this.whenTreeVisible` and the phase helper `this.atPhase('mounted')`.

Parent phases await children's same phase first (bottom-up). So `await this.lifecycle.whenMounted` is "self + all descendants mounted" already — no `whenTreeMounted` alias needed.

```js
await this.lifecycle.whenConnected;
await child.lifecycle.whenRendered;
```

## Refs are per-instance
Each component has its own `refsMap` (lazy-init `Map`) and refs Proxy. Two `<my-thing>` instances don't share refs. `#btn` in component A and `#btn` in component B are isolated.

## Anti-patterns
| Don't | Do |
|---|---|
| `class X extends WebComponent { state = {…}; }` (subclass class-field state) | `static state = {…}` — class field shadows the prototype accessor and silently breaks reactivity |
| `handleX = () => {}` arrow class field | `handleX() {}` regular method |
| `this.shadowRoot.querySelector('.foo')` | `<div #foo>` + `this.refs.foo` |
| `Object.assign(this.state, partial)` | `this.assignState(partial)` |
| `window.X` | `globalThis.X` |
| `document.addEventListener('app:thing', …)` | `this.delegate('app:thing', this.handleThing)` |
| `delete this.x` | `this.x = null` (or `.delete()` for Map/Set) |
| `onUnmount` (does not exist) | `onDisconnect` |
| `this.getComponent('deeply-nested-thing')` | walk through each shadow parent — `getComponents` is non-recursive |
| `findComponent('sibling')?.method()` | emit event; sibling listens |
| `await this.whenConnected` | `await this.lifecycle.whenConnected` |
| `#camelCaseRef` | `#snake_case_ref` (ref names lowercase per `/^[a-z_][a-z0-9_]*$/`) |
| `for (const x of arr)` for hot loops | indexed `for (let i = 0; i < arr.length; i += 1)` |
| `name`, `event`, `confirm`, `type`, `alert`, `fetch`, `parent` as bindings | rename — these shadow globals (project lint rule) |

## Reading further
- **Full conceptual docs**: `docs/library/WebComponent/README.md`
- **Lifecycle deep dive**: `docs/library/WebComponent/lifecycle.md`
- **Class shape (auto-generated)**: `agent/docs/classes/core/WebComponent.json`
