# WebComponent — reference for agents

- **Source**: `viat/centralSite/client/components/core/base.js`
- **Public surface**: `viat/centralSite/client/components/core/index.js` (curated re-exports)
- **Auto-generated class index**: `agent/docs/classes/WebComponent/WebComponent.json` — regenerate with `node ./agent/indexCodebase.js --class WebComponent`
- **Authoring skill**: `agent/docs/WebComponent/webcomponent-authoring.SKILL.md`
- **Method map**: `agent/docs/WebComponent/diagram.mmd`

## What it is

The base class every UWC (Universal Web Component) custom element extends. A hand-rolled, zero-dependency, compiler-free reactive layer over native Custom Elements + open Shadow DOM. Reactive state proxies, declarative tagged-template rendering, surgical DOM patching, ordered lifecycle, automatic cleanup, optional agent (AI) surface. No build step, no virtual DOM.

The class shell (`base.js`) holds only the constructor, fields, getters, and mixin assembly. Method bodies live in topic modules (`lifecycle/`, `render/`, `state/`, `events/`, `dom/`, `styles/`, `timers.js`) and are folded onto the prototype via `Object.assign`. 92 methods total: 13 declared on the class, 79 mixed in.

## Positioning — vs native Web Components

Native `HTMLElement` gives you `connectedCallback`, `attributeChangedCallback`, and a shadow root. Nothing else. WebComponent adds, with no build tooling:

- **Reactive state** — `state` Proxy; `Set`/`Map` values reactive too. Native: none.
- **Declarative templates** — tagged `this.html\`\`` with auto-tracked spots. Native: manual `innerHTML` / imperative DOM.
- **Surgical patching** — a state change patches only the affected DOM spots; no diff of a virtual tree, no full re-render. Native: you write every update by hand.
- **Ordered lifecycle** — `onConnect → beforeRender → render → onRender → onRendered → onMount → onLive`, parent phases gated on children. Native: one `connectedCallback`.
- **Automatic cleanup** — listeners, timers, delegates, subscriptions, render-dep links all torn down on disconnect. Native: you leak unless you track everything.
- **Per-instance refs** — `#name` in template → `this.refs.name` (WeakRef-backed). Native: `querySelector`.
- **Style chain** — `static styles` compiled once per class, shared via `adoptedStyleSheets`. Native: per-instance `<style>`.
- **Agent surface** — optional AI mixin makes a component discoverable and controllable by an agent without vision.

Result: native-standards semantics, framework ergonomics, zero dependencies.

## Agentic AI integration

Components are agent-addressable without model vision:

- `index.js` puts `WebComponent` on `globalThis` — any tool can reach the class and the registry.
- `registry` (exported) tracks live component instances; an agent can enumerate, locate, and inspect them by tag.
- The optional **AI mixin** (`ai/mixin.js`, applied to `WebComponent` in `index.js`) adds `aiLabel`, `aiRole`, and `aiDefineTool(...)` — a component declares concise, schema-typed tools an agent invokes directly.
- State is structured and reactive, so an agent reads/writes `component.state.*` and the UI follows. No DOM scraping.
- Convention: tools are **read-only by default**; mutating tools are gated by policy.

## Import

The app importmap aliases `webcomponent` → `/components/core/index.js`. Always prefer the bare specifier over relative paths:

```js
import { WebComponent, classList, each, list, comp, bind, CONTENT_KIND } from 'webcomponent';
```

`WebComponent` is also on `globalThis` once the package loads anywhere — `class X extends WebComponent` works without an import — but keep the explicit import for clarity.

## Skeleton

