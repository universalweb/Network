# WebComponent

## Overview

`WebComponent` is the base class for all new UI components in `viat/centralSite/client/new/components`.

- Extends `HTMLElement`
- Uses `shadowRoot` with adopted style sheets
- Provides reactive component state, global state access, event helpers, lifecycle hooks, and CSS module support
- Mixes in methods from `state.js`, `events.js`, and `globalState.js`

## Constructor

`constructor(config = {})`

- `config` must be a plain config object
- `config.styles`: optional array of `CSSStyleSheet`
- `config.tooltips`: enable tooltip binding after render
- invalid `config.styles` entries throw immediately
- installs shared styles and `config.styles` into `shadowRoot.adoptedStyleSheets`
- sets `this.html = makeHtmlTag(this)`
- calls `this.initState()` and `this.createRenderCompletePromise()`

## Static API

- `static attrBindings = {}`
- `static get observedAttributes()`
- `static findComponent(key)`
- `static async waitRenderTree(el)`
- `static async preRender(element, mount, opts = {})`
- `static isWebComponent(source)`
- `static styleSheet(source, metaUrl)`
- `static async create(config = {})`

### `styleSheet(source, metaUrl)`

- if `metaUrl` is provided, loads stylesheet via `loadSheet`
- otherwise creates a `CSSStyleSheet` from raw CSS text
- caches result in `WebComponent.#sheetCache`

### `create(config)`

- instantiates the component with the same constructor config object
- optionally calls `replaceState(await state)`

## Template lists

- `each(items, renderFn, keyFn)` returns a `LiveList`
- `liveList(items, renderTarget, keyFn)` is the declarative helper for template rendering
- `renderTarget` can be a custom element class, a tag name, or a render function
- when `renderTarget` is a custom element class or tag name, each item is assigned to `element.state`

## Core reactive state

- `STATE = {}`: source state object
- `stateProxy`: proxy wrapper for `STATE`
- `state` getter/setter
  - getter returns `renderProxy` during render tracking or `stateProxy` otherwise
  - setter delegates to `replaceState`
- `globalState` getter
  - returns a global proxy during render tracking or `GLOBAL_STATE`

## Lifecycle hooks

- `connectedCallback()` → `handleConnectedCallback()`
- `disconnectedCallback()` → `handleDisconnectedCallback()`

### `handleConnectedCallback()`

- registers component in `registry`
- if parent is another `WebComponent`, registers child relationship
- calls `onConnect()`
- if `STATE` has keys, calls `updateView()`, otherwise calls `refresh()`

### `handleDisconnectedCallback()`

- unregisters component
- clears timeouts, intervals, effect subscribers, global subscribers, and tooltips
- calls `onDisconnect()`

## Render flow

- `refresh()`
  - resets `templateBuilt`
  - creates new render completion promise
  - increments `renderSeq`
  - runs `beforeRender()`
  - enables `renderTracking`
  - builds proxy wrappers via `makeRenderProxy` and `makeGlobalRenderProxy`
  - calls `this.render()`
  - disables `renderTracking`
  - calls `onRender()`
  - binds tooltips if enabled
  - resolves `renderComplete`

## Attribute binding

- `attributeChangedCallback(name, oldVal, newVal)`
- maps attributes to state using `this.constructor.attrBindings`
- calls `onAttributeChange(name, oldVal, newVal)`

## Helper methods

- `getComponent(tag)`
- `getComponents(tag)`
- `appendBatch(container, elements)`
- `addStyleSheet(sheet)`
- `addInterval(fn, ms)` / `clearInterval(id)`
- `addEffect(keys, fn)`
- `setTimeout(fn, ms)` / `clearTimeout(id)`
- `getComponentRoot()`
- `resolve(target)`
- `appendTo(target)` / `prependTo(target)`

## Lifecycle and render hooks to override

- `onConnect()`
- `onDisconnect()`
- `onAttributeChange(attributeName, oldVal, newVal)`
- `beforeRender()`
- `render()`
- `onRender()`
- `onRenderError(error)`
- `onLifecycleError(error)`
- `onStateChange()`

## Mixed-in modules

### `state.js`

- `initState()`
- `replaceState(state)`
- `watchState(key, handler)`
- `onStateChange()`
- `updateView()`

### `events.js`

- `emit(eventName, detail)`
- `handleEventError(error, domEvent, element, eventName)`
- `runEventHandler(handlerFunction, domEvent, element, eventName)`
- `createEventHandler(handlerFunction, ...args)`
- `createEmitHandler(eventName, detailSource)`

### `globalState.js`

- `getGlobalState(key)`
- `setGlobalState(updates)`
- `subscribeGlobal(key, cb)`
- `watchGlobal(key, cb)`
- `getGlobal(key)`
- `setGlobal(updates)`

## Notes for AI

- `WebComponent` is the root custom element base; all UI components extend it.
- It is responsible for state proxying, rendering, CSS adoption, tooltip binding, and lifecycle cleanup.
- Render tracking is active only during `refresh()` and `render()`, so state reads inside `render()` become reactive.
- The class is stateful: updating `STATE` via proxy triggers `updateView()` automatically.
- `attrBindings` is the bridge between HTML attributes and component state.
