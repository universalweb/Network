# WebComponent Lifecycle Plan

The plan for the redesigned WebComponent lifecycle. Each section defines part of the contract that the implementation must satisfy. Decisions Locked is the index of binding choices; Implementation Notes are concrete guidance for writing the code.

## Mental Model

A component's life is a strictly-ordered ladder of phases. Each phase implies all prior phases (a single `phase` string is enough to know everything about the component's current capabilities). External code observes phases via three orthogonal patterns:

- **`on*` hooks** — override to participate in a phase
- **`is*` state** — sync question: am I at this phase right now?
- **`when*` Promises** — async wakeup: notify me when this phase is reached

The lifecycle works through pure function calls and Promise resolvers. **No DOM events are dispatched by the framework as part of the lifecycle.** Cross-component coordination uses Promises (`await someComponent.whenMounted`) or direct method calls between components. Users can dispatch their own custom events if they need application-level pub/sub, but the framework's lifecycle never depends on event listeners.

## Phase Ladder

```
created → connected → rendered → mounted → live
                                            │
                                  (highest reachable through structural lifecycle)
                                            ↓
                                     disconnected ──→ (reconnect rewinds to 'connected')
                                            ↓
                                      destroyed (terminal; no reconnect)
```

| Phase | Meaning |
|---|---|
| `created` | Constructor returned; never connected |
| `connected` | `onConnect` resolved; in document |
| `rendered` | First render's `onRendered` resolved; subtree settled. Subsequent renders do NOT move phase backward. |
| `mounted` | First per-connect `onMount` resolved |
| `live` | First per-connect `onLive` resolved (paint-aligned). The structural lifecycle peaks here. |
| `disconnected` | `onDisconnect` resolved; reversible — reconnect rewinds to `connected` |
| `destroyed` | `onDestroy` resolved after explicit `destroy()` call; terminal, no reconnect |

Every phase except `disconnected` and `destroyed` implies all prior phases.

**Intersection and visibility are NOT in the phase ladder.** They are observer-driven viewport-state signals, not structural lifecycle milestones — exposed as standalone properties (`isIntersecting`, `isIntersected`, `isVisible`) and the `whenVisible` Promise. Intersection is fire-and-forget via `onIntersect` (no Promise — flags carry the state); visibility has a Promise because consumers commonly need to await first user-visibility. This separation keeps the phase ladder a pure structural-progression ratchet (about DOM presence, render state, mount state) while letting viewport observation toggle independently.

`phase` advances **only after a hook resolves successfully**. While a hook runs, `phase` reflects the previous completed checkpoint. Errors do not advance the phase (except `onDisconnect` and `onDestroy`, which advance regardless of error since the element is being torn down anyway).

## The Spine — Strictly Ordered Hooks

The spine is the entire user-overridable lifecycle surface. There are no off-spine hooks.

```
constructor → onInit → onConnect → beforeRender → render → onRender →
  onRendered → onMount → onLive
                            │
                            ├─→ [observer-driven, no phase advance] → onIntersect / onVisible
                            │
                            ├─→ (DOM removal) → onDisconnect ──→ (reconnect possible)
                            │
                            ├─→ (Element.moveBefore) → onMove (phase preserved)
                            │
                            └─→ (component.destroy()) → onDisconnect → onDestroy (terminal)
```

The structural spine ends at `onLive`. After `onLive`, the framework installs IntersectionObserver(s) — only for hooks the user has overridden — and `onIntersect` / `onVisible` fire when their conditions are met. **They do NOT advance phase.** They update standalone properties (`isIntersecting`, `isIntersected`, `isVisible`).

`onDisconnect` fires when the element is removed from the DOM. `onMove` fires for `Element.moveBefore()` reorders (browser calls `connectedMoveCallback`, framework skips disconnect/reconnect tear-down). `onDestroy` fires after explicit `destroy()` call, after disconnect cleanup, and is terminal. The framework awaits any pending in-flight hook before invoking `onDisconnect` or `onDestroy`.

Each transition has explicit preconditions enforced by the framework:

| Into | Preconditions |
|---|---|
| `onInit(state, config)` | constructor has run super(); STATE/attrs seeded; reactivity NOT yet armed |
| `onConnect()` | `isConnected === true` |
| `beforeRender()` | `onConnect` resolved; `isConnected === true` |
| `render()` | `beforeRender` returned anything other than `=== false`; sequence current |
| `onRender()` | `render` resolved; `isConnected === true`; sequence current |
| `onRendered()` | `onRender` resolved; **all child components' `whenRendered` resolved**; `isConnected === true` |
| `onMount()` | `onRendered` resolved; `firstRenderDone === false` (first render of connect cycle); `isConnected === true` |
| `onLive()` | `onMount` resolved; one rAF tick passed; `isConnected === true` |
| `onIntersect(isIntersecting)` | `onLive` resolved (observer installed only after `onLive`); V1 or V2 IO threshold crossed; `isConnected === true`. **No phase advance** — updates `isIntersecting` / `isIntersected` flags only; no Promise (fire-and-forget) |
| `onVisible()` | `onLive` resolved (V2 IO installed only after `onLive`, with V1+manual-check fallback if V2 unsupported); actual visibility confirmed; `isConnected === true`. **No phase advance** — sets `isVisible = true` and resolves `whenVisible` (one-shot per cycle) |
| `onDisconnect()` | `disconnectedCallback` fired; pending pipeline awaited |
| `onMove(oldParent, newParent)` | `connectedMoveCallback` fired by browser (`Element.moveBefore` reorder); phase preserved; no cleanup |
| `onDestroy()` | `destroy()` called; `onDisconnect` resolved; cleanup complete |

The `isConnected` check at every transition makes "must be in the DOM" enforceable across the chain. Removal at any point aborts the chain cleanly — no later spine hook fires.

## Hook Reference

### All hooks — the spine

| # | Hook | Sync? | Awaited | Phase before → after | Notes |
|---|---|---|---|---|---|
| 0 | `constructor(state, config)` | sync | n/a | (none) → `created` | Per-instance, ever |
| 1 | `onInit(state, config)` | **sync only** | no | `created` (no advance) | Inside super constructor; subclass instance fields not yet initialized |
| 2 | `onConnect()` | async ok | yes | `created`/`disconnected` → `connected` | Per connect; pre-render setup |
| 3 | `beforeRender()` | sync preferred | yes | (no advance) | Returns `=== false` to skip render |
| 4 | `render()` | async ok | yes | (no advance) | Builds template |
| 5 | `onRender()` | async ok | yes | (no advance) | Sync after template applied; no subtree wait |
| 6 | `onRendered()` | async ok | yes | first render: `connected` → `rendered` | Every render, after subtree settles |
| 7 | `onMount()` | async ok | yes | `rendered` → `mounted` | First completed render of connect cycle |
| 8 | `onLive()` | async ok | yes | `mounted` → `live` | First completed render of connect cycle, post-rAF |
| 9 | `onIntersect(isIntersecting)` | async ok | no | (no phase advance) | Bidirectional V1/V2 IO; fires on every intersection state change; updates standalone `isIntersecting` / `isIntersected` flags |
| 10 | `onVisible()` | async ok | no | (no phase advance) | One-shot V2 IO with V1+manual-check fallback; updates standalone `isVisible` flag; ~100ms min delay if V2 |
| 11 | `onDisconnect()` | async ok | yes | any → `disconnected` | Per disconnect; reversible |
| 12 | `onMove(oldParent, newParent)` | async ok | no | (phase preserved) | `Element.moveBefore` reorder; no cleanup, no re-mount |
| 13 | `onDestroy()` | async ok | yes | `disconnected` → `destroyed` | After `destroy()` + cleanup; terminal |

Cross-component coordination uses `whenX` Promises, direct method calls, and `parentComponent` — see "Cross-component coordination" below.

### Cross-component coordination — pure function calls and Promises

The framework's lifecycle works through direct function calls and Promise resolvers; cross-component patterns use the same primitives. **No DOM event dispatch.**

Three primitives cover every cross-component pattern:

1. **Self's lifecycle hooks** (the spine) — your component reaches every phase under its own bottom-up wait chain
2. **`lifecycle.whenX` Promises** — `await someComponent.lifecycle.whenMounted` synchronizes against any other component's lifecycle
3. **`parentComponent` accessor** — direct reference to nearest WebComponent ancestor; method calls and property reads work normally

#### Why no `onParentMount` / `onParentLive`

Both would be sugar over `await parentComponent.lifecycle.whenMounted` / `await parentComponent.lifecycle.whenLive`. Layout is document-wide: when YOUR rAF has fired (`onLive`), the browser has computed layout for everything, including ancestors. Reading `parentComponent.getBoundingClientRect()` in your own `onLive` returns correct values.

Parent instance methods are callable the moment parent is constructed; children don't need to wait for parent's `onMount` to read parent state or call parent methods.

#### Why no `onParentVisible`

IntersectionObserver isn't ordered by tree, AND if you're in the viewport, your parent's bounds intersect the viewport too (under default IO threshold). Self's `onVisible` already implies parent visibility for the common case.

#### Why no `onChildMount` / `onChildDisconnect`

Covered by parent's own hooks plus tree Promises:

- **"All children ready"** → parent's `onMount` / `onLive` already see live children (bottom-up await chain). No notification needed.
- **"All children visible"** → parent awaits `this.whenTreeVisible` (resolves when self + every direct child's tree-visibility resolves). The codebase already composes the tree this way for render via `WebComponent.waitRenderTree`; `whenTreeVisible` is the same pattern lifted to visibility.
- **"React to a specific child mounting"** → enumerate children at parent's `onMount` / `onLive` and read whatever you need; the children are guaranteed live by then.

No child→parent notification API. The parent's lifecycle hooks are when the parent acts; child code stays focused on the child.

#### The dock/active-bar pattern

The dock owns the active bar — so the dock drives positioning from its own hooks:

```js
class Dock extends WebComponent {
  onLive() {
    // Bottom-up chain: every dock-item is live; layout is settled.
    this.updateActiveBar()
  }
  onVisible() {
    // Dock is user-visible; refresh in case anything shifted.
    this.updateActiveBar()
  }
  updateActiveBar() {
    const bar = this.findComponent('active-bar')
    const active = this.findComponent('dock-item', item => item.state.active)
    bar.style.transform = `translateX(${active.getBoundingClientRect().left}px)`
  }
}
```

`onLive` for layout-dependent measurement (children are guaranteed live; document-wide layout pass is done). `onVisible` for visibility-aware refreshes. **No parent-from-child hooks needed.**

#### Patterns that need cross-component coordination

```js
// Wait for all current children to be live before doing setup
async onMount() {
  await Promise.all(this.getComponentsArray('list-item').map(c => c.lifecycle.whenLive))
  this.calibrateLayout()
}

// Wait for the entire subtree to be visible before measuring
async onVisible() {
  await this.whenTreeVisible
  this.alignSubtreePositions()
}
```

All achievable with the three primitives (parent's own hooks + `whenX` Promises + `parentComponent` reads). No events, no extra hooks, no child→parent notification.

### Error hooks

| Hook | Fires when |
|---|---|
| `onLifecycleError(error)` | connect/disconnect path throws; `onVisible` throws |
| `onRenderError(error)` | render-pipeline throws (`render`, `onRender`, `onRendered`, `onMount`, `onLive`) |

## Sync State

State is split into two groups: **phase-derived** (the structural lifecycle ladder) and **standalone flags** (orthogonal observation state).

### Phase-derived state

| Name | Type | Source |
|---|---|---|
| `phase` | string | the ladder value |
| `isConnected` | boolean | **native `Node.isConnected` — reused, never shadowed** |
| `isRendered` | boolean | derived: `atPhase('rendered')` |
| `isMounted` | boolean | derived: `atPhase('mounted')` |
| `isLive` | boolean | derived: `atPhase('live')` |
| `isDisconnected` | boolean | derived: `phase === 'disconnected'` |
| `isDestroyed` | boolean | derived: `phase === 'destroyed'` |

All `is*` in this group (except native `isConnected`) are computed from `phase`. No separate state tracking — cannot get out of sync with the lifecycle.

### Standalone state flags (set by observer callbacks, not by phase)

| Name | Type | Semantics | Set by |
|---|---|---|---|
| `isIntersecting` | boolean | **current** intersection state — toggles with each observer callback | every `onIntersect` callback (V1 or V2 entry's `isIntersecting`) |
| `isIntersected` | boolean | **high-water** — `true` once first true intersection occurs this connect cycle | first `onIntersect(true)` fire; never toggles back during the cycle |
| `isVisible` | boolean | **current** visibility state — toggles with V2 callback (or V1+manual-check fallback) | every observer callback when V2 is in use; `false` if V2 not in use |
| `isRendering` | boolean | active render pipeline indicator (orthogonal) | `true` from start of `beforeRender` to end of `onRendered`; `false` everywhere else |

All four reset to their default (`false` for the booleans) on disconnect.

These are independent of `phase`. A component can be `phase === 'live'` with `isIntersecting === true` (currently in viewport), `isIntersected === true` (was in viewport at some point), and `isVisible === false` (currently behind an overlay, or faded out). Each axis tells you something different at any moment.

Naming convention:
- Present-tense `-ing` (`isIntersecting`, `isRendering`) = current transient state, toggles
- Past-tense `-ed` (`isIntersected`) = high-water-mark, ratchets to `true` and stays until disconnect

`isVisible` is **current** despite the past-participle name, because the V2 observer reports visibility bidirectionally. This is the one place the convention bends — the past-participle word "visible" is the natural English term for the current state, and inventing `isCurrentlyVisible` would be uglier than the convention break. For "was the user ever able to see this component this cycle" use the `whenVisible` Promise (resolves once on first visibility, stays resolved).

### Reading `isVisible` inside `onIntersect`

The intended usage pattern is to read `isVisible` from inside `onIntersect` to make decisions:

```js
onIntersect(isIntersecting) {
  if (!isIntersecting) {
    this.pause()
    return
  }
  if (this.isVisible) {
    this.startUserVisibleWork()       // intersecting AND visible
  } else {
    this.startBackgroundPrep()        // intersecting but not yet visible
  }
}
```

**Important:** `isVisible` only updates when V2 IO is installed, which requires `onVisible` to be **defined** on the component (lazy-install rule — the framework's `if (this.onVisible)` check controls whether V2 is set up). To get live visibility info inside `onIntersect`, **also define `onVisible`** — even as an empty function — to opt into V2:

```js
class MyComp extends WebComponent {
  onIntersect(isIntersecting) {
    if (isIntersecting && this.isVisible) { /* ... */ }
  }
  onVisible() {}  // empty body — opts into V2 IO so isVisible flag updates
}
```

If only `onIntersect` is defined, the framework installs V1 IO and `isVisible` remains `false` permanently (V1 has no visibility data). On browsers without V2 support, defining `onVisible` triggers the V1+manual-check fallback automatically — the user-facing API is the same.

## Promise Properties

| Name | Resolves when | Recreated when |
|---|---|---|
| `whenConnected` | `onConnect` resolves | start of disconnect |
| `whenRendered` | current render's `onRendered` resolves | start of every new render |
| `whenMounted` | first per-connect `onMount` resolves | start of disconnect |
| `whenLive` | first per-connect `onLive` resolves | start of disconnect |
| `whenVisible` | `onVisible` fires (V2 IO) | start of disconnect |
| `whenTreeVisible` | self.`whenVisible` resolves AND every direct child's `whenTreeVisible` resolves (recursive) | start of disconnect |
| `whenDisconnected` | `onDisconnect` resolves | start of every connect |
| `whenDestroyed` | `onDestroy` resolves | never (terminal) |

### Tree-aware Promise semantics

`onVisible` fires independently per component (driven by IntersectionObserver). `whenTreeVisible` composes recursively: a parent's `whenTreeVisible` resolves only when its own `whenVisible` AND every direct child's `whenTreeVisible` resolves.

This gives a bottom-up "entire subtree is visible" signal without making the per-component `onVisible` hook itself bottom-up — which would risk stalling parent forever if a child is hidden via `display:none` or scrolled out.

```js
// Wait for the whole dock subtree to be visible before positioning
await this.whenTreeVisible
this.calibratePositions()
```

If a descendant never reaches the phase, the tree Promise never resolves. Use `Promise.race([this.whenTreeVisible, this.whenDisconnected])` for cancel-safe waiting.

#### Why no `whenTreeMounted` / `whenTreeRendered` / `whenTreeLive`

Spine phases (`mount`, `render`, `live`) already compose bottom-up via the framework's per-phase await chain — a parent's `onMount` awaits every child's `whenMounted` before resolving its own. So `await this.whenMounted` on a parent is **already** "self plus all descendants are mounted." Adding `whenTreeMounted` would be a redundant alias.

`whenTreeVisible` exists because `onVisible` is independent per component (no bottom-up compose) — `parent.whenVisible` resolving doesn't say anything about its children. The tree Promise is the only way to express "subtree is visible."

Rule: **structural Promises (`whenMounted`, `whenRendered`, `whenLive`) are already tree-aware via the await chain. The visibility Promise (`whenVisible`) needs an explicit tree variant.**

### Promise resolution rules

| Scenario | Behavior |
|---|---|
| Phase reached normally | Promise resolves |
| Hook throws | Promise resolves anyway (don't strand awaiters); error routed to `onRenderError` / `onLifecycleError` |
| Disconnect before phase reached | Promise resolves; new pending Promise created for next connect cycle |
| Awaiter checks success | After await, check `atPhase('mounted')` (etc.) — phase tells you what actually happened |

**Pattern:** Promises wake you up; phase tells you what happened.

```js
await comp.lifecycle.whenLive
if (!comp.atPhase('live')) {
  // disconnected or errored before reaching live
  return
}
// safe to interact
```

## Methods

| Name | Purpose |
|---|---|
| `atPhase(target)` | sync: `true` if phase ≥ target on the ladder |
| `nextFrame()` | async: returns Promise resolving on next batched rAF tick |
| `destroy()` | async: removes from DOM, runs disconnect cleanup, fires `onDestroy`, sets phase to `destroyed`. Resolves `whenDestroyed`. |

### `destroy()` semantics

`destroy()` is the explicit-teardown path. Unlike `disconnect` (which is reversible — the instance can be reconnected with state intact), `destroy()` permanently retires the instance.

Sequence when called:
1. If `isConnected`, calls `this.remove()` — triggers native `disconnectedCallback` → framework `onDisconnect` runs → phase becomes `'disconnected'`
2. Awaits `onDisconnect` completion
3. Calls `onDestroy()` — user-defined finalization (release external resources, clear caches not handled by `onDisconnect`)
4. Phase becomes `'destroyed'`
5. Resolves `whenDestroyed`
6. Future operations on the instance are no-ops or warnings

Use `destroy()` when:
- Tearing down a long-lived component permanently (modal/dialog dismissed for good)
- Cleanup of resources `onDisconnect` doesn't reach (server-side state, third-party library handles)
- Test teardown

For temporary removal where you might re-attach later, use plain `remove()` (which fires `onDisconnect` only — phase becomes `disconnected`, instance survives).

## Component Config

A single instance field — `config` — groups runtime tunables that the framework reads. Keeping these under one bucket avoids scattering knobs (`intersectThrottle`, future timing/budget values) across the top-level instance surface, and gives one chokepoint for future locking, dev-mode validation, or proxy-based introspection.

### Shape

Two ways to declare config — pick whichever fits the use case:

**Class-level defaults (`static config`)** — recommended for most components:

```js
class FastPanel extends WebComponent {
  static config = {
    fastLifecycle: true,
    intersectThrottle: 250,
  }
}
```

Set on the class. The base WebComponent constructor copies `this.constructor.config` into `this.config` once during construction, so every instance starts with the class defaults without each one re-allocating its own object. **No subclass constructor needed.**

**Per-instance defaults (`config = {...}` instance field)** — when a subclass needs a fresh object per instance (rare):

```js
class StatefulPanel extends WebComponent {
  config = { intersectThrottle: 250 }
}
```

Instance field initializers run AFTER super construction, so this REPLACES whatever the base copied from `static config`.

### Resolution order

The base constructor builds `this.config` by overlaying sources in this order (later overwrites earlier):

1. **Merged `static config` chain** — every class from `WebComponent` down to the leaf class contributes its own `static config` via `Object.assign`. Walking the static chain means `Mid extends Base extends WebComponent` produces `WebComponent.config + Base.config + Mid.config` merged left-to-right (leaf wins per key). Cached per class via `static ensureMergedConfig()` (mirrors how `state` and `attrs` are merged across the chain in [base.js](base.js))
2. **Subclass instance field `config = {...}`** — if declared, runs after super and replaces `this.config` wholesale (use only when a component genuinely needs a fresh per-instance object; otherwise prefer `static config`)
3. **Constructor-arg `config`** — overlaid last via `Object.assign`, so callers can tweak per-construction

The chain-walk merge means subclasses override only the keys they care about without spreading the parent — every level contributes regardless of how deep the inheritance goes. Equivalent code in the constructor:

```js
Object.assign(this.config, this.constructor.ensureMergedConfig())
if (config) Object.assign(this.config, config)
```

Pick one subclass declaration form — `static config` (recommended) or instance field `config = {...}`. Declaring both works (instance field wins) but is just clutter.

### Read-once contract

Framework reads `this.config?.<key>` at the point the value is consumed — never re-reads. Once baked into the underlying primitive (IntersectionObserver options, scheduler thresholds, etc.), mutation has no effect:

| Key | Default | Read at | Effect of later mutation |
|---|---|---|---|
| `intersectThrottle` | `100` | observer install (after `onLive`) | none — baked into IO `delay` constructor option |
| `fastLifecycle` | `false` | each per-phase child-await gate | takes effect for any gate that hasn't run yet; in-flight phase unaffected |

`intersectThrottle` is read once and baked into the underlying primitive — mutate it, no effect. `fastLifecycle` is a branch re-evaluated at each gate, so toggling it between phases is technically observable, though the supported usage is "set once via field initializer." Treat `config` as initial conditions, not live state.

### `fastLifecycle` — bypass the bottom-up child-await chain

Default behavior: every parent phase (`onRendered`, `onMount`, `onLive`) awaits all direct children's `whenRendered` / `whenMounted` / `whenLive` before invoking the parent's hook (see [Cross-Component Ordering](#cross-component-ordering--bottom-up)). This makes parent state safely depend on children being settled.

Set `config.fastLifecycle = true` on a component to **skip those awaits for this component** — the parent runs its hooks the moment its own structural prerequisites are met, without waiting for descendants. Children still go through their full lifecycle on their own timeline; the parent simply doesn't block on them.

When to use:
- The parent doesn't read child layout, state, or DOM during its own hooks (no `getBoundingClientRect` of children, no `findComponent` calls in onMount/onLive)
- Boot speed matters more than synchronized settling (e.g., independent panels on a dashboard, infinite-scroll items where each item is autonomous)
- The component's `onMount` / `onLive` work is purely self-contained

When NOT to use:
- Layout-coordinating components (the dock/active-bar pattern needs children settled before measuring)
- Anything that calls `findComponent` / `getComponentsArray` and reads the result inside its own hooks
- Tests that assert on subtree state via `await whenLive`

The flag is per-component — it controls whether THIS component awaits its OWN children. It does NOT exempt the component from being awaited by ITS parent (the parent still awaits this child's `whenX` unless the parent also sets `fastLifecycle`).

Affects all three phases together (rendered/mounted/live) — there is no per-phase granularity. If you need to opt out of one but keep another, that's a sign the work belongs in a different hook.

### Lock contract

`config` is a plain object — not frozen, not proxied. Opt-in lock via `static lockConfig = true` triggers `Object.freeze(this.config)` after the last consumption point (observer install), turning post-consumption mutations into loud errors in strict mode. Off by default to keep ergonomics open.

### No reactivity

Not provided. If a component genuinely needs to retune at runtime, the framework will expose targeted methods (`setIntersectThrottle(ms)`, etc.) that rebuild the affected primitive — not a generic reactive `config`. Reactivity here is the wrong abstraction: keys differ in whether they CAN change live, and a reactive wrapper would hide that asymmetry.

### `config` vs `static` class fields

Two buckets, two purposes:

| Bucket | Use for | Examples |
|---|---|---|
| `static foo = …` on the class | Properties of "what this component IS" — fixed per class, never per instance | `static intersectThreshold`, `static visibilityThreshold`, `static styles` |
| `config = { foo: … }` instance field | Per-instance tuning — may legitimately vary across instances, benefits from grouped lock-down | `config.intersectThrottle`, future per-instance budgets |

Rule of thumb: if it would feel wrong to set it differently on two instances of the same component, it's `static`. Otherwise it's `config`.

## Tree Accessors

Use native DOM APIs where they exist. The framework adds:

| Name | Returns |
|---|---|
| `parentComponent` | nearest `WebComponent` ancestor; cached field set during `connectedCallback`, invalidated on disconnect |

The current `handleConnectedCallback` in [base.js](base.js) already computes the parent host inline using `getRootNode().host` / `parentElement` — that exact computation moves to a one-time write into a cached field. Avoiding the walk on every access is critical: components read `parentComponent` frequently in render and lifecycle hooks, and re-walking the parent chain (especially across shadow boundaries via `getRootNode()`) on hot paths is wasteful.

```
On connect:        compute once, store on instance
On move (no disconnect): recompute and update cache
On disconnect:     null out cache
On read:           direct field access — O(1)
```

For walking further than one shadow boundary up, use `this.parentComponent.parentComponent` recursively or `closest(selector)` for tag-targeted walks.

Native APIs reused (never shadowed): `parentNode`, `parentElement`, `getRootNode()`, `closest()`, `matches()`, `children` (HTMLCollection), `assignedSlot`.

For component-tracked children, use existing `liveChildren()` / `getComponents()` / `findComponent()` (already in framework).

## Naming Conventions

Three prefixes, one purpose each:

| Prefix | Purpose | Examples |
|---|---|---|
| `on*` | hooks (user-defined) — verb form | `onMount`, `onLive`, `onConnect` |
| `is*` | sync booleans — past participle / adjective | `isMounted`, `isLive`, `isConnected` |
| `when*` | Promises — past participle | `whenMounted`, `whenLive`, `whenConnected` |

Discoverability: type `comp.is` → see all sync state; `comp.when` → see all Promises; `comp.on` → see all hooks.

No `$` or special characters anywhere in the public API.

## Hook Definition Pattern — undefined by default, internal handlers always run

All `on*` hooks are **undefined by default** on `WebComponent.prototype`. There are no stub method bodies to override. A subclass either defines a hook or doesn't:

```js
class MyComp extends WebComponent {
  // onMount and onVisible are undefined unless I define them
  onMount() {
    // ...
  }
  // onVisible left out — framework will not invoke it, won't install V2 IO
}
```

Detection inside the framework is a simple truthy check:

```js
if (this.onMount) await this.onMount()
```

Not a prototype-comparison dance. No stubs on the prototype, no per-instance memory cost for hooks the user doesn't use, and lazy-install rules (e.g., for IntersectionObserver) trigger straightforwardly off `if (this.onIntersect)` / `if (this.onVisible)`.

### Internal handler pattern

The framework runs **internal handlers** for every phase. The handler invokes the user's hook (if defined) FIRST; if it succeeds, the handler advances phase, resolves the Promise, and updates flags. If the hook throws, the error routes to the appropriate error hook, the Promise still resolves (don't strand awaiters), but **phase does NOT advance** (per Decision #7) — exceptions are `onDisconnect` and `onDestroy`, which advance phase regardless of throw because the element is being torn down anyway.

This pattern matches the existing `handleConnectedCallback` / `handleDisconnectedCallback` in [base.js](base.js) and extends to every spine event.

```js
// Conceptual framework-internal handler for the mount transition
async handleMount() {
  let threw = false
  if (this.onMount) {
    try {
      await this.onMount()
    } catch (error) {
      threw = true
      this.onRenderError(error)   // default body logs to console; user can override
    }
  }
  if (!threw) {
    this.phase = 'mounted'        // phase advances ONLY on success
  }
  this.whenMountedResolver()      // Promise resolves either way (don't strand awaiters)
}
```

For `handleDisconnect` and `handleDestroy`, the order is the same — but phase advances **regardless of throw**, since the element is being torn down anyway:

```js
async handleDisconnect() {
  if (this.onDisconnect) {
    try { await this.onDisconnect() }
    catch (error) { this.onLifecycleError(error) }
  }
  this.phase = 'disconnected'   // advances regardless of throw
  this.whenDisconnectedResolver()
}
```

Two consequences:

1. **Framework state advances correctly under success conditions; under failure conditions phase pauses but Promises still resolve.** The "Promises resolve, phase doesn't advance on error" combination is what lets awaiters wake up and check `atPhase()` to discover what happened.
2. **User-facing hooks stay simple.** They look like ordinary methods. The framework's V1/V2 dispatch, fallback visibility checks, error routing, sequence cancellation, etc. all live in the handler — invisible to the component author.

For visibility specifically, this means the V2-vs-V1+manual-check decision is invisible to the user — they just define `onVisible` and the handler does the right thing on whatever browser they're running on.

### Error hook defaults — exception to undefined-by-default

`onLifecycleError` and `onRenderError` are the **only** hooks with default bodies on `WebComponent.prototype`:

```js
onLifecycleError(error) { console.error(`[${this.localName}] lifecycle error:`, error) }
onRenderError(error)    { console.error(`[${this.localName}] render error:`, error) }
```

Reasoning: errors that go nowhere are catastrophic — silent failures break the developer's mental model. The default `console.error` ensures errors surface even when the user hasn't overridden the hook. Users can override to redirect to telemetry, but the safety net is on by default.

All other `on*` hooks remain undefined-by-default per Decision #21.

## `onInit` Contract

Special hook with strict constraints:

| Property | Value |
|---|---|
| Fires | once per instance, ever — never re-fires on disconnect/reconnect |
| Signature | `onInit(state, config)` — receives constructor args |
| Timing | inside super constructor, after STATE/attrs seeded, before `initState()` arms reactivity |
| `this.STATE` | populated, **not yet reactive** |
| `this.attrs` | populated and reactive |
| `this.shadowRoot` | attached, empty |
| `this.isConnected` | almost certainly `false` |
| Subclass instance fields | **NOT initialized** — known JS gotcha |
| Subclass constructor body | **NOT run yet** — known JS gotcha |
| Awaited? | no — synchronous only; framework does not await it |
| Phase | does not advance phase; phase stays `'created'` |

**Do NOT** in `onInit`:
- Use `await`
- Reference subclass-declared fields
- Access DOM (not connected)
- Trigger renders
- Set up subscriptions that need to survive disconnect (they get torn down)

**DO** in `onInit`:
- Mutate `this.STATE` for subclass-specific defaults (no reactivity yet — no triggers fire)
- Configure `this.attrs`
- Register with global systems (where registration survives disconnect)
- Set up flags the framework will read in subsequent construction steps

## `beforeRender` Gating

`beforeRender` returns `=== false` to skip the current render. Default returns `undefined` → proceed.

| Concern | Behavior on skip |
|---|---|
| `render()` | not called |
| `onRender` / `onRendered` | not called |
| `whenRendered` | resolves anyway (don't strand awaiters) |
| `onMount` / `onLive` (first render of connect cycle) | **deferred** to next non-skipped render |
| `firstRenderDone` flag | stays false until a render completes |
| `whenMounted` / `whenLive` | stay pending |
| Phase | stays at `connected` |

A component connected with all renders gated stays at `phase === 'connected'` until a real render lands.

## Visibility Tracking — `onIntersect` vs `onVisible`

The framework exposes two distinct hooks because "visible" has two meaningful definitions in the browser. Neither advances the phase ladder — both update standalone state flags.

| Hook | Cardinality | Signature | Backed by | Fires when |
|---|---|---|---|---|
| `onIntersect` | bidirectional | `(isIntersecting: boolean)` | V1 IO (default) or V2 IO (when `onVisible` also overridden) | Element's bounds cross the threshold in either direction (entering or leaving viewport) |
| `onVisible` | one-shot per cycle | `()` | V2 IO with `trackVisibility:true, delay:100` (or V1+manual `getComputedStyle` check fallback) | Element is **actually visible to the user** the first time — bounds in viewport AND opacity > 0 AND not occluded AND no hiding transforms |

Per-fire effects:

| Observer callback | State changes |
|---|---|
| First `entry.isIntersecting === true` | `isIntersecting = true`, `isIntersected = true`, `onIntersect(true)` fires |
| Subsequent `entry.isIntersecting === true` | `isIntersecting = true`, `onIntersect(true)` fires |
| `entry.isIntersecting === false` | `isIntersecting = false` (`isIntersected` stays `true`), `onIntersect(false)` fires |
| First `entry.isVisible === true` (V2 only) | `isVisible = true`, `whenVisible` resolves, `onVisible()` fires (one-shot — won't fire again this cycle) |
| Subsequent V2 callback with `entry.isVisible === true` | `isVisible = true` (already), no further hook firing for visibility — but `onIntersect` still fires if intersection state changed |
| V2 callback with `entry.isVisible === false` | `isVisible = false` (toggled), no hook firing for visibility |

`onIntersect` fires bidirectionally on every intersection state change. `onVisible` fires only once per connect cycle (on first true visibility). `isVisible` continues to toggle thereafter as V2 reports updates — but the hook stays one-shot.

### Use cases

| Need | Use |
|---|---|
| Lazy-load images on first scroll-in | `onIntersect`, gate on `isIntersecting === true` and a one-time flag |
| Pause off-screen heavy work (videos, animations) | `onIntersect` — pause when `isIntersecting === false`, resume when `true` |
| Send analytics when user actually sees content | `onVisible` (V2 confirms user-visible) |
| Start an entry animation when component reveals | `onVisible` (waits for opacity/occlusion clear) |
| Trigger CSS transitions that need GPU compositing | `onVisible` (avoids triggering on hidden elements) |
| Position an active-bar based on sibling layout | `onLive` (layout is settled regardless of viewport) |
| "Has this ever been in viewport this connect cycle?" | check `isIntersected` |
| "Is this currently in viewport?" | check `isIntersecting` |
| "Has the user ever actually seen this this connect cycle?" | check `isVisible` |

### Why both — interaction with `preRender`

The current [base.js](base.js) `preRender` static helper mounts a component with `opacity: 0`, waits for the subtree to settle, runs an opacity 0→1 animation, then cleans up. Tracing through the lifecycle:

```
preRender starts:
  element.style.opacity = 0
  document.body.appendChild(element)
    → connectedCallback → onConnect → render → onRender → onRendered
    → onMount  (microtask phase)
    → rAF
    → onLive  (paint-aligned)  ← phase ladder peaks here
    → IO installed (V1, V2, or shared V2 depending on overridden hooks)
    → IO callback fires → onIntersect(true)  ← fires while opacity:0
    → V2 visibility check fails (opacity is 0) → onVisible NOT called yet
preRender continues:
  await element.lifecycle.whenLive  // already done, resolves immediately
  animate opacity 0 → 1
  await animation.finished
    → V2 next callback fires with isVisible=true → onVisible  ← fires when user can actually see it
```

This is exactly the right semantic for both hooks. `onIntersect` fires "the bounds are placed where the user could see them" (useful for lazy-load even when the component is fading in). `onVisible` fires "the user can actually see this now" (useful for triggering analytics, intro animations).

Note that throughout this entire sequence, `phase` stays at `'live'`. The `isIntersecting`, `isIntersected`, and `isVisible` flags update independently — they don't move phase forward.

### Default thresholds and customization

Both hooks default to threshold 0 (any intersection / any visibility). To customize per component:

```js
class MyComp extends WebComponent {
  static intersectThreshold = 0.5      // 50% of bounds in viewport
  static visibilityThreshold = 0.5     // 50% visible (V2)
  config = { intersectThrottle: 250 }  // V2 between-callback throttle (default 100, browser minimum)
}
```

Threshold is `static` (a class-level property of "what this component is"); `intersectThrottle` lives in `config` (a per-instance tunable). See [Component Config](#component-config).

Static threshold config follows **nearest-override semantics** — closest subclass wins (no merging, scalar values). This differs from `static styles`/`state`/`attrs` which merge across the prototype chain.

If a component needs custom IntersectionObserver options beyond threshold (rootMargin, custom root, etc.), override `observeIntersect()` or `observeVisible()` to install the observer manually.

### V2 IntersectionObserver — natural cross-browser fallback

V2 IO with `trackVisibility: true` is supported in Chromium-based browsers (Chrome, Edge). Safari and Firefox don't support it as of writing. The fallback is **natural** — no detection code needed.

The IntersectionObserver constructor on V1-only browsers **silently ignores** unknown options (`trackVisibility`, `delay`). Same constructor call works everywhere; the observer just behaves as V1 on browsers that don't understand V2:

```js
// Same code, both browsers
new IntersectionObserver(cb, {
  threshold: this.constructor.visibilityThreshold ?? 0,
  trackVisibility: true,                          // honored on Chromium, ignored on Safari/Firefox
  delay: this.config?.intersectThrottle ?? 100    // honored on Chromium, ignored on Safari/Firefox
})
```

| Browser | Behavior |
|---|---|
| Chromium (V2) | Native occlusion-aware visibility tracking; `entry.isVisible` populated; 100ms throttle between callbacks |
| Safari / Firefox (V1 only) | V2 options ignored; observer behaves as V1; `entry.isVisible` is `undefined`; no throttle |

The framework's **single visibility handler** branches at runtime on `entry.isVisible !== undefined`:

```js
// What the framework does internally — pseudo-code
handleObserverCallback(entry) {
  // Intersection (works the same on both V1 and V2)
  this.isIntersecting = entry.isIntersecting
  if (entry.isIntersecting && !this.isIntersected) {
    this.isIntersected = true
  }
  if (this.onIntersect) this.onIntersect(entry.isIntersecting)

  // Visibility (V2 native or V1+manual)
  const visibleNow = entry.isVisible !== undefined
    ? entry.isVisible             // V2 native — accurate, occlusion-aware
    : checkManualVisibility(this) // V1 fallback — approximate
  this.isVisible = visibleNow
  if (visibleNow && !this.visibleFired) {
    this.visibleFired = true
    this.whenVisibleResolver()
    if (this.onVisible) {
      try { await this.onVisible() } catch (e) { this.onLifecycleError?.(e) }
    }
  }
}

function checkManualVisibility(el) {
  const cs = getComputedStyle(el)
  return cs.opacity > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
}
```

No module-load detection, no separate fallback observer-install path. One observer construction call, one callback handler, one runtime branch — the V1/V2 difference is a property of the `entry` object, not of the framework setup.

The manual check is approximate — it does not detect occlusion by other elements or transform-based hiding (a real V2 capability that V1 browsers can't replicate without expensive paint-tree walks). Cross-browser apps that genuinely need occlusion-aware detection on Safari/Firefox should install their own custom logic; the framework's V1+manual approximation handles the common 90% (opacity / visibility / display).

### `onVisible` first-fire latency

Important: the 100ms V2 number is a **per-callback throttle between callbacks**, not a delay before the first callback. The first observer callback fires at the same speed on V1 and V2 (~16ms next frame). Since `onVisible` is one-shot and disconnects (or stops firing visibility logic) after first fire, the 100ms throttle never matters for `onVisible`. It only affects `onIntersect` when `onIntersect` is paired with `onVisible` on a V2 browser (shared observer). Components that need fast bidirectional `onIntersect` regardless of browser should not define `onVisible` — that gives them V1 IO with no throttle.

### Shared observer optimization

When both `onIntersect` and `onVisible` are **defined** on the same component, the framework uses **one V2 observer** (not two). V2 entries report both `isIntersecting` and `isVisible` per fire — so a single V2 observer covers both signals.

```
If only onIntersect defined:     install V1 IO (cheap, no 100ms delay)
If onVisible defined (alone or with onIntersect):
   V2 supported   → install V2 IO; if onIntersect also defined, it reads from same entries
   V2 unsupported → install V1 IO + manual visibility check in handler
If neither defined:              no observer at all
```

Lazy installation (no observer if hooks aren't defined on the instance) avoids overhead on components that don't use visibility tracking. The framework checks `if (this.onIntersect)` and `if (this.onVisible)` at observer-install time after `onLive` resolves.

### Simplified `preRender`

With `whenLive` and the V1/V2 split, `preRender` becomes a thin wrapper:

```js
static async preRender(element, mount, options = {}) {
  const duration = options.duration ?? 240
  const easing = options.easing ?? 'cubic-bezier(0.4,0,0.2,1)'
  element.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity'

  if (typeof mount === 'function') mount(element)
  else if (mount instanceof HTMLElement) mount.appendChild(element)

  await element.lifecycle.whenLive   // entire subtree mounted + paint-aligned via bottom-up await chain

  const animation = element.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration, easing }
  )
  await animation.finished
  animation.commitStyles()
  animation.cancel()

  element.style.opacity = ''
  element.style.pointerEvents = ''
  element.style.willChange = ''
  return element
  // onVisible (V2) fires naturally after this, when opacity becomes user-visible.
  // onIntersect (V1) fired earlier, during onLive — even with opacity:0.
}
```

The framework's bottom-up await chain replaces the manual `waitRenderTree`. The lifecycle's single rAF replaces the explicit one in the old `preRender`. The two visibility hooks fire at the right semantic moments without `preRender` needing to know about them.

## Move-Aware Reconnection (`connectedMoveCallback`)

Modern browsers expose `Element.moveBefore()` (and a corresponding `connectedMoveCallback`) for reordering elements without the disconnect/reconnect tear-down. The framework implements `connectedMoveCallback` so that move-style reorders are cheap.

When the browser calls `connectedMoveCallback`:

- **No `onDisconnect` runs** — subscriptions, timers, observers all stay armed
- **No `onConnect` re-runs** — phase doesn't rewind
- **Phase preserved** — if you were at `'visible'`, you stay at `'visible'`
- **`parentComponent` cache recomputed** — new parent (via existing `getRootNode().host` / `parentElement` walk)
- **Parent-child registration moved** — framework calls `unregisterFromParent` (the cleanup function returned by old parent's `registerChild`), then calls `registerChild(newParent, this)` for the new parent. Updates `unregisterFromParent` to point to the new cleanup
- **`onMove(oldParent, newParent)` fires** — async ok, **not awaited** by the framework (move is a user-driven reorder, no lifecycle ordering depends on it); receives both old and new parent host (or `null` if either was non-WebComponent)
- **Children's lifecycles unaffected** — the move is a single subtree relocation, not a per-element teardown

This is a real perf win for list reordering, drag-and-drop, virtualized lists, etc. Components reordered via `moveBefore` keep their state, observers, and DOM identity without paying for full mount/unmount cycles.

If the host browser doesn't support `connectedMoveCallback` (it's a newer addition), `moveBefore` falls back to `disconnectedCallback` + `connectedCallback`, and the framework runs the full disconnect/reconnect path. Component code shouldn't depend on move-preservation; it's an optimization, not a contract.

```js
class ListItem extends WebComponent {
  onMove(oldParent, newParent) {
    // optional: react to being moved (e.g., notify analytics, update derived position state)
  }
}
```

## Cross-Component Ordering — Bottom-Up

Within a single component, the spine is sequential. Across components, ordering is enforced by what each phase awaits:

| Phase | Awaits across the tree |
|---|---|
| `onRendered` | every direct child's `whenRendered` |
| `onMount` | every direct child's `whenMounted` |
| `onLive` | every direct child's `whenLive` |

Result: leaves complete each phase before parents do. Bottom-up at every layer of the spine. Per-level rAF cost is one frame, not N (siblings share frame ticks — see rAF Policy).

Components can opt out of waiting for their own children via `config.fastLifecycle = true` — the parent still goes through every phase, but skips the per-phase await on its descendants. See [`fastLifecycle`](#fastlifecycle--bypass-the-bottom-up-child-await-chain) for the trade-offs.

## Render Pipeline Mechanics

### `render()` contract

```
async render() { /* user implementation */ }
```

- **Always async.** The framework `await`s the return value unconditionally — synchronous user implementations are fine (an async function with no `await` resolves to a microtask), but the contract is async-shaped so the pipeline can interleave dep tracking, sequence checks, and downstream hooks around it.
- **Side-effect only — no return value.** `render()` mutates the shadow tree (via the framework's template helpers — `this.html`, `this.htmlElement`, or direct `shadowRoot` writes). The framework ignores any returned value. There is no virtual DOM, no diff function, no template literal returned to a renderer.
- **Dependency tracking is on for the duration of `render()`.** Reads of `this.state` during the call go through the render proxy and are recorded as dependencies; the framework subscribes to those keys after `render()` resolves so that future mutations re-run `render()` automatically. Reads outside `render()` (in `onConnect`, `onMount`, etc.) do NOT auto-track. To trigger re-render from outside, mutate `this.state` (which fires the dep) or call `this.invalidateRender()` directly.
- **Spot-level tracking via function interpolations.** A `${fn}` interpolation is invoked with `this` bound to the component inside its own `track()` scope, so reads inside that function become deps of *that spot* rather than of the whole component. Mutating a key that only one spot depends on patches just that spot. Bare value interpolations (`${this.state.count}`) read at render-scope and re-render the whole component on change. Use bare method references for no-arg cases (`${this.buildMarkup}` — already a function), and arrow-wrap getters / properties / expressions (`${() => this.hostClass}`, `${() => this.state.count + 1}`).
- **Cancellation-safe at await boundaries.** If state mutates while `render()` is suspended at an `await`, `renderSeq` increments and the in-flight render aborts cleanly when control returns. The user-defined `render()` can `await` freely — long awaits don't break correctness, they just mean the rendered output may be replaced by a later render.
- **No DOM contract beyond shadow tree.** `render()` should not mutate light-DOM children of the host, fire DOM events, or trigger reflow on other components. Framework-generated children inside the shadow tree manage their own lifecycles via their own `connectedCallback`.

### Sequence-based render cancellation

Every render is tagged with a sequence number (`renderSeq`). When state mutates during an in-flight render, a new render is queued and `renderSeq` increments. The in-flight render checks the sequence at every async boundary:

- After `await beforeRender()` completes
- After `await render()` completes
- Before invoking `onRender` / `onRendered` / mount-pipeline transitions

If the sequence has changed, the in-flight render aborts cleanly. The stale render's `whenRendered` resolves anyway (don't strand awaiters); the new render proceeds and its `whenRendered` resolves on completion.

`whenRendered` resolves only when the **latest** render completes — superseded renders don't trigger resolution of subsequent Promises.

### Render batching

State mutations are batched via the framework's microtask scheduler. Multiple mutations in the same task produce one render, not many:

```js
this.state.x = 1
this.state.y = 2
this.state.z = 3
// Microtask runs one render that observes all three changes
```

The scheduler is internal; users don't interact with it directly. Awaiting `whenRendered` after mutations gives you the next render's resolution.

## rAF Policy

`requestAnimationFrame` is used sparingly and intentionally. It is **not** a generic "wait a tick" mechanism — it has specific semantic meaning (pre-paint barrier) and a 16ms cost on 60Hz displays. Misusing it adds latency without benefit.

### Where rAF is used in the lifecycle

Exactly **one** rAF transition per lifecycle: between `onMount` and `onLive`. It serves three purposes simultaneously:

1. **Paint barrier** — give the browser a frame to compute layout from the rendered template before user code reads layout in `onLive`
2. **Animation kickoff alignment** — animations started in `onLive` begin at a paint boundary, so they're visually synchronized
3. **CSS transition commit** — class changes (e.g., removing `mounting`) applied during this rAF tick will animate cleanly

No other phase uses rAF. `onMount` runs at microtask granularity (no frame wait); `onRendered` runs at microtask granularity (no frame wait); `onVisible` is gated by IntersectionObserver, not rAF.

### Batched scheduling — one rAF per frame, not one per component

A naive implementation calls `requestAnimationFrame` once per component transitioning to `onLive`. For a tree of N components mounting in the same frame, that's N rAF callbacks, each with scheduling and call overhead.

Instead, the framework runs a **shared rAF queue**: any component needing the next-frame barrier registers a callback in a singleton queue. The framework schedules ONE rAF; when it fires, all queued callbacks run in registration order (which is bottom-up because of the cross-component await chain).

```js
// Internal scheduler (conceptual)
let queue = []
let scheduled = false

function nextFrame() {
  return new Promise(resolve => {
    queue.push(resolve)
    if (!scheduled) {
      scheduled = true
      requestAnimationFrame(() => {
        const callbacks = queue
        queue = []
        scheduled = false
        for (let i = 0; i < callbacks.length; i++) callbacks[i]()
      })
    }
  })
}
```

Performance characteristics:

- **N components, same frame:** 1 rAF callback fires N resolves; total cost is O(N) with one scheduling overhead
- **N components, different frames:** 1 rAF per frame (always batched within a frame)
- **Memory:** a single queue array; cleared each frame
- **Ordering:** registration order, which matches bottom-up tree order due to spine awaits

This is significantly cheaper than per-component rAFs for trees of any meaningful depth/breadth.

### Public utility

```js
WebComponent.nextFrame()   // static — returns Promise resolving on next batched frame
this.nextFrame()            // instance — same, sugar
```

Use cases for user code:

- Reading layout after a state change: `state.x = newValue; await this.nextFrame(); const rect = el.getBoundingClientRect()`
- Starting an animation that should align with paint: `el.classList.add('show'); await this.nextFrame(); el.animate(...)`
- Coordinating multi-step transitions across components

Avoid using `requestAnimationFrame` directly in component code; route through `nextFrame()` so transitions stay batched with framework lifecycle work.

### When rAF is the right tool

| Use case | Use rAF? | Why |
|---|---|---|
| Wait for layout commit before measuring | Yes | rAF runs after layout/style recalc for the frame |
| Start an animation that should be paint-aligned | Yes | rAF aligns with paint timing |
| Apply a CSS transition after a class change | Yes | Lets the browser register the class before transitioning |
| Ensure GPU compositing kicks in for `will-change` | Yes | One frame for the compositor to set up |
| Generic "wait until DOM is ready" | **No** | Use Promise/microtask; rAF wastes 16ms |
| Settling reactive state changes | **No** | Use the framework's scheduler (microtask-based) |
| Throttling scroll/resize handlers | Maybe | Per-frame throttling is reasonable; for app logic prefer specific debounce |
| Polling for a condition | **No** | Use MutationObserver / IntersectionObserver / explicit signals |
| Per-frame animation loop | Yes | Classic rAF use case (but not lifecycle-related) |

### When rAF is the wrong tool

- **Anything microtask-fast.** Promises and `queueMicrotask` resolve in the same task; rAF waits for the next frame. If you don't need a paint cycle, don't pay for one.
- **Settling state changes.** The framework has its own scheduler for batching state updates; using rAF on top adds latency.
- **Sequencing async work.** rAF is for paint coordination, not promise sequencing.
- **Polling.** If you're using rAF as a poll loop, restructure around an event source (observers, explicit signals).

### Double rAF (post-paint) — opt-in only

Single rAF fires **before** paint. To wait until **after** the browser has actually painted, you need either:

- A double rAF: `await nextFrame(); await nextFrame()` (the second resolves after paint)
- A `MessageChannel` post-paint trick
- The View Transitions API for transitions specifically

The framework does **not** double-rAF in the spine. If a component genuinely needs post-paint timing (rare — most "after paint" desires are actually "after layout"), it can chain two `nextFrame()` calls explicitly. Don't bake double-rAF into common paths; it doubles latency for marginal benefit.

### Why not use `scheduler.postTask`?

Modern browsers expose `scheduler.postTask({priority})` for prioritized work. It's appropriate for **non-paint-aligned** background work. For lifecycle paint barriers, rAF is the correct primitive — it's the only signal tied to the rendering pipeline. We may use `scheduler.postTask` later for non-critical post-mount work (analytics, prefetching), but never as a substitute for the `onMount → onLive` barrier.

## Error Semantics

| Hook throws | Phase | Promise | Error routed to |
|---|---|---|---|
| `onConnect` | stays `created` | `whenConnected` resolves anyway | `onLifecycleError` |
| `beforeRender` | stays | `whenRendered` resolves; treated as render skip | `onRenderError` |
| `render` / `onRender` / `onRendered` | stays | `whenRendered` resolves | `onRenderError` |
| `onMount` | stays `rendered` | `whenMounted` resolves; **`onLive` STILL fires** (independent) | `onRenderError` |
| `onLive` | stays `mounted` | `whenLive` resolves; **observer install still proceeds** — observation is independent of `onLive` success | `onRenderError` |
| `onIntersect` | n/a (no phase advance) | state flags updated regardless of throw | `onLifecycleError` |
| `onVisible` | n/a (no phase advance) | `whenVisible` resolves anyway; `isVisible` set regardless of throw | `onLifecycleError` |
| `onMove` | n/a (phase preserved) | n/a | `onLifecycleError` |
| `onDisconnect` | advances to `disconnected` anyway | `whenDisconnected` resolves | `onLifecycleError` |
| `onDestroy` | advances to `destroyed` anyway | `whenDestroyed` resolves | `onLifecycleError` |

`onMount` failure does not block `onLive` — they are independent. `onDisconnect` and `onDestroy` are the only hooks where a throw still advances phase (the element is being torn down regardless).

## Mid-Flight Disconnection

| Disconnected during | Behavior |
|---|---|
| `onConnect` | finish (awaited by `pendingConnect`); pipeline doesn't proceed |
| `beforeRender` / `render` | finish; post-await `isConnected` check fails; no `onRender` |
| `onRender` / `onRendered` | finish; chain stops; no `onMount` |
| Awaiting children's `whenRendered` | still awaits; post-await `isConnected` check fails; no `onMount` |
| rAF wait before `onLive` | rAF fires, `isConnected` check fails, no `onLive` |
| `onMount` / `onLive` running | finish; `phase` advances; but `onIntersect` / `onVisible` never fire |
| `onDisconnect` running | runs to completion via `pendingConnect` await |

**Rule:** never abort an in-flight async hook mid-call; always check `isConnected` between hooks.

## Disconnect Reset

On `disconnectedCallback`:

- `phase` → `'disconnected'`
- `firstRenderDone = false`
- `templateBuilt = false`
- All Promises (`whenConnected`, `whenMounted`, `whenLive`, `whenVisible`, `whenTreeVisible`) recreated as new pending
- `whenDisconnected` resolves (then recreated for next connect)
- Subscriptions cleared: timeouts, intervals, state subs, attr observers, global subs, delegates, render-deps, event listeners
- Template cleaned up
- IntersectionObserver (V1, V2, or shared V2 — whichever was installed) disconnected
- Standalone observation flags reset: `isIntersecting = false`, `isIntersected = false`, `isVisible = false`
- Style map preserved (compiled styles cached on class)
- `parentComponent` cache invalidated
- `STATE` preserved (not cleared) — instance survives reconnect with state intact

Reconnect replays the full spine from `onConnect` onward. `onInit` does NOT re-run (instance-scoped, not connect-scoped).

### Reactivity re-arm contract

**All subscriptions belong in per-connect hooks (`onConnect`, `onMount`).** They're torn down on disconnect and re-armed on each reconnect.

Don't subscribe in `onInit` — those subscriptions get cleared on disconnect and won't re-create. Instance-scoped state in `onInit` should be limited to data that doesn't depend on lifecycle subscriptions.

| Subscription type | Where to set up |
|---|---|
| `observe(state-key, cb)` | `onConnect` or `onMount` |
| `observeGlobal(global-key, cb)` | `onConnect` |
| `observeAttr(attr, cb)` | `onConnect` |
| `delegate(channel, cb)` | `onConnect` |
| `addEventListener(...)` on window/document | `onConnect`, with cleanup in `onDisconnect` (or use framework helpers that auto-clean) |
| Timer (`setTimeout` / `setInterval`) | `onConnect` or later (auto-cleared on disconnect via framework) |

## Promise Lifecycle Summary

```
constructor:
  whenConnected     = new pending
  whenRendered      = new pending
  whenMounted       = new pending
  whenLive          = new pending
  whenVisible       = new pending
  whenTreeVisible   = new pending (lazy-computed at first access)
  whenDisconnected  = new pending
  whenDestroyed     = new pending  (terminal — never recreated)

connect:
  whenConnected resolves after onConnect
  whenRendered resolves after first onRendered
  whenMounted resolves after first onMount
  whenLive resolves after first onLive
  whenVisible resolves on first true visibility (V2 native or V1+manual fallback)
  whenTreeVisible resolves after self.whenVisible AND every direct child's whenTreeVisible
  (whenDisconnected stays pending)
  (whenDestroyed stays pending)

each subsequent render:
  whenRendered = new pending → resolves after onRendered

disconnect:
  whenDisconnected resolves
  whenConnected, whenMounted, whenLive, whenVisible, whenTreeVisible recreated as new pending
  whenDisconnected recreated as new pending
  (whenDestroyed unchanged — never recreated)

destroy (after disconnect cleanup):
  whenDestroyed resolves
  (no further state changes; instance is terminal)
```

## What Developers Can Trust at Each Phase

When `onMount` runs:
1. `shadowRoot` has the rendered template; `shadowRoot.children` populated
2. `isConnected === true`
3. Light DOM children (`this.children`, slotted content) are present if assigned by the host's parent
4. All direct child WebComponents have `isMounted === true`
5. `parentNode` chain reaches a connected document
6. `observe()` subscriptions wired up

When `onLive` runs (additionally):
7. Browser has had a frame to lay out and (likely) paint
8. `getBoundingClientRect()` returns correct dimensions
9. `this.animate(...)` will run on GPU compositor
10. All direct children have `isLive === true`

`onLive` is the highest structural-phase guarantee. Beyond `onLive`, observation hooks (`onIntersect` / `onVisible`) update standalone state but do not advance phase.

When `onIntersect(isIntersecting)` fires:
- `phase` is at `'live'` (not advanced)
- If `isIntersecting === true`: bounds are in viewport at configured threshold; `isIntersecting` is now `true`; if first fire, `isIntersected` is now `true` (high-water flag — no Promise)
- If `isIntersecting === false`: bounds left viewport; `isIntersecting` is now `false`; `isIntersected` stays `true` (high-water-mark)
- The element may still be opacity:0, occluded, or in a hiding transform — intersection ≠ user-visibility

When `onVisible` fires:
- `phase` is at `'live'` (not advanced)
- Element is **actually visible to the user** — bounds in viewport AND opacity > 0 AND not occluded AND no hiding transform (V2 with `trackVisibility`, or V1+manual `getComputedStyle` check on browsers without V2)
- `isVisible` is now `true` and `whenVisible` has resolved
- One-shot — observer is disconnected; will not fire again this connect cycle

Each phase's guarantees are a strict superset of the prior phase's. Observation flags compose orthogonally — read them in addition to checking `phase`.

**Note on children:**
- `this.children` (HTMLCollection) = light DOM children of the host element (slotted content from outside the shadow boundary)
- `this.shadowRoot.children` = the rendered template (created by the component itself)

These have different lifecycles. The rendered template (shadow) is populated during render. Light DOM children depend on what the host's parent placed there.

## Patterns Unlocked

```js
// 1. App-ready
await app.lifecycle.whenMounted

// 2. Parallel orchestration
await Promise.all([sidebar.lifecycle.whenLive, content.lifecycle.whenLive, footer.lifecycle.whenLive])

// 3. Race conditions
const winner = await Promise.race([modal.lifecycle.whenVisible, modal.lifecycle.whenDisconnected])

// 4. Test instrumentation
const comp = document.createElement('my-comp')
document.body.appendChild(comp)
await comp.lifecycle.whenLive
expect(comp.shadowRoot.querySelector('.ready')).toBeTruthy()

// 5. Parent coordinates child-dependent setup using its OWN hooks.
//    The bottom-up await chain guarantees every child is live when parent's
//    onLive fires; whenTreeVisible (already used internally via waitRenderTree)
//    composes the visibility version. No child-to-parent notification needed.
class Dock extends WebComponent {
  onLive() {
    this.updateActiveBar()                 // layout settled; children are live
  }
  onVisible() {
    this.updateActiveBar()                 // re-position when dock is user-visible
  }
  updateActiveBar() {
    const bar = this.findComponent('active-bar')
    const active = this.findComponent('dock-item', item => item.state.active)
    bar.style.transform = `translateX(${active.getBoundingClientRect().left}px)`
  }
}

// 6. Sequential boot
await app.lifecycle.whenConnected
await loadCriticalAssets()
await app.lifecycle.whenLive
trackInitialView()

// 7. Disconnect-aware wait
await Promise.race([comp.lifecycle.whenVisible, comp.lifecycle.whenDisconnected])
if (comp.isVisible) startEntryAnimation()

// 8. Wait for the entire subtree to be visible before measuring
await this.whenTreeVisible
this.calibratePositions()
```

## Decisions Locked

1. Structural spine: `constructor → onInit → onConnect → beforeRender → render → onRender → onRendered → onMount → onLive`, with `onDisconnect`, `onMove`, and `onDestroy` as the exit/transition paths. `onIntersect` and `onVisible` are observer-driven — fire after `onLive` but do NOT advance phase
2. `onInit` is sync-only, fires inside super constructor at Option C placement (after STATE/attrs seed, before reactivity)
3. Phase ladder: `created → connected → rendered → mounted → live`, with `disconnected` (reversible) and `destroyed` (terminal) as exit phases. **No `intersected` or `visible` in phase** — those are standalone state flags. Phase-derived `is*` getters cover only the structural ladder
4. `beforeRender` gates render via `=== false` return
5. Eight Promise contracts: `whenConnected`, `whenRendered`, `whenMounted`, `whenLive`, `whenVisible`, `whenTreeVisible`, `whenDisconnected`, `whenDestroyed`. Intersection has no Promise — `onIntersect` is fire-and-forget bidirectional, with `isIntersecting` (current) / `isIntersected` (high-water) flags for sync queries
6. Promises resolve on disconnect mid-flight (don't strand awaiters); recreated for next cycle. `whenDestroyed` is terminal — never recreated
7. Hooks throw → routed to error hook; phase doesn't advance EXCEPT `onDisconnect` and `onDestroy` (advance anyway); Promises always resolve
8. Cross-component ordering enforced via per-phase Promise chains (bottom-up): `onRendered` → child `whenRendered`, `onMount` → child `whenMounted`, `onLive` → child `whenLive`. `whenTreeVisible` is recursive: self.`whenVisible` AND every direct child's `whenTreeVisible`. Per-component opt-out via `config.fastLifecycle = true` — parent skips child-await for all three structural phases (children still mount independently; parent simply doesn't block on them). All-or-nothing: no per-phase granularity
9. `onMount` fires per-connect cycle (not per-instance); `onInit` is the only per-instance hook
10. Mount/render coupling is strict: no mount without render; `beforeRender === false` defers `onMount` indefinitely
11. IntersectionObserver(s) installed only after `onLive` — neither `onIntersect` nor `onVisible` can fire before `onLive`. Lazy-install matrix (truthy-check on `this.onX`): no observer if neither hook defined; V1 IO if only `onIntersect`; V2 IO (with V1+manual-check fallback when V2 unsupported) if `onVisible` is defined; **single shared V2 IO** when both defined — V2 entries report `isIntersecting` AND `isVisible` per fire, so one observer drives both hooks. `onIntersect` is bidirectional with `(isIntersecting)` parameter; `onVisible` is one-shot per cycle (fires only on first true visibility). Neither advances phase — both update standalone state flags (`isIntersecting` toggles, `isIntersected` ratchets, `isVisible` toggles). `isVisible` only updates when V2 IO is in use — to read current visibility inside `onIntersect`, also define `onVisible` (even as an empty function) to opt into V2. V2 fallback is **transparent** to component code: framework's internal visibility handler dispatches V2 or V1+manual-check based on browser support. The 100ms V2 delay is a per-callback rate limit, not a setup cost; cannot be pre-warmed. For zero-delay intersection, define only `onIntersect` (V1 has no delay)
12. Naming: `on*` hooks, `is*` sync, `when*` Promises; past participles for state names; native `isConnected` reused; no `$` or special characters
13. **No DOM events dispatched by the framework.** Lifecycle uses pure function calls and Promise resolvers. If a future internal event system is added, it must be lightweight (per-component listener map), not standard DOM event flow
14. **No dedicated cross-component hooks.** Coordination via Promises, `parentComponent` accessor, and parent's own lifecycle hooks (which see live children via the bottom-up chain)
15. rAF used **only** at `onMount → onLive` barrier; batched through shared `nextFrame()` queue (one rAF per frame regardless of component count)
16. Subscriptions belong in per-connect hooks (`onConnect`, `onMount`); torn down on disconnect, re-armed on reconnect. Instance-scoped state in `onInit` cannot rely on subscriptions surviving disconnect
17. `parentComponent` is a cached field set during `connectedCallback` (using existing `getRootNode().host`/`parentElement` walk pattern), invalidated on disconnect, recomputed on `connectedMoveCallback`. O(1) read access — never re-walk on every read
18. `isRendering` is true from start of `beforeRender` to end of `onRendered`; false everywhere else
19. `connectedMoveCallback` implemented for `Element.moveBefore()` reorders — no disconnect/reconnect tear-down, phase preserved, optional `onMove(oldParent, newParent)` hook fires
20. `destroy()` method as explicit-teardown path: triggers disconnect, then `onDestroy`, then phase = `'destroyed'`. Terminal — instance does not participate in further lifecycle
21. **All `on*` spine hooks are undefined by default on `WebComponent.prototype`** — no stub method bodies. Detection inside the framework is a truthy check (`if (this.onMount)`), not a prototype-comparison. **Exception: `onLifecycleError` and `onRenderError` keep default `console.error` bodies** so unhandled errors always surface; users override them to redirect to telemetry. Internal `handleX` handlers run user hook FIRST (if defined); on success advance phase, resolve Promise, update flags; on throw route error through `onLifecycleError` / `onRenderError`, resolve Promise anyway, do NOT advance phase (except `onDisconnect` / `onDestroy`, which advance regardless). This matches the existing `handleConnectedCallback` / `handleDisconnectedCallback` style in `base.js` and extends to every spine event
22. V2 IntersectionObserver fallback is **natural** — V1-only browsers (Safari, Firefox) silently ignore the V2 options (`trackVisibility`, `delay`) at constructor time, so the same `new IntersectionObserver(cb, options)` call works everywhere. Cross-browser branching is a single runtime check inside the callback (`entry.isVisible !== undefined`); on V2 browsers, use the native value; on V1 browsers, fall back to a manual `getComputedStyle` check. No setup-time browser detection. Manual check is approximate (no occlusion or transform-hiding detection — those are V2-only capabilities)
23. Runtime tunables live under a single `config` object on the component (e.g., `config.intersectThrottle`, `config.fastLifecycle`); per-class scalar tunables stay as `static` fields outside `config` (e.g., `static intersectThreshold`). Resolution order at construction (later overlays earlier): (1) **merged `static config` across the entire class chain** — every class from `WebComponent` down to the leaf contributes via `Object.assign`, cached by `static ensureMergedConfig()` (mirrors `ensureMergedState` / `ensureMergedAttrs`); (2) subclass instance-field `config = {...}` if declared (replaces wholesale); (3) constructor-arg `config` overlaid last. The chain-walk merge handles arbitrary inheritance depth — subclasses override only the keys they care about without spreading the parent. Most keys are read once and baked into primitives (mutation is a no-op); `fastLifecycle` is the exception — re-read at each per-phase gate. `Object.freeze` lock via opt-in `static lockConfig = true`. No reactivity layer

## Implementation Notes (when ready to code)

- `beforeRender` skip path must not advance `firstRenderDone`
- `whenX` Promise recreation must happen at the START of disconnect, before subscribers are cleared
- `parentComponent` cache: write once during `connectedCallback` (move the existing `const parentHost = ...getRootNode()...` computation into a field assignment), null on `disconnectedCallback`, recompute on `connectedMoveCallback`. Reads are direct field access
- Child registration with parent runs **inside `handleConnectedCallback`, immediately after `parentComponent` is computed and BEFORE `applyStyles` / `onConnect` / render** (matches the existing `registerChild(parentHost, this)` placement in [base.js](base.js)). The unregister thunk is stored on `this.unregisterFromParent` and invoked on disconnect. Timing is critical: the child must be in the parent's `liveChildren` list before the parent reaches its mount/render phases, since the parent's bottom-up await chain (`Promise.all(allChildren(this).map(...))`) reads from that list. Children connect after parent's render places them in the tree, so the order is: parent renders DOM → children's `connectedCallback` fires → children register → parent reaches mount stage and awaits children's `whenMounted`. No user action required; registration is fully internal
- Phase transitions are atomic: advance phase → resolve corresponding `whenX` Promise. Both happen synchronously within the framework's transition code; awaiters of `whenX` resolve in the next microtask
- `atPhase('disconnected')` and `atPhase('destroyed')` return `false` — both break the implication chain
- The `nextFrame()` scheduler is a module-level singleton — one queue array, one boolean `scheduled` flag, one `requestAnimationFrame` registration per frame. Recreate queue array on each flush (don't reuse — would race with new pushes during callback execution)
- `renderSeq` cancellation: at every async boundary in the render pipeline, check if sequence has incremented. If yes, abort and resolve the stale `whenRendered` (don't strand awaiters); the new render proceeds
- When a component reconnects, its parent's phase may already be past the points the child cares about. Children that need to react to parent's already-completed phases should `await parentComponent.whenMounted` / `whenLive` etc. — these resolve immediately if the phase is already reached
- `onLive` / `onIntersect` / `onVisible` errors are independent of prior hooks: `onMount` failure does not skip `onLive`
- Fire-and-forget hooks (`onIntersect`, `onVisible`, `onMove`) wrap their invocation in try/catch routed to `onLifecycleError`; framework lifecycle does not block on them
- `whenTreeVisible` implementation: getter that lazily computes the recursive Promise (`Promise.all([this.whenVisible, ...allChildren(this).map(c => c.whenTreeVisible)])`) at first access; cache the resulting Promise per connect cycle; recreate at disconnect
- Hooks are detected via truthy check (`if (this.onMount)`), NOT via prototype comparison. There are no stub method bodies on `WebComponent.prototype`. Override-detection is just `Boolean(this.onX)`
- Internal handlers always run (e.g., `handleMount`, `handleObserverCallback`); they do framework-state work first, then call `this.onX()` if defined. Errors from user hooks are caught and routed to `onRenderError` / `onLifecycleError` (if defined)
- Single observer field on instance: `this.intersectObserver` holds whichever observer was installed. One observer per component, never two
- Lazy install matrix (decided after `onLive` resolves, based on truthy-check):
  - neither `this.onIntersect` nor `this.onVisible` defined → no observer installed
  - only `this.onIntersect` defined → V1 IO: `new IntersectionObserver(cb, { threshold: this.constructor.intersectThreshold ?? 0 })`. No `trackVisibility`, no throttle.
  - `this.onVisible` defined (with or without `onIntersect`) → V2 IO options: `new IntersectionObserver(cb, { threshold: this.constructor.visibilityThreshold ?? 0, trackVisibility: true, delay: this.config?.intersectThrottle ?? 100 })`. Browser uses V2 if supported, ignores V2 options and behaves as V1 if not. **No setup-time detection needed.**
- Cross-browser fallback is RUNTIME, not setup-time: in the callback handler, check `entry.isVisible !== undefined` to know if V2 is active. If `undefined`, use manual `getComputedStyle` check. One callback handler, one conditional, no separate code paths
- Manual visibility check: `const cs = getComputedStyle(this); cs.opacity > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'`. Approximate — does not detect occlusion or transform-based hiding (V2-only on supporting browsers)
- Observer callback (`handleObserverCallback`): on every callback,
  - update `this.isIntersecting = entry.isIntersecting`
  - if first true-intersect: `this.isIntersected = true` (no Promise to resolve — `onIntersect` is fire-and-forget)
  - if `this.onIntersect` defined: call `this.onIntersect(entry.isIntersecting)`
  - derive current visibility: `const visibleNow = entry.isVisible !== undefined ? entry.isVisible : manualCheck(this)`
  - set `this.isVisible = visibleNow`
  - on first true visibility this cycle: `visibleFired = true`, resolve `whenVisible`, call `this.onVisible()` if defined
  - subsequent callbacks update `this.isVisible` but skip hook/Promise (one-shot for the hook; continuous flag)
  - observer stays connected (bidirectional `onIntersect` keeps firing)
- 100ms V2 throttle is per-callback rate limit, not a setup latency. First callback fires at V1 speed (~16ms next frame). Throttle only matters for subsequent callbacks of the same observer on V2 browsers. Affects `onIntersect` when paired with `onVisible` on Chromium; users who need fast bidirectional `onIntersect` should leave `onVisible` undefined (gets V1 IO with no throttle)
- Reset on disconnect: `isIntersecting = false`, `isIntersected = false`, `isVisible = false`, `visibleFired = false`. Disconnect observer. Recreate `whenVisible` Promise
- `connectedMoveCallback` implementation: do nothing other than recompute `parentComponent` cache and fire `onMove` (try/catch); skip ALL the disconnect/reconnect path (no subscription teardown, no phase reset, no `firstRenderDone` reset)
- `destroy()` implementation: set an internal `pendingDestroy` flag. **If `this.isConnected`**: call `this.remove()` (triggers `disconnectedCallback` → `onDisconnect`); await `onDisconnect` to resolve. **If already disconnected**: skip the remove step (no disconnect needed). Then run `onDestroy`, set `phase = 'destroyed'`, resolve `whenDestroyed`. The `pendingDestroy` flag distinguishes destroy-driven disconnect from a normal disconnect that won't be followed by destroy
- Observer install (`onIntersect` / `onVisible`) is gated on **completing the structural spine through the `live` step, not on `onLive` returning successfully**. If `onLive` throws, phase stays at `mounted` per Decision #7, but the observer install proceeds anyway — observation is independent of `onLive` correctness, and lazy-load shouldn't break because of an unrelated error in user `onLive` code. Implementation: install observer in `handleLive` AFTER the user-hook try/catch block, regardless of whether the hook threw
- `pendingConnect` is an internal field holding the full connect-chain Promise (the result of `handleConnectedCallback`). `handleDisconnect` awaits it so subscriptions and observers aren't torn down mid-render. Distinct from the public `whenConnected` Promise: `whenConnected` resolves when `onConnect` itself resolves (a structural milestone); `pendingConnect` resolves only when the entire connect chain (onConnect → render → mount → live) settles. `pendingConnect` is internal-only; user code never reads it
- `fastLifecycle` branch in each of `handleRendered`, `handleMount`, `handleLive`: gate the bottom-up await on `this.config?.fastLifecycle !== true`. Pseudo-code: `if (!this.config?.fastLifecycle) await Promise.all(allChildren(this).map(c => c.whenX))`. Read `config.fastLifecycle` at every gate — it's a branch, not a value baked into a primitive — so a subclass setting it via field initializer takes effect by the time any phase runs. Children's lifecycle is unaffected (they still register, mount, and resolve their own `whenX` on their normal timeline); only the parent's per-phase wait is skipped
- `whenDestroyed` is the only Promise that's never recreated — it resolves once and stays resolved. The instance is dead after that
