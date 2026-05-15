# Universal Web Components

> Native Web Components for the **Universal Web** & **VIAT**: reactive, agent-native, no-build dApps.

Where post-quantum meets Blockchain, AI, and native Web Components.

### Viat Wallet Demo

The reference Viat wallet, built with UWC, shipped as the **World Wide Web
supported version of Universal Web Components**. It is the public-facing
proof that UWC works on today's web too. 
Open a normal browser, navigate to a normal URL, get a working
agent-native wallet for Viat. **It's also the reference for how dApps should
look, feel, and be wired.** UW/Viat Browsers can offer far more but this demo is limited to what the WWWeb allows.

## Write post-quantum dApps for humans & Agent support comes free.

### One component. Two audiences. Zero vision tax.
Every component you write is a human-facing element **and** an agent-addressable surface, same code, both
audiences.

Universal Web Components (UWC) is an **enhancement layer** over the native
`HTMLElement` / Custom Elements / Shadow DOM stack. Not a framework, not a
runtime, not a 100KB ecosystem.

The base class `WebComponent` is what every Universal Web / VIAT component extends.

**DOCS are auto generated from minor docs**
---

## Core ideas

Every component is an **agent-addressable surface**.

Native Web Components were designed for humans clicking pixels. UWC components
are designed for **humans *and* autonomous agents**. State, intent, actions,
and semantics are exposed structurally, not painted into a screenshot an
agent has to OCR back into meaning. Automatic native Agent support for dApps means the lowest possible token costs.

- 🧠 **AI Agent support is built in** — every component, every piece of state,
  every action is introspectable and invocable by an agent.
- 👁️‍🗨️ **No vision model required** — agents don't need to "see" your UI to
  use it. Structured state + AXON gives them everything. Massive cost and
  latency win for agentic flows.
- 🪶 **Lightweight by design** — no virtual DOM, no compiler, no JSX, no build
  step. Just `class X extends WebComponent`.
- 🔌 **AXON protocol native** — UWC speaks **AXON**, the Universal Web's
  replacement for MCP. Components advertise their tools, state, and events
  over AXON without any glue code.
- 🧩 **dApp-ready** — built for the next generation of decentralized,
  AI-enabled, lightweight, high-performance apps on the Universal Web.

---

## #noBuild, by intent

UWC is written **for** the modern web platform, not against it.

- ✅ Native ES Modules (`import` / `export`)
- ✅ Native Custom Elements + Shadow DOM
- ✅ Constructable Stylesheets (`adoptedStyleSheets`)
- ✅ Tagged template literals for HTML
- ✅ `Proxy`, `IntersectionObserver`, `requestAnimationFrame`, `queueMicrotask`
- ✅ Static class fields, private fields, top-level `await`

There is **no compiler**. There is **no bundler requirement**. Ship the source.
The browser is the runtime. That is the whole point.

---

## What `WebComponent` gives you

A reactive base class that stays out of your way:

| Capability           | How                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔄 Reactive state     | `this.state.x = …` — auto-tracked via `Proxy`, render deps inferred per render pass                                                                                                                             |
| 🌍 Global state       | `this.globalState.*` with the same proxy ergonomics; `subscribeGlobal` / `watchGlobal` for cross-component pub/sub                                                                                              |
| 🧱 Attrs schema       | Static `attrs = {}` → typed two-way attribute proxy + auto `observedAttributes`                                                                                                                                 |
| ⚙️ Config schema      | Static `config = {}` merged across the chain, asserted at construct time                                                                                                                                        |
| 🎨 Style chain        | Static `styles = {}` merged across the inheritance chain, compiled once and cached as `CSSStyleSheet`s on `adoptedStyleSheets`; `WebComponent.preload()` warms                                                  |
| 🧩 Templating         | `this.html` tagged literal — spots, two-way `@bind`, `@event` / `@${fn}`, `?bool` / `.prop`, `#name` element refs, bare-attr inference, `each()` / `liveList()` keyed list diffing, `ClassList`, `comp()` slots |
| 🪝 Lifecycle hooks    | `onInit` · `onConnect` · `beforeRender` · `onRender` · `onRendered` · `onMount` · `onLive` · `onVisible` · `onIntersect` · `onMove` · `onDisconnect` · `onDestroy`                                              |
| ⏳ Lifecycle promises | `whenConnected` · `whenRendered` · `whenMounted` · `whenLive` · `whenVisible` · `whenDisconnected` · `whenDestroyed` — and `this.atPhase(name)`                                                                 |
| 📡 Events             | Auto-cleaned listeners, delegate channels, sub-event attrs (e.g. `tooltip`), global observers                                                                                                                   |
| 🧹 Auto cleanup       | Template spots, timeouts, intervals, IntersectionObserver, state/global/delegate subscriptions, event listeners — all torn down on `disconnectedCallback`                                                       |
| 📨 Children registry  | Per-host `liveChildren(this)` / `liveChildren(this, tag)`; auto-registered on connect, auto-removed on disconnect/move (held in a `WeakMap` keyed by host)                                                      |
| 🆔 Global lookup      | `WebComponent.getById(id)` via the id-keyed `registry` proxy                                                                                                                                                    |
| 🏗️ Factory            | `static create(state, config)` async ctor, `static preRender()`, `static createBound()`                                                                                                                         |
| 🧠 Agent surface      | State, attrs, actions exposed to AXON automatically                                                                                                                                                             |

