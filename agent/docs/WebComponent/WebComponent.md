# WebComponent

## Intent

`WebComponent` is a reactive, app-scale base class built on native Custom Elements.

It keeps standards-based Web Component strengths (encapsulation, portability, lifecycle) and adds deterministic reactivity, merged class defaults (`state` + `attrs`), cleanup safety, and direct agentic AI control.

## Why it is better than raw native Web Components

- ⚡ Deep reactive state via proxy (`state`) with microtask-batched updates.
- 🎯 Template invalidation from tracked dependencies (state + global paths).
- 🌲 Render + mount lifecycle is tree-aware (`renderComplete`, `mounted`, `waitRenderTree`).
- 🎨 Inheritance-aware stylesheet compilation + caching.
- 🧼 Automatic teardown of timers, listeners, observers, subscriptions, and visibility observers.
- 🤖 Structured AI querying + tool execution so models can search/control UI without vision.

## Latest method updates

- ✅ Mount lifecycle uses `onMounted`, `onRendered`, `onVisible` (not `onRenderComplete`).
- ✅ Attribute schema/reactivity added: `static attrs`, `attrs`, `observedAttributes`, `attributeChangedCallback`, `observeAttr`.
- ✅ Factory and registry updates: `getById`, `createBound`.
- ✅ Utility add: `ifAssign` for guarded state patching.
- ✅ State proxy now supports nested `Set`/`Map` mutation tracking.
- ❌ `replaceStyle` is no longer part of `WebComponent` (replace via `addStyle` with same key).

## Runtime architecture

- **Core class**: `viat/centralSite/client/new/components/core/base.js` (`WebComponent`).
- **Prototype mixins**:
  - `state.js`: `initState`, `replaceState`, `watchState`, `onStateChange`, `updateView`
  - `events.js`: `emit`, `on`, `off`, `once`, plus handler utilities
  - `globalState.js`: `getGlobal`, `setGlobal`, `subscribeGlobal`, `watchGlobal`
- **AI layer (`core/ai/*`)**:
  - Component graph + paths (`listPaths`, `pageOverview`, `peek`, `resolvePath`)
  - Structured descriptors (`inspect`, `describeComponent`, `queryByLabel`, `queryByTag`)
  - Tool registry + invocation (`listTools`, `callTool`) with permission gating
  - Transport host (local / websocket / webrtc / webmcp)

## API groups (by relevance)

### P0 (daily use)

- Lifecycle/render: `connectedCallback`, `disconnectedCallback`, `renderView`, `beforeRender`, `render`, `onRender`, `onMounted`, `onRendered`, `onVisible`
- Reactive state: `state`, `replaceState`, `watchState`, `updateView`, `observe`, `onStateChange`
- Attribute reactivity: `static attrs`, `attrs`, `observedAttributes`, `attributeChangedCallback`, `observeAttr`
- Events: `emit`, `on`, `off`, `once`
- Child access: `getComponent`, `getComponents`, `findComponent`

### P1 (frequent)

- Styles: `applyStyles`, `addStyle`, `removeStyle`, `hasStyle`, `resolveStyle`
- Timing/control: `setTimeout`, `removeTimeout`, `addInterval`, `stopInterval`, `setInert`
- Global state: `globalState`, `getGlobal`, `setGlobal`, `watchGlobal`, `observeGlobal`
- Mount/render orchestration: `scheduleMount`, `runMountLifecycle`, `waitForRenderedTree`, `observeVisibility`
- Tree/dom utilities: `getComponentsArray`, `appendTo`, `prependTo`, `findElement`, `ifAssign`, `bind`

### P2 (framework/advanced)

- Static pipeline: `create`, `createBound`, `preload`, `preRender`, `waitRenderTree`, `compileStyles`, `ensureCompiledStyles`, `styleSheet`
- Static schema merge: `computeMergedState`, `ensureMergedState`, `computeMergedAttrs`, `ensureMergedAttrs`, `observedAttributes`
- Internal orchestration: `subscribeRenderDeps`, `createRenderCompletePromise`, `createMountedPromise`, `handleConnectedCallback`, `handleDisconnectedCallback`
- Event/global internals: `runEventHandler`, `createEventHandler`, `createEmitHandler`, `subscribeGlobal`, `clearEventListeners`

## AI-first control model (no vision required)

1. Components are indexed by stable IDs + hierarchical paths.
2. Agent requests structure and semantics (`listComponents`, `pageOverview`, `inspect`, `queryByLabel`).
3. Agent resolves exact targets (`id` or `path`) and executes explicit tools (`callTool`).
4. Mutating actions are policy-checked (allow/deny/prompt + grants).
5. Result: precise app navigation and control with low tokens and high determinism.

## Optional AI mixin activation

AI methods are added through `applyAiMixin(WebComponent)`.

Added instance methods:
- `aiRegister`, `aiUnregister`, `aiId`
- `aiDescribe`, `aiTools`, `aiDefineTool`

With auto-register enabled, connect/disconnect hooks register/unregister components automatically.

## Authoring rules for custom components

- Extend `WebComponent` (not `HTMLElement`) for reactive lifecycle guarantees.
- Mutate through `this.state` or `replaceState`, not direct `STATE` writes.
- Keep `render()` declarative; use `onMounted()` for first-render side effects and `onRendered()` for later render-side effects.
- Use `observeAttr()` + `static attrs` for attribute-driven behavior.
- For style replacement, call `addStyle(existingKey, nextSheetOrPath)`.
- Prefer built-in event/state/global APIs for cleanup-safe behavior.
- For AI control, expose focused tools and concise descriptors; avoid vision-dependent flows.