```js
import { WebComponent, classList } from 'webcomponent';

export class MyThing extends WebComponent {
  static url = import.meta.url;             // REQUIRED — anchors ./*.css and assets
  static styles = { mything: './mything.css' };
  static state = { count: 0, label: '' };  // reactive class-level defaults
  static attrs = {};                       // optional — HTML attribute ↔ state mirror
  static config = {};                      // optional — non-reactive ctor params
  static properties = {};                  // optional — per-path state schema (see below)

  onConnect() {}            // entered DOM — subscriptions, one-time prep
  beforeRender() {}         // sync/async prep; return false to skip this render
  render() {
    // eslint-disable-next-line no-unused-expressions
    this.html`
      <button @click=${this.handleClick}>${this.state.count}</button>
    `;
  }
  onRender() {}             // after render(), before children settle
  onRendered() {}           // after this render + all child renders
  onMount() {}              // first render of this connect cycle done (once)
  onLive() {}               // one animation frame after mount (once)
  onDisconnect() {}         // teardown — only for what the framework can't auto-clean

  handleClick() { this.state.count += 1; }
}
customElements.define('my-thing', MyThing);
```

`render()` calls `this.html\`\`` as a **statement** (not `return`). The `eslint-disable no-unused-expressions` line is the project idiom.

## Constructor

```js
new MyThing(state, config, flags)
```

- `state` — per-instance overrides. Plain `Object.assign` onto merged static state (caller-owned, no deep clone). With `mergeObjects` it deep-merges container values instead.
- `config` — per-instance non-reactive params; merged over `static config`.
- `flags` — per-instance framework-flag overrides, e.g. `{ skipStaticState: true }`.

`static state` is the class-level template: chain-merged across the inheritance line, cached on the class, then smart-cloned per instance so every component owns its own containers. Constructor-arg `state` is the final word.

### Custom Elements upgrade — automatic

The base constructor runs `upgradeShadowedProperties()` after `initState()`. If a parent assigned `el.state = {...}` (or any accessor-backed `.foo=`) **before** the element's class loaded, an own data property now shadows the prototype accessor. The framework deletes that shadow and re-assigns it through the proper setter (`state` routes via `assignState`, staying reactive). You never need a manual upgrade dance — just declare the setter.

## Static members

| Static            | Purpose                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `url`             | **Required.** `import.meta.url` — resolves `./x.css` + relative assets.                                                                 |
| `styles`          | `{ name: './file.css' }` — compiled once per class, adopted via `adoptedStyleSheets`. Every component also gets `core/styles/base.css`. |
| `state`           | Reactive default state. Chain-merged, smart-cloned per instance.                                                                        |
| `attrs`           | HTML attributes mirrored to/from state. Drives `observedAttributes`.                                                                    |
| `config`          | Non-reactive constructor parameters.                                                                                                    |
| `types`           | Per-path state schema — `{ 'a.b': { kind, react } }`. See below.                                                                        |
| `mergeState`      | `false` skips chain-merge of `static state`. Default `true`.                                                                            |
| `mergeObjects`    | `true` deep-merges container values across chain + ctor-arg state. Default `false`.                                                     |
| `skipStaticState` | `true` bypasses the static-state pipeline entirely. Default `false`.                                                                    |

Static helpers: `WebComponent.create(state, config)` (async), `getById`, `preRender`, `createBound`, `preload(Class)`, `ensureMergedState/Attrs/Config/Types`, `ensureTypeIndex`, `compileStyles`, `styleSheet`, `isWebComponent`.

## Lifecycle

Hooks (define only what you need):

| Hook | When | Use for |
|---|---|---|
| `onInit(state, config, flags)` | In constructor, before state proxy ready | Rare. Cheap field setup. |
| `onConnect()` | Element entered the DOM | Subscriptions (`delegate`, `on`), one-time prep. |
| `beforeRender()` | Before each `render()` | Prep that feeds render. Return `false` to skip the render. |
| `render()` | Builds the template | `this.html\`\`` only — no DOM mutation, no side effects. |
| `onRender()` | After `render()`, before children settle | Post-render work. **Skipped on patch passes.** |
| `onRendered()` | After this render + all children rendered | Cross-child measurement. **Skipped on patch passes.** |
| `onMount()` | First render done, children mounted | Measurement, focus, animation. Fires **once** per connect cycle. |
| `onLive()` | One animation frame after mount | Work needing settled layout. Fires **once**. |
| `onVisible()` / `onIntersect()` | IntersectionObserver fires | Lazy / viewport-gated work. |
| `onMove()` | Element relocated via `connectedMoveCallback` | Relocation handling. |
| `onDisconnect()` | Element left the DOM | Only what the framework can't auto-clean (rare). |
| `onDestroy()` | Permanent teardown | Final cleanup. |