### Phases

`created` → `connected` → `rendered` → `mounted` → `live` → `disconnected` → `destroyed`.
Re-connecting resets through the cycle; `destroy()` is terminal and resolves `whenDestroyed`.

---

## 🤖 Why agents care

Most UI today is opaque to agents. They get a screenshot, run a vision model,
guess at the DOM, click, hope. That's slow, expensive, and brittle.

UWC inverts it:

- **State is the API.** Every reactive key is readable and (where allowed)
  writable by an agent.
- **Actions are declared.** Methods marked as agent-callable are advertised
  over AXON with their schemas.
- **Events are subscribable.** Agents can `await` UI changes without polling.
- **No screenshots, no OCR, no vision tax.** A 4B-param text model can drive
  a UWC app as well as a frontier multimodal model, often better.

This makes UWC the **default UI layer for cheap, fast, autonomous agents**
on the Universal Web.

---

## 🧭 Where this fits

UWC is one component in a larger ecosystem. Each piece is independent and
does one job. They compose when used together, but none of them require the
others to be useful.

### 🌐 The Universal Web

A clean-slate web. Not a fork of the WWW, not an overlay, not a browser
plugin. It is a fresh networking + identity + execution substrate designed
for an era of autonomous agents and post-quantum cryptography. The WWW was
designed for documents, then bolted to apps, then bolted to commerce, then
bolted to AI. The Universal Web starts from "agents and humans share this
surface, and money settles natively" and works outward.

### ⟁ ⩝Viat — the post-quantum cryptocurrency

A Level-1 cryptocurrency built from scratch for the quantum era. Hierarchical
Proof-of-Work (HPoW), per-wallet chains paired with global audit layers,
hybrid block lattice (DAG + linear chain), Dilithium / Ed25519 / SPHINCS+
signatures, SHAKE256 hashing. Not a fork, not an SDK reskin, not a "quantum
vault" bolt-on. Viat is the **native settlement and identity layer of the
Universal Web**, but it is its own coin and its own network. You use Viat by
holding it, sending it, mining it, building on it.

### 📡 AXON — the agent protocol

An agent ↔ component and agent ↔ service protocol. The Universal Web's
replacement for MCP. Components and services advertise their state, tools,
and events; agents subscribe, read, and invoke without ever rendering a
pixel. AXON is **not Universal-Web-only**. It runs over plain HTTP on the
WWW just as happily as over Universal Web transports. Drop it into any
website to make that site agent-native.

### 🧩 Universal Web Components *(you are here)*

The UI building blocks. Reactive base class, no build step, native Custom
Elements + Shadow DOM, AXON wired in. Every component you write is a
human-facing element **and** an agent-addressable surface, same code, both
audiences. UWC **also runs on the World Wide Web**. It is plain native Web
Components. Any browser that supports the modern web platform can mount a
UWC app today. The Universal Web is the eventual home; the WWW is a
first-class deployment target.

---

### How they compose

