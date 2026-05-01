# WebComponent

## Intent

`WebComponent` is a reactive, app-scale base class built on native Custom Elements.

It keeps standards-based Web Component strengths (encapsulation, portability, lifecycle) but adds deterministic reactivity, cleanup safety, and direct agentic AI control.

## Why it is better than raw native Web Components

- ⚡ Deep reactive state via proxy (`state`) with microtask-batched updates.
- 🎯 Template invalidation from tracked dependencies (state + global paths).
- 🌲 Render completion is tree-aware (`renderComplete`, `waitRenderTree`).
- 🎨 Inheritance-aware stylesheet compilation + caching.
- 🧼 Automatic teardown of timers, listeners, observers, subscriptions.
- 🤖 Structured AI querying + tool execution so models can search/control UI without vision.

## Runtime architecture

- **Core class**: `base.js` (`WebComponent`).
- **Prototype mixins**:
  - `state.js`: `initState`, `replaceState`, `watchState`, `updateView`
  - `events.js`: `emit`, `on`, `off`, `once`, handler utilities
  - `globalState.js`: `getGlobal`, `setGlobal`, `subscribeGlobal`, `watchGlobal`
- **AI layer (`base/ai/*`)**:
  - Component graph + paths (`listPaths`, `pageOverview`, `peek`, `resolvePath`)
  - Structured descriptors (`inspect`, `describeComponent`, `queryByLabel`, `queryByTag`)
  - Tool registry + invocation (`listTools`, `callTool`) with permission gating
  - Transport host (local / websocket / webrtc / webmcp)

## API groups (by relevance)

### P0 (daily use)

- Lifecycle/render: `connectedCallback`, `disconnectedCallback`, `renderView`, `render`, `beforeRender`, `onRender`, `onRenderComplete`
- Reactive state: `state`, `replaceState`, `watchState`, `updateView`, `observe`
- Events: `emit`, `on`, `off`, `once`
- Child access: `getComponent`, `getComponents`, `findComponent`

### P1 (frequent)

- Styles: `applyStyles`, `addStyle`, `removeStyle`, `replaceStyle`, `hasStyle`
- Timing/control: `setTimeout`, `removeTimeout`, `addInterval`, `stopInterval`, `setInert`
- Global state: `globalState`, `getGlobal`, `setGlobal`, `watchGlobal`, `observeGlobal`
- Render finalization: `waitForRenderedTree`, `scheduleRenderComplete`

### P2 (framework/advanced)

- Static pipeline: `create`, `preload`, `preRender`, `waitRenderTree`, `compileStyles`, `ensureCompiledStyles`, `styleSheet`
- Internal render helpers: `subscribeRenderDeps`, `createRenderCompletePromise`, `runRenderCompleteLifecycle`
- Event/global internals: `runEventHandler`, `createEventHandler`, `createEmitHandler`, `subscribeGlobal`

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
- Keep `render()` declarative; use `onRenderComplete()` for measurement/layout side effects.
- Prefer built-in event/state/global APIs for cleanup-safe behavior.
- For AI control, expose focused tools and concise descriptors; avoid vision-dependent flows.