**No `onUnmount`** — it does not exist. Phases progress: `created → connected → rendered → mounted → live`.

### Lifecycle promises — `this.lifecycle.*`

`whenConnected`, `whenRendered`, `whenMounted`, `whenLive`, `whenVisible`, `whenDestroyed`. Plus prototype getter `this.whenTreeVisible` and phase helper `this.atPhase('mounted')`.

**Primitive rule — terminal vs recurring.** A *terminal* one-shot moment (`destroy()`) gets a **promise** (`whenDestroyed`, armed once, fired once). *Forward-readiness* milestones (`whenConnected`…`whenVisible`) are promises re-armed per connect cycle and stranded-resolved so they never hang. A *recurring backward transition* (disconnect) gets a **hook + phase**, never a promise — so there is deliberately **no `whenDisconnected`** (a one-shot promise can't model a recurring event without a footgun-y re-arm, and nothing consumed it). Observe disconnect via `onDisconnect()`, `isDisconnected` / `phase === 'disconnected'`, or the native `disconnectedCallback`. The disconnect↔connect asymmetry is correct by design — do not "restore `whenDisconnected` for symmetry."

**`destroy()` and `whenDestroyed`.** `destroy()` is imperative **terminal** teardown — distinct from `remove()` (recoverable / reconnectable). It fires `onDestroy()`, sets `phase === 'destroyed'`, and resolves `whenDestroyed`. `whenDestroyed` resolves **only** through `destroy()`, never on a bare `remove()`/disconnect; it resolves with `undefined` and swaps to a shared resolved-promise singleton on fire (holding it never pins the component). Use `Promise.all(els.map(el => el.whenDestroyed))` to react after a batch is gone — but await **only** components you will deterministically `destroy()`, or the await stalls forever (and retains its continuation). This stall is a liveness property of awaiting any maybe-never event, identical for `onDestroy` — not a flaw of the promise.

Parent phases await children's same phase first (bottom-up), so `await this.lifecycle.whenMounted` already means "self + all descendants mounted" — no `whenTreeMounted` alias needed.

**Enter / leave animations.** Author-invoked prototype helpers — `await this.animateIn({ target?, className? })`, `await this.animateOut({ target?, className? })`, `await this.leave()`. They toggle a CSS class (default `is-entering` / `is-exiting`) on the target (default the host) and resolve when the animation/transition finishes via `Element.getAnimations()` — **hang-safe** (no animation → resolves immediately) for both `@keyframes` and `transition`s (finite only). `leave()` = `animateOut()` then `remove()`, the correct order for a visible exit (a detached node can't animate; `disconnectedCallback` fires post-removal). Zero cost unless called (never auto-invoked). Replaces the hand-rolled `exiting`-flag + `@animationend` + hardcoded-duration `setTimeout` idiom.

```js
await this.lifecycle.whenConnected;
await child.lifecycle.whenRendered;
```

Phase getters: `this.isRendered`, `this.isMounted`, `this.isLive`, `this.isDisconnected`, `this.isDestroyed`.

## The render model — patch pass vs structural render

This is the core of the engine. Understand it before writing templates.

Every `${...}` in a template becomes a **spot**. There are two update mechanisms:

1. **Bare read → renderDep.** A bare `${this.state.x}` registers `x` as a *renderDep*. When `x` changes, the engine runs a **patch pass**: it re-runs `render()` to recompute spot values, patches only the changed spots in the live DOM, re-subscribes renderDeps — and **skips the structural lifecycle** (`onRender`, `onRendered`, `onMount`, `onLive`, `awaitChildren`). Logged `[tag] patch pass (no re-render)`. Cheap.

2. **Computed spot → tracked expression.** A `${() => {...}}` arrow, or a function inside `classList()`, is a *computed spot*. It tracks its own dependencies and patches just itself when they change.

There is **no whole-component re-render** in normal operation. Both paths patch surgically. A structural re-render happens only on first render or an explicit `invalidateRender()`.

**Consequence for authoring:** write bare `${this.state.x}` for plain reactive reads — it is the standard and it is cheap. Use an arrow **only** when the value is genuinely computed (math, concatenation, conditional logic). Never arrow-wrap a plain state ref — that is the legacy anti-pattern.

```js
${this.state.label}                                        // ✅ bare read
${() => { return this.state.count * 2; }}                  // ✅ real computation
style=${() => { return `left:${this.state.x}px`; }}        // ✅ combines values
${() => { return this.state.label; }}                      // ❌ wrong — use bare
```

Arrow bodies must be block-bodied (`() => { return …; }`) per eslint.

## Templates — spots & sigils

| Form           | Use                                                                                                      | Example                        |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `${expr}`      | text / element / list / computed spot                                                                    | `${this.state.count}`          |
| `attr=${x}`    | attribute — **bare, unquoted**                                                                           | `class=${classList(...)}`      |
| `?attr=${x}`   | boolean attribute                                                                                        | `?disabled=${this.state.busy}` |
| `.prop=${x}`   | DOM property (not attribute)                                                                             | `.value=${this.state.text}`    |
| `@event=${fn}` | listener — engine binds `this`                                                                           | `@click=${this.handleClick}`   |
| `@${fn}`       | listener, event name deduced from `fn.name`                                                              | `@${this.dockSelect}`          |
| `$attr=${x}`   | two-way binding — `$value=${s.value}` ≡ `value=${s.value} @bind="value"`; state key must equal attr name | `$value=${this.state.value}`   |
| `#name`        | per-component element ref → `this.refs.name`                                                             | `<input #email_field>`         |

Do **not** wrap attribute interpolations in quotes — `class=${...}`, not `class="${...}"`. Pass bare method refs to `@event` (`@click=${this.handleClick}`); the engine calls handlers via `.call(component, domEvent, element)`.

**Ref names must match `/^[a-z_][a-z0-9_]*$/`** — all lowercase, underscores allowed. The HTML parser lowercases attribute names, so `#createWalletSave` silently becomes `createwalletsave` and `this.refs.createWalletSave` is `undefined`. Use `#create_wallet_save`.

### Template helpers

| Helper | Purpose |
|---|---|
| `classList('base', () => cond && 'token', stateSet)` | Reactive class list. Strings, token-returning fns, `Set`/`Map`/array/`{token:cond}` all collapse into a deduped class string with per-token diffing. Pair with `class=${classList(...)}`. |
| `list(stateKey, ChildClass, keyFn?)` | Keyed list bound to `this.state[stateKey]`. Mounts/destroys `ChildClass` instances per item. |
| `filter(stateKey, ChildClass, test, keyFn?)` | `list` plus a keep-predicate. `test` is `(item) => boolean` (keep where true) or a string flag-name (`'hidden'` → keep unless `item.hidden`). Reactive on array changes AND deep flag toggles. `list` stays filter-free. |
| `each(items, ChildClass, keyFn?)` | Same machinery on an arbitrary array reference — use inside a computed spot. |
| `liveList(items, target, keyFn?)` | Imperative keyed-list render outside templates. |
| `comp(value)` | Wraps a value as a component binding for advanced spots. |
| `<portal to="body">…</portal>` | Teleport: renders content inline then atomically relocates it to a DOM target (default `document.body`) for modals/overlays. Reactivity, refs, `@click`, and child-component lifecycle survive the move (atomic `moveBefore`); shadow styles are carried (target wrapper re-adopts the component's sheets); torn down with its owner. `to` is **static**. `delegate`/`provide`/`inject` resolve by the target's physical ancestry. |
| `bind` / `bind.text` / `.html` / `.component` / `.list` | Typed binding callables. Also available as `this.bind` on every instance — no import needed in templates. |

Never imperatively build markup strings for collections — use `each` / `list`.

### Behavior attributes (built-in, no import)

Behaviors are template attributes handled by a delegated service — zero imports, zero wiring. The template extractor strips the attribute off the DOM and registers its value as a *subevent tag* (a `WeakMap` entry) on the element; a single delegated listener does the rest. Registry: `components/core/behaviors/`.

| Attribute   | Effect                                         |
| ----------- | ---------------------------------------------- |
| `tooltip=`  | Hover tooltip (see below).                     |
| `copy=`     | Click-to-copy the given text to the clipboard. |
| `confirm=`  | Intercept a click with a confirmation prompt.  |
| `reveal=`   | Scroll/visibility reveal animation.            |
| `autofocus` | Focus on mount.                                |

Register custom ones with `registerBehavior(name, behavior)`.

#### Tooltips

Put a `tooltip=` attribute on **any element** in a `this.html` template — that is the entire API:

```js
<button tooltip="Delete this item">🗑</button>
<div class=${this.badgeClass} tooltip=${this.badgeTooltip}>…</div>
<span tooltip=${() => { return this.apiStatus().title; }}>…</span>
```

- **Value forms:** static string, bare reactive read `tooltip=${this.state.hint}`, or computed `tooltip=${() => {...}}`.
- Empty / `null` / `false` / `''` → no tooltip (a live one is unregistered). So `tooltip=${this.state.error}` is self-disabling.
- One shared global `<ui-tooltip>` popover element is created lazily and reused by every tooltip. **Never** create `ui-tooltip` manually or import the tooltip module.
- Auto-picks placement (top → bottom → right → left by available space), clamps to the viewport, slides smoothly when hovering between two tipped elements; hides on leave / click / scroll.
- **Hover-only by design** — touch-only devices get nothing. Never put critical info solely in a tooltip.
- Do **not** use native `title=` (slow, unstyled). Do **not** set `pointer-events:none` on the tipped element itself (children are fine) or hovers won't register.
- Reactive text updates apply on the *next* hover.
- Source: `components/core/tooltips/tooltip.js` (the `ui-tooltip` component) + `tooltip-service.js` (the hover pipeline) + `behaviors/tooltip.js` (registry entry).

## SVG icons — `ui-icon`

Icons are a global component, not a base-class feature, but every component uses them — so use `ui-icon`, never inline `<svg>` or `<img>`.

```html
<ui-icon name="arrow-up" size="md" tone="default"></ui-icon>
```

- **Storage** — one generated sprite sheet: `components/global/icon/sprite.svg` (~460 KB) — a hidden `<svg>` of hundreds of `<symbol id="…">` definitions, one per icon.
- **Source** — the sprite is built, not hand-written. `viat/centralSite/build-sprite.js` (a dev-time tool, kept outside the client folder) reads every SVG in `node_modules/lucide-static/icons/` (the **Lucide** set), wraps each as a `<symbol>`, and concatenates them. Re-run with `node viat/centralSite/build-sprite.js` after adding/upgrading Lucide.
- **Rendering** — the `ui-icon` component (`components/global/icon/icon.js`) renders `<svg><use href="sprite.svg#name">` — pulling one symbol by fragment id.
- **State props** — `name` (icon id), `size`, `tone`, `spin` (boolean), `animate`. Styled via `icon.css`; the sprite uses `currentColor`, so icons inherit text color.
- `index.html` preloads `sprite.svg` so the first icon paints instantly.
- **In templates:** just drop `<ui-icon name="…">`. No import — it is a globally defined custom element.

## State

- `this.state.x = y` — single-key write, tracked via Proxy → patch pass / computed-spot update.
- `this.assignState({ a, b, c })` — batched multi-key write, one notification. Preferred over `Object.assign(this.state, …)`.
- `this.state = obj` — full replace (`replaceState`).
- `this.STATE` — raw object; writes do **not** notify. Never write it from app code.
- `Set` / `Map` values are reactive — `this.state.tags.add('x')` / `.delete('x')` / `.clear()` notify like a prop write. Prefer a `Set` for class-list state over an array.
- `this.watchState(key, handler)` — run a handler on change.
- `this.observe(keys, callback)` — react to state changes (effect) without re-rendering.

### `static properties` — per-path schema (optional)

```js
static properties = {
  label:        { kind: 'text' },     // declares CONTENT_KIND, skips runtime classification
  'meta.cache': { react: false },     // non-reactive — writes notify nothing
};
```

Keys are **dot-paths matching the state accessor path exactly**. `kind` ∈ `CONTENT_KIND` (`text | html | component | list | empty`). `react: false` makes a path non-reactive. Chain-merged like `state`. Keep state reactive by default — declare entries only where you need the strict patcher or a non-reactive path.

### Computed accessors — write them in `static state`

```js
static state = {
  amount: 0,
  get total() { return this.state.amount * 1.07; },
  set total(value) { this.state.amount = value / 1.07; },
};
```

Top-level `get` / `set` accessors on `static state` dispatch with `this === component` so they can read sibling state through `this.state.x` and call instance methods. Reads through `this.state.total` fire the getter; writes through `this.state.total = …` fire the setter and notify subscribers of the `total` path. A getter-only declaration silently rejects writes. Nested objects in `static state` cannot carry accessors (use a top-level key).

## Events

| Method                                    | Purpose                                                                               | Cleanup            |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------ |
| `this.emit('feature:phase', detail)`      | Dispatch a custom event upward (bubbles, composed)                                    | —                  |
| `this.on('pointerdown', handler)`         | DOM event on this component                                                           | auto on disconnect |
| `this.once(event, handler)`               | One-shot listener                                                                     | auto               |
| `this.off(event, handler)`                | Remove a listener                                                                     | —                  |
| `this.delegate('feature:thing', handler)` | Cross-component delegated event, tree-wide — one shared document listener per channel | auto on disconnect |
| `this.removeDelegate(channel, handler)`   | Remove a delegate                                                                     | —                  |

In templates: `<child @feature:thing=${this.handleThing}>`. For cross-component custom events use `delegate` — **never** raw `document.addEventListener`. For `window`/`globalThis` events, pair an `AbortController` with `{ signal }` and abort in `onDisconnect`. Event naming: `feature:phase` or `kebab-case-action`.

## Global (cross-component) state

```js
import { setGlobal, getGlobal, watchGlobal } from 'webcomponent';

this.globalState.theme                       // reactive read (tracked inside render)
setGlobal({ theme: 'dark' });                // or this.setGlobal(...)
watchGlobal('theme', (value) => { ... });
this.observeGlobal('theme', this.handleTheme);   // auto-cleaned on disconnect
```

## Component lookup

```js
this.getComponent('tag')               // first direct shadow child, or null
this.getComponents('tag')              // live array of direct children — do not mutate
this.getComponentsArray('tag')         // plain array snapshot
this.findComponent('tag', predicate)   // first direct child where predicate(component) is truthy
```

All are **non-recursive — direct shadow children only**. To reach nested instances, walk each parent:

```js
const dashboard = this.getComponent('app-dashboard');
const panels = dashboard?.getComponents('transmit-panel') || [];
```

If two parents mount the same child tag, iterate each parent and fan the update out to every instance.

## DOM & refs

- **Never** `this.shadowRoot.querySelector(...)`. Use `#name` in the template + `this.refs.name`.
- `this.refs` is a Proxy over `Map<refName, WeakRef<Element>>` with `FinalizationRegistry` cleanup. Per-instance — two components never share refs.
- `this.getRef(name)` is the explicit accessor.
- For hot loops, deref once: `const el = this.refs.foo; el.x = 1;`.
- Placement helpers: `appendTo`, `prependTo`, `ifAssign`, `findElement`, `getComponentRoot`.

## Instance utilities (on `this`, no import)

- `this.html\`\`` / `this.htmlElement\`\`` — template tags.
- `this.bind` (+ `.text` / `.html` / `.component` / `.list`) — typed bindings.
- `this.setTimeout(fn, ms)` / `this.removeTimeout(id)` — auto-cleaned timers.
- `this.addInterval(fn, ms)` / `this.stopInterval(id)` / `this.clearIntervals()` — auto-cleaned intervals.
- `this.addStyle(key, sheetOrPath, baseUrl)` / `this.removeStyle(key)` / `this.hasStyle(key)` / `this.resolveStyle(...)` / `this.applyStyles()` / `this.forkStyleMap()` — runtime styles.
- `this.setInert(bool)` — toggle `inert` safely.
- `this.nextFrame()` — `requestAnimationFrame` promise.
- `this.installObserver()` / `this.uninstallObserver()` — IntersectionObserver control.
- `this.atPhase(phase)` — phase-gated promise.
- `this.destroy()` — permanent teardown.

## Method reference — by tier

**P0 — used constantly:** `html`, `state` (get/set), `assignState`, `emit`, `on`, `delegate`, `refs`, `getRef`, `setTimeout`, lifecycle hooks.

**P1 — common:** `watchState`, `observe`, `observeGlobal`, `observeAttr`, `getGlobal`, `setGlobal`, `watchGlobal`, `globalState`, `getComponent`, `getComponents`, `findComponent`, `classList`, `bind`, `addStyle`, `removeStyle`, `addInterval`, `stopInterval`, `once`, `off`, `nextFrame`, phase getters (`isMounted`, `isLive`, `isRendered`, `isDisconnected`, `isDestroyed`).

**P2 — rare / framework-internal (the framework calls these for you):** `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`, `connectedMoveCallback`, `handleConnect`, `handleDisconnect`, `handleMove`, `handleDestroy`, `renderView`, `finishRender`, `invalidateRender`, `subscribeRenderDeps`, `handleRendered`, `handleMount`, `handleLive`, `initState`, `replaceState`, `updateView`, `upgradeShadowedProperties`, `createConnectCyclePromises`, `createWhenDestroyedPromise`, `resolveStrandedConnectCyclePromises`, `installObserver`, `uninstallObserver`, `handleObserverCallback`, `setInert`, `appendTo`, `prependTo`, `ifAssign`, `getComponentRoot`, `getComponentsArray`, `findElement`, `cleanupTemplate`, `clearEventListeners`, `clearTimeouts`, `clearIntervals`, `removeTimeout`, `forkStyleMap`, `runEventHandler`, `handleEventError`, `subscribeGlobal`, `destroy`, `nextFrame`, error hooks (`onLifecycleError`, `onRenderError`).

Full verified shape: `agent/docs/classes/WebComponent/WebComponent.json`.

## Anti-patterns

| Don't | Do |
|---|---|
| `class X extends WebComponent { state = {…}; }` (subclass class field) | `static state = {…}` — a class field shadows the accessor and silently breaks reactivity |
| `${() => { return this.state.x; }}` for a plain read | bare `${this.state.x}` — it is the standard, and cheap |
| `class="${cls}"` (quoted attribute interpolation) | `class=${cls}` — bare, unquoted |
| `handleX = () => {}` arrow class field | `handleX() {}` method shorthand |
| `this.shadowRoot.querySelector('.foo')` | `<div #foo>` + `this.refs.foo` |
| `Object.assign(this.state, partial)` | `this.assignState(partial)` |
| `this.STATE.x = y` | `this.state.x = y` |
| `window.X` | `globalThis.X` |
| `document.addEventListener('app:thing', …)` | `this.delegate('app:thing', this.handleThing)` |
| `delete this.x` | `this.x = null` (or `.delete()` / `.clear()` for Map/Set) |
| `onUnmount` (does not exist) | `onDisconnect` |
| `this.getComponent('deeply-nested')` | walk each shadow parent — lookup is non-recursive |
| `findComponent('sibling')?.method()` | `emit` an event; sibling listens via `delegate` |
| `await this.whenConnected` | `await this.lifecycle.whenConnected` |
| `#camelCaseRef` | `#snake_case_ref` (refs match `/^[a-z_][a-z0-9_]*$/`) |
| `for (const x of arr)` in hot loops | indexed `for (let i = 0; i < arr.length; i += 1)` |
| `name`, `event`, `confirm`, `type`, `alert`, `fetch`, `parent` as bindings | rename — these shadow globals |