| If you have…      | …you can build                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------ |
| UWC alone         | Agent-native UIs on any modern browser, WWW or otherwise. No chain required.               |
| UWC + AXON        | UIs that autonomous agents can drive cheaply, with no vision model and no OCR.             |
| UWC + AXON + Viat | A full Universal Web dApp — agent-driven UI, agent-driven services, value settled in Viat. |
| Viat alone        | A post-quantum cryptocurrency. UWC is not required to use, hold, mine, or build for Viat.  |

UWC ships no chain, no wallet, no consensus engine. That's Viat's job. Viat
ships no UI primitives. That's UWC's job. AXON is the connective tissue and
works for either, together or alone. The Viat Wallet Demo is what it looks
like when all three meet on the regular web.

---

## 🚀 Minimum viable component

```js
import { WebComponent } from './base.js';

class Counter extends WebComponent {
  static url = import.meta.url;
  static state = { count: 0 };
  static styles = { local: './counter.css' };

  render() {
    return this.html`
      <button @click=${() => this.state.count++}>
        clicks: ${this.state.count}
      </button>
    `;
  }
}

customElements.define('x-counter', Counter);
```

No build. No bundler. No framework. Just a component, and an agent can drive
it the moment it's mounted.

---

## ✨ Template syntax

`this.html` is a tagged template literal. Five sigils plus bare interpolation cover the full reactive surface:

| Syntax          | Purpose                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------ |
| `${expr}`       | Text / element / list — auto-detected (string, `Node`, `LiveList`, `comp(el)`)             |
| `attr=${expr}`  | Attribute — string-coerced via `setAttribute`                                              |
| `?attr=${expr}` | Boolean attribute — presence toggled by truthiness (`?disabled=${state.busy}`)             |
| `.prop=${expr}` | Property setter — assigns `el.prop`, not the attribute (`.value=${state.text}`)            |
| `@event=${fn}`  | Event listener with explicit name (`@click=${this.onClick}`)                               |
| `@${fn}`        | Event listener with name **deduced from `fn.name`** (`@${this.dockSelect}` → `dockSelect`) |
| `@bind=${key}`  | Two-way state binding (input/select/textarea) — explicit form, state key can differ from attr name |
| `$attr="key"`   | Two-way binding shorthand (static) — binds the `attr` DOM attribute to state path `key`. Key is bare (`"amountValue"` → `state.amountValue`), or namespaced (`"state.X"`, `"globalState.X"`). |
| `#name`         | Per-component element ref — accessed as `this.refs.name`                                   |

Authors must quote interpolated attribute values: `<input class="${cls}">`, not `<input class=${cls}>`.

> **Reserved**: `data-uwc` is the framework's marker-discovery attribute. Don't use it on your own elements; it's stripped during recipe prep.

### Reactive expressions: function vs. value

Every interpolation is tracked, but the **granularity** depends on what you pass:

- **Function** — the engine re-invokes it on dep change and patches just that spot. `this` is bound to the component automatically (no `.bind`, no closure needed).
- **Bare value** — read happens during `render()`, registers as a whole-component dep, and forces a **full re-render** when it changes.

So both update, but functions update surgically.

```js
// ✅ no-arg method — pass the reference directly, engine calls it with this = component, spot-level update
<span>${this.buildKeysMarkup}</span>

// ✅ getter / property / inline expression — wrap so the engine receives a function it can re-call
<span class="${() => this.hostClass}">
<span>${() => this.state.count + 1}</span>

// ✅ method that needs args — arrow is the only way
<button @click=${() => this.select(item.id)}>

// ⚠️ works but pessimistic — bare reads register at render() scope; a write re-renders the whole template
<span>${this.state.count}</span>
```

Rule of thumb: prefer the function form for any value derived from state. Bare method refs are already functions; getters, properties, and inline expressions need an arrow.

### `$attr=` two-way shorthand

`$attr="key"` declares two-way binding statically — no interpolation, no slot. The attribute name after `$` says **which DOM attribute** to bind (`value` or `checked`); the static value is **the state path** to bind to.

```js
// bare key → state path (most common)
<input $value="amountValue">                    // ↔ state.amountValue
<textarea $value="message">                     // ↔ state.message
<input type="checkbox" $checked="isActive">     // ↔ state.isActive

// explicit state. prefix — same as bare
<input $value="state.amountValue">              // ↔ state.amountValue

// globalState. prefix for global namespace
<input $value="globalState.theme">              // ↔ globalState.theme
```

