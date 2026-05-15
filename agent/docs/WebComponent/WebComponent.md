# WebComponent — quick reference for agents

Source: `viat/centralSite/client/new/components/core/base.js`
Canonical docs: `/docs/library/WebComponent/README.md` + `/docs/library/WebComponent/lifecycle.md`
Auto-generated class index: `agent/docs/classes/WebComponent/WebComponent.json (regenerate with `node ./agent/indexCodebase.js --class WebComponent`)`

## What it is
The base class every UWC custom element extends. Reactive state, declarative templates, lifecycle, automatic cleanup, AXON agent surface. No build step, no virtual DOM, no compiler.

## Skeleton
```js
import { WebComponent } from 'webcomponent';

class MyThing extends WebComponent {
  static url = import.meta.url;
  static styles = { mything: './mything.css' };
  static state = { count: 0 };
  static attrs = {};       // optional, typed attribute proxy
  static config = {};      // optional, frozen ctor-time config

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

## Template sigils
| Sigil | Use | Example |
|---|---|---|
| `${expr}` | text / element / list / function spot | `${() => this.state.count}` |
| `attr=${x}` | string attribute (quote interpolations) | `class="${cls}"` |
| `?attr=${x}` | boolean attribute | `?disabled=${state.busy}` |
| `.prop=${x}` | DOM property | `.value=${state.text}` |
| `@event=${fn}` | listener (engine binds `this`) | `@click=${this.handleClick}` |
| `@${fn}` | listener with name deduced from `fn.name` | `@${this.dockSelect}` |
| `$attr="key"` | two-way binding shorthand | `$value="inputValue"` |
| `#name` | per-component element ref → `this.refs.name` | `<input #email>` |

**Pass bare method refs** (`@click=${this.handleClick}`), not arrow wrappers. The framework calls handlers via `.call(this, …)`. Use arrows only when you need a closure (args, getters, inline expressions).

## State
- `this.state.x = y` → tracked via Proxy → fine-grained spot updates or whole-component re-render (depending on whether the spot is a function or a bare read)
- `this.assignState({ a, b })` → batched multi-key write (proxy-bypassing, one notify per key); preferred over `Object.assign(this.state, …)`
- `this.STATE` → raw object (writes do not notify — avoid in user code)

## Events across components
- **Emit upward**: `this.emit('thing:happened', { id })` — bubbles, composed, reaches document
- **Listen in a template**: `<child @thing:happened=${this.handleThing}>`
- **Listen anywhere in the tree**: `this.delegate('thing:happened', this.handleThing)` in `onConnect` — one shared document listener per channel, auto-cleaned on disconnect
- **Don't** use `document.addEventListener` / `window.addEventListener` for cross-component events. Use `delegate`.

## DOM access — never query
- **Never** call `this.shadowRoot.querySelector(...)`. Use `#name` in the template and `this.refs.name`.
- `this.refs` is a Proxy over `Map<refName, WeakRef<Element>>` with `FinalizationRegistry` cleanup.
- For repeated hot reads, cache `const el = this.refs.foo` once in `onLive` and use the bare element.

## Lifecycle promises
`whenConnected`, `whenRendered`, `whenMounted`, `whenLive`, `whenVisible`, `whenDisconnected`, `whenDestroyed`. Also `this.atPhase('mounted')`.

Parent phases await children's same phase first (bottom-up). So `await this.whenMounted` is "self + all descendants mounted" already — no `whenTreeMounted` alias needed.

## Refs are per-instance
Each component has its own `refsMap` (lazy-init `Map`) and refs Proxy. Two `<my-thing>` instances don't share refs. `#btn` in component A and `#btn` in component B are isolated.

## Anti-patterns
| Don't | Do |
|---|---|
| `handleX = () => {}` arrow class field | `handleX() {}` regular method |
| `this.shadowRoot.querySelector('.foo')` | `<div #foo>` + `this.refs.foo` |
| `Object.assign(this.state, partial)` | `this.assignState(partial)` |
| `window.X` | `globalThis.X` |
| `document.addEventListener('app:thing', …)` | `this.delegate('app:thing', this.handleThing)` |
| `delete this.x` | `this.x = null` (or `.delete()` for Map/Set) |
| `onUnmount` (does not exist) | `onDisconnect` |
| `findComponent('sibling')?.method()` | emit event; sibling listens |

## Reading further
- **Full conceptual docs**: `/docs/library/WebComponent/README.md`
- **Lifecycle deep dive**: `/docs/library/WebComponent/lifecycle.md`
- **Class shape (auto-generated)**: `agent/docs/classes/WebComponent/WebComponent.json (regenerate with `node ./agent/indexCodebase.js --class WebComponent`)`