**Resolution rules:**
- `"amountValue"` → `state.amountValue` (bare keys default to the local state namespace)
- `"state.amountValue"` → `state.amountValue` (explicit, same as bare)
- `"globalState.theme"` → `globalState.theme` (cross-component global state)

**Constraints:**
- Works on `<input>` / `<textarea>` / `<select>` for the `value` and `checked` attributes (same set as the rest of the two-way machinery).
- Static only — the attribute value is the state path string, not an interpolation. For dynamic key resolution, use the function-form auto-bind (`value=${() => state[someName]}`) or explicit `@bind=${dynamicKey}`.
- One `$attr=` per element (HTML attribute uniqueness).

### `@${fn}` shorthand caveats

Resolved at install time from `fn.name`. Anonymous arrows and `.bind()` results have no usable name and throw a clear error. Use the explicit `@click=${...}` form instead.

| Form                                 | `.name`         | Works?   |
| ------------------------------------ | --------------- | -------- |
| `@${this.handleClick}` (method)      | `'handleClick'` | ✅        |
| `@${this.handleClick}` (arrow field) | `'handleClick'` | ✅        |
| `@${function named() {}}`            | `'named'`       | ✅        |
| `@${() => {}}`                       | `''`            | ❌ throws |
| `@${this.fn.bind(this)}`             | `'bound fn'`    | ❌ throws |

The deduced name is locked at first install. Don't swap a `@${a}` reference for one with a different `.name` mid-component-life. Use the explicit form if the event name needs to vary.

---

## 📡 Event-driven communication

**Components must not know about each other.** A component never queries the DOM
for a sibling, never imports a sibling's element, never registers itself in a
shared lookup table for another to find. It **emits events upward**; whoever
cares **listens**. If nothing's listening, the event is ignored. That's the
feature, not a bug.

This is the only sanctioned way for components to talk across boundaries.

### Why no querying / registering

- **Mount order is unknowable.** A trigger may render before, after, or
  conditionally relative to its consumer. Querying assumes "you're already
  here"; events don't.
- **Shadow DOM walls.** `querySelector` can't see across shadow roots without
  a recursive walk through `.shadowRoot.host` chains, which couples every
  trigger to a specific tree shape.
- **Lookup tables rot.** Registries with named entries become stale on
  re-render, must be cleaned up on disconnect, and tie producer to consumer.
  An event has no lifecycle to manage.
- **Hot-swappable layouts.** Pages that swap routes, drawers, modals, or any
  dynamic chrome must keep working when the consumer appears or disappears
  mid-session. Event listeners survive; element references don't.

### Emit upward

`this.emit(name, data)` dispatches a `CustomEvent` with `bubbles: true` and
`composed: true`. It crosses every shadow boundary and reaches `document`.
Detail shape is always `{ data, source }`:

```js
class DockIconButton extends WebComponent {
  static state = { onClick: '' }; // event name supplied by config

  handleActivate() {
    this.emit(this.state.onClick, {});
  }
}
```

### Listen in templates (preferred)

The closest ancestor that cares declares an `@event` handler. Bubbling does
the rest. No element references stored, no lookups done.

**Pattern A — `@${fn}` shorthand (event name = function name):**

```js
class GlobalDock extends WebComponent {
  dockSelect(domEvent) {
    const { source } = domEvent.detail; // the originating component
    this.activate(source);
  }

  render() {
    return this.html`
      <div class="nav-rail" @${this.dockSelect}>
        ${list('items', DockIconButton)}
      </div>
    `;
  }
}

class DockIconButton extends WebComponent {
  static state = { onClick: 'dockSelect' };

  handleActivate() {
    this.emit(this.state.onClick, {});
  }
}
```

The dock has no idea which icon will fire, only that something inside will,
eventually. The icon has no reference to the dock; it just emits upward.

**Pattern B — explicit `@event-name=` with a kebab-case action:**

```js
// In the icon button config (modules/appDefaults.js)
TOP_BAR.items = [
  { icon: 'panel-left', tooltip: 'Sidebar', onClick: 'open-dashboard-sidebar' },
];

// In the shell (modules/app.js). Listener on the element where the event
// will pass through on its way up
class AppView extends WebComponent {
  handleSidebarToggle() {
    this.getComponent('dashboard-sidebar')?.toggle();
  }

  render() {
    return this.html`
      <global-top-bar @open-dashboard-sidebar=${this.handleSidebarToggle}></global-top-bar>
      <dashboard-sidebar></dashboard-sidebar>
    `;
  }
}
```

The icon button doesn't know anything called "sidebar" exists. The top bar
doesn't know either; it just happens to be the component the event passes
through on its way up. If the shell removed the sidebar entirely, the event
would still fire and simply find no listener. No error, no broken reference.

### Listen across the whole tree — use `this.delegate(...)`, not `document.addEventListener`

Some consumers aren't a DOM ancestor of their triggers: a global drawer that
reacts to a top-bar drag, a notification panel that listens for `notify`
anywhere. **Don't** attach raw listeners at `document` or `window` in
`onMount`. Use `this.delegate(channel, handler)` instead.

```js
class UIPullDown extends WebComponent {
  onConnect() {
    this.delegate('pulldown:dragstart', this.handleDragStart);
    this.delegate('pulldown:drag', this.handleDrag);
    this.delegate('pulldown:state', this.handleState);
    // No onDisconnect needed. Auto-cleaned on disconnect.
  }

  handleDrag(domEvent, target, data) {
    const { progress } = domEvent.detail.data;
    this.refs.drawer.style.transform = `translateY(${(progress - 1) * 100}%)`;
  }
}
```

The pulldown stores **zero element references**. It doesn't know the trigger
exists. Any component that emits `pulldown:drag` will drive the drawer. No
registration, no opt-in.

**Why `this.delegate(...)` and not `document.addEventListener(...)`:**

| `this.delegate(...)`                                                                    | Raw `document.addEventListener(...)`                                             |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **One** root capture listener per event name, shared across every subscriber in the app | One full listener per call — N components × M events = N×M listeners on document |
| Auto-cleaned on `disconnectedCallback` via `delegateUnsubs`                             | You must remember to remove it in `onDisconnect`                                 |
| Returns an unsubscribe function for ad-hoc lifetimes                                    | Manual `removeEventListener` with the exact same handler reference               |
| Channel form `'click.copy'` enables sub-event filtering                                 | You filter inside the handler                                                    |
| Supports `{ once, signal }` options                                                     | Supported, but you still pay per-listener                                        |

Hundreds of components subscribing to `pulldown:drag` cost the framework
exactly **one** root listener. The delegate dispatcher walks the
`composedPath()` once and fans out to subscribers from a `Map`. This is the
same primitive the framework's behaviors (`copy`, `tooltip`, `outside-click`)
are built on; they all share root listeners through `delegate`.

#### Channel form

```
'eventName'              // catches all events of this type
'eventName.subevent'     // only fires when the path includes an element
                         // tagged with `registerSubevent(el, 'subevent', ...)`
```

For ordinary cross-component events (`pulldown:drag`, `notify`,
`open-dashboard-sidebar`), use the plain channel form. The dotted form is for
attribute-driven behaviors that scope a global event to elements bearing a
specific attribute (see `behaviors/copy.js` for an example).

#### When raw `document.addEventListener` is appropriate

- Native DOM events you don't want to globally route (`scroll` on a specific
  element, `resize` on `window` for layout math).
- One-off lifetimes outside a component (test setup, top-level modules).

If a component is the consumer and the event is custom, prefer
`this.delegate(...)`.

### Naming conventions

| Pattern             | Use when                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `someAction`        | Single-word action, caught by the closest ancestor (matches `@${this.someAction}` shorthand) |
| `kebab-case-action` | Multi-word action, scoped to a feature (`open-sidebar`)                                      |
| `feature:phase`     | Lifecycle/state stream for one feature (`pulldown:drag`, `pulldown:state`)                   |
| `feature:noun:verb` | Reserved for richer protocols (`pulldown:trigger:bound`)                                     |

The colon namespace makes it cheap to grep for "everything pulldown does"
and prevents collisions when two unrelated features pick the same verb.

### Bidirectional flows

When two components need to stay in sync (e.g. trigger animates itself; drawer
animates itself; both must agree on open/closed), emit a **state event** that
either side can produce and either side can consume:

```js
// Trigger snaps and announces
snapTo(open) {
  this.style.transform = `translateY(${open ? this.maxOffset() : 0}px)`;
  this.open = open;
  this.emit('pulldown:state', { open });
}

// Drawer reacts, but ALSO listens, so any other producer (e.g. swipe-up
// gesture on the drawer itself, escape-key handler, programmatic toggle)
// can trigger the same animation by emitting the same event.
handleState(e) {
  this.refs.drawer.style.transform = e.detail.data.open ? 'translateY(0)' : 'translateY(-100%)';
}
```

State events make components **interchangeable**: swap one trigger for another
without touching the consumer.

### Anti-patterns

| ❌ Don't                                                          | ✅ Do instead                                                                |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `document.querySelector('global-top-bar')`                       | Have the top bar emit; subscribe via `this.delegate(...)`                   |
| `findComponent('global-sidebar')?.toggle()`                      | Emit `open-sidebar`; sidebar listens for it                                 |
| `import { sidebar } from '../sidebar/instance.js'`               | Emit; sidebar reacts                                                        |
| Shared registries keyed by element name (`triggers.set(...)`)    | Shared event names (`pulldown:drag`)                                        |
| `await waitForElement('.thing')` before wiring up                | Listener is always live; emitter just emits                                 |
| Walking `.shadowRoot.host` chains to find an ancestor            | Bubble via `composed: true` (which `this.emit` does)                        |
| `document.addEventListener('foo', ...)` in `onMount`             | `this.delegate('foo', this.handleFoo)` — shared root listener, auto-cleanup |
| `window.addEventListener('foo', ...)` for cross-component events | `this.delegate('foo', ...)` — same reasons                                  |

If you find yourself reaching for any of these, the design is wrong: rephrase
the question as *"what event would convey this?"* and emit it instead.

### When events are not the answer

- **Tightly-coupled parent/child within one render** — pass props/state via
  the template (`<child .state=${this.childState}>`). Events would be ceremony.
- **Global app state** — use `setGlobal` / `subscribeGlobal` for values many
  components read or watch (theme, current user). Events are for *moments*, not
  *values*.
- **Imperative control of own children** — `this.refs.drawer.classList.add(...)`
  is fine; that's not cross-component, it's intra-component.

The rule is about **crossing component boundaries**. Inside a component, do
whatever's clearest.

---

## 🌐 Environment (built-in system)

The framework's `core/environment/` package gives you reactive runtime info:
viewport size & buckets, OS/browser/engine, locale, user-preference media
queries, network info, geolocation, battery, all written into
`this.globalState.environment` and dispatched as `viewport:*` /
`environment:change` events. **All subsystems are opt-in via side-effect
imports.** What you don't import doesn't run.

### What's available

| Path                                 | Source                           | Init                       |
| ------------------------------------ | -------------------------------- | -------------------------- |
| `globalState.environment.viewport`   | `core/environment/viewport.js`   | side-effect import         |
| `globalState.environment.device`     | `core/environment/device.js`     | side-effect import         |
| `globalState.environment.locale`     | `core/environment/locale.js`     | side-effect import         |
| `globalState.environment.media`      | `core/environment/media.js`      | side-effect import         |
| `globalState.environment.connection` | `core/environment/connection.js` | side-effect import         |
| `globalState.environment.geo`        | `core/environment/geo.js`        | opt-in: `requestGeo()`     |
| `globalState.environment.battery`    | `core/environment/battery.js`    | opt-in: `requestBattery()` |

### Bootstrap (in your app)

```js
// modules/environment.js (the active subset for THIS app)
import '../components/core/environment/viewport.js';
import '../components/core/environment/device.js';
import '../components/core/environment/media.js';
// not importing connection/locale → those subsystems don't run
```

Then in your entry point:

```js
import './modules/environment.js';   // boots the active subsystems
```

### Reading viewport state in a component

```js
class GlobalSidebar extends WebComponent {
  render() {
    const v = this.globalState.environment.viewport;
    if (v.w === 'sm' || v.h === 'short') return this.renderOverlay();
    if (v.w === 'md') return this.renderFloating();
    return this.renderDocked();
  }
}
```

The `globalState` proxy auto-tracks reads; the component re-renders when
any read key changes. Components react to **just** the buckets they care
about; the framework handles the rest.

### Reacting to resize / change events

For active handlers (not render), subscribe via `this.delegate(...)`:

```js
onMount() {
  this.delegate('viewport:resize', this.handleResize);   // every coalesced tick
  this.delegate('viewport:change', this.handleBucket);   // only on bucket transitions
  this.delegate('environment:change', this.handleEnv);   // locale/media/network/etc
}
```

`viewport:resize` carries the full new state in `event.detail.data`.
`viewport:change` adds `event.detail.data.changed = { w: { from, to }, ... }`.

### Default breakpoints (overridable)

| Bucket | Width-px range | Bucket   | Height-px range |
| ------ | -------------- | -------- | --------------- |
| `xs`   | 0 – 480        | `short`  | 0 – 480         |
| `sm`   | 480 – 768      | `medium` | 480 – 768       |
| `md`   | 768 – 1024     | `tall`   | 768+            |
| `lg`   | 1024 – 1440    |          |                 |
| `xl`   | 1440 – 1920    |          |                 |
| `xxl`  | 1920+          |          |                 |

Plus aspect (`tall` / `square` / `standard` / `wide` / `ultra-wide`) and
orientation (`portrait` / `landscape` / `square`). Mutate the maps in
`core/environment/breakpoints.js` to change thresholds.

### Why no DOM `data-*` attributes?

State stays in JS. That's the source of truth. Components read via
`globalState`, react via delegate events, branch in their render. Putting
attributes on the DOM duplicates the state, fights with shadow DOM
boundaries, and tempts components to query each other's host attributes
instead of reading state. If a stylesheet truly needs the value, components
can read globalState in JS and apply their own classes inside their shadow.

---

## 🔌 Plugins (user extensions)

For app-author extension points beyond the framework's built-in environment:
analytics, telemetry, custom services, third-party integrations.

Plugins are JS modules with an `init()` function. They run **once** at boot,
**after** environment is up, **before** any component renders. They populate
`globalState`, register delegates, set up shared listeners, like environment
modules but app-defined rather than framework-provided.

```js
// my-app/plugins/analytics.js
import { registerPlugin } from '../components/core/plugins/registry.js';
registerPlugin('analytics', {
  async init() {
    // ... wire up tracking, set globalState.analytics, etc.
  },
});
```

```js
// modules/plugins-bootstrap.js (side-effect imports)
import '../components/myApp/plugins/analytics.js';
import '../components/myApp/plugins/featureFlags.js';
```

Boot order in your entry point:

```js
import './modules/environment.js';     // 1. environment subsystems
import './modules/plugins-bootstrap.js'; // 2. user plugins register themselves
import { runPlugins } from './components/core/plugins/registry.js';
import AppView from './modules/app.js';

await runPlugins();                     // 3. fire all plugin init()
const app = await AppView.create();     // 4. render
```

By the time your first component mounts, environment **and** plugins have
populated `globalState`. Components don't have to wait for anything.

Plugins are NOT for things that need DOM (a component is for that) or for
components themselves. They're for boot-phase services with no view.

---

## 🧠 Operate JS-side, not DOM-side

Components are JavaScript objects with state, methods, attrs, refs, and events.
Reach for **those** before reaching for the DOM. The DOM is a render target,
not a source of truth. Every time you ask it a question, you're paying for
a layout/style read or walking a tree the framework already owns the model for.

> **Specifically**: never write a loop that walks `composedPath()`,
> `parentNode`, or `children` to brute-force-discover what kind of element
> you're touching. Tag-name comparisons, hyphen substring matches, attribute
> presence checks across an arbitrary path. All of it is a smell.

### Why DOM walking is wrong

- **Fragile.** Renaming a child element, splitting a render, wrapping
  something in a new div. Any of these silently breaks the loop.
- **Opaque.** Nothing tells the next reader why the walk exists, what it
  protects against, or what the whitelist criteria mean.
- **Slow.** O(depth) per event, and you pay it on every fire, including
  every `pointermove` if you put it in a hot handler.
- **Out-of-band coupling.** The walk knows about elements it shouldn't.
  If it sees `BUTTON`, it now silently depends on the inner button DOM,
  which the button component has every right to restructure tomorrow.
- **It's not the framework's idea.** UWC gives you state, events, refs,
  delegates, behaviors. If the answer is "walk the DOM," ask which of
  those primitives you should have used instead.

### Patterns to use instead

| Instead of...                                                     | Reach for...                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Walking `composedPath()` to detect "is this a button"             | Threshold-based gating — let the natural flow happen and only commit when criteria are met       |
| Tag-name checks across the path                                   | An emitted event from the interested element (`@${this.handleX}`) — they identify themselves     |
| Attribute scans for `role`, `tabindex`, `data-*`                  | A behavior (`registerBehavior`) — declarative opt-in via attribute, framework wires it           |
| `instanceof` checks across a tree walk                            | `this.refs.name` for known refs, or a state field on the component itself (`isComposable: true`) |
| Reading computed style or `getBoundingClientRect()` in a hot loop | Cache the value once, react to events that change it (`pulldown:state`, `resize`)                |
| `querySelector` / `querySelectorAll` for sibling components       | Events (see Event-driven communication above)                                                    |

### When DOM operations are fine

- **Reading geometry once** for a measurement (`measureNatural()` calling
  `getBoundingClientRect()` on `this` at the start of a drag; single read,
  cached for the gesture's lifetime).
- **Setting style on your own element / refs** (`this.style.transform = ...`,
  `this.refs.drawer.style.height = ...`); that's the render output, not a query.
- **Reading native form values** (`input.value`, `select.selectedIndex`); the
  DOM IS the model for these if not already in STATE or set with two-way binding.
- **One-off, intra-component lookups via `this.refs.name`** — that's the
  framework's blessed channel.

The rule isn't "no DOM"; it's "no **walking** the DOM to discover things you
should already know JS-side."

---

## 📨 Element refs (`#name`)

Imperative handles to elements in the shadow root, scoped per component, cleaned up automatically.

```js
class Form extends WebComponent {
  render() {
    return this.html`
      <input #email type="email" .value=${this.state.email}>
      <button #submit ?disabled=${!this.state.email} @${this.send}>Send</button>
    `;
  }

  onLive() {
    this.refs.email.focus();          // proxy → WeakRef.deref → Element
  }

  send() { /* ... */ }
}
```

### Naming rules
- Lowercase letters, digits, underscore. **Regex:** `/^[a-z_][a-z0-9_]*$/`
- No dashes (would force `this.refs['x-y']` bracket access). Use `_`.
- HTML attribute names are case-insensitive: `<div #emailField>` is silently lowercased to `#emailfield` by the parser. Always write lowercase.
- Same name twice in one render = last write wins (last element). Multiple names on one element (`<div #a #b>`) all resolve to that element.

### Access
| Form                  | Returns                                 | Use when                       |
| --------------------- | --------------------------------------- | ------------------------------ |
| `this.refs.name`      | `Element` or `undefined`                | One-off read in a handler      |
| `this.getRef('name')` | `Element` or `undefined`                | Programmatic / dynamic name    |
| `this.refsMap`        | raw `Map<string, WeakRef<Element>>`     | advanced — usually leave alone |

### Local-cache pattern (perf)
For elements you read many times per frame (hover handlers, scroll loops), deref once and use the bare element:

```js
onLive() { this.emailEl = this.refs.email; }
onDisconnect() { this.emailEl = null; }
// ...later...
this.emailEl.focus();   // direct property load, no proxy / no deref
```

### Memory contract
Storage is `Map<string, WeakRef<Element>>` with a `FinalizationRegistry` safety net. `Map` is used (not `WeakMap`) because lookups are by **name** (string) — the weak link is on the *value* side via `WeakRef`, not the key.

| When                                          | What clears the entry                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Re-render swaps the element                   | Active — `tplUnsubs` deletes the entry                                 |
| Component disconnects                         | Active — `cleanupTemplate` runs the unsubs                             |
| Element manually `.remove()`'d, no other refs | Passive — GC + `FinalizationRegistry` deletes the dead `WeakRef` entry |
| Component itself GC'd                         | Whole `refsMap` GC'd with it                                           |

Never produces null sentinels; entries are either present-and-resolving or absent. If you manually move/remove a ref'd element via `el.remove()`, the framework's active cleanup may not fire, but the safety net collects the entry once the element is otherwise unreferenced. Prefer letting templates manage element lifecycle.
