---
name: webcomponent-authoring
description: Author or refactor a UWC custom element that extends the WebComponent base class.
---

# WebComponent Authoring Skill

Use when creating or refactoring custom elements that must be reactive, cleanup-safe, fast, and AI-operable.

## Reference

- **Class reference**: `agent/docs/WebComponent/WebComponent.md`
- **Method map**: `agent/docs/WebComponent/diagram.mmd`
- **Class shape (auto-generated)**: `agent/docs/classes/WebComponent/WebComponent.json` — regenerate with `node ./agent/indexCodebase.js --class WebComponent`
- **Source of truth**: `viat/centralSite/client/components/core/base.js` + `index.js`

## Goal

Produce a component that is:
- standards-based (`customElements` + open Shadow DOM, no compiler, no build step)
- strongly reactive (`state` proxy + auto-tracked spots; `Set`/`Map` reactive too)
- low-boilerplate and deterministic
- per-instance isolated (no shared refs, no DOM queries)
- agent-addressable when needed (AI mixin)

## 1. Class scaffold

- `import { WebComponent } from 'webcomponent'` — bare specifier per the importmap; never relative paths (core-internal files excepted).
- `class X extends WebComponent`
- `static url = import.meta.url` — **required**, anchors `./*.css` and assets.
- `static styles = { name: './x.css' }` — at least one entry.
- `static state = { ... }` — reactive defaults; chain-merged + smart-cloned per instance.
- Optional `static attrs` (HTML attribute ↔ state mirror), `static config` (non-reactive ctor params), `static types` (per-path schema).
- Optional flags: `static mergeState = false`, `static mergeObjects = true`, `static skipStaticState = true`.
- Constructor is `(state, config, flags)` — pass overrides per-instance when constructing manually.
- **NEVER** declare `state = {…}` as a subclass class field — it shadows the prototype accessor and silently breaks reactivity. Class-level defaults go in `static state`.
- `upgradeShadowedProperties()` auto-runs in the base constructor — pre-upgrade `el.state = {...}` assignments from a parent template are rescued through the setter. No manual upgrade dance.
- `customElements.define('kebab-tag', X)` at the end of the file.

## 2. Lifecycle placement

- `onConnect()` — subscriptions (`this.delegate(...)`, `this.on(...)`), one-time prep.
- `beforeRender()` — sync/async prep that feeds render; return `false` to skip the render.
- `render()` — declarative `this.html\`…\`` **as a statement** (not `return`); no DOM mutation, no side effects. Prefix with `// eslint-disable-next-line no-unused-expressions`.
- `onRender()` / `onRendered()` — post-render work; both **skipped on patch passes**.
- `onMount()` / `onLive()` — first-render-done hooks (measurement, focus, animation); fire once.
- `onVisible()` / `onIntersect()` — viewport-gated work.
- `onDisconnect()` — only for what the framework cannot auto-clean (rare). **Never write `onUnmount` — it does not exist.**
- Await lifecycle on the `this.lifecycle.whenX` namespace (`whenConnected`, `whenRendered`, `whenMounted`, `whenLive`, `whenDisconnected`, `whenDestroyed`) — not top-level `this.whenX`.

## 3. Render discipline — the patch-pass model

The engine has two surgical update paths. There is **no whole-component re-render** in normal operation.

- **Bare read `${this.state.x}` is the standard.** It registers a renderDep; a change triggers a cheap **patch pass** (re-run `render()`, diff spots, skip the structural lifecycle). Use it for every plain reactive read.
- **Arrow `${() => { return …; }}` only for genuine computation** — math, concatenation, conditional logic, combining multiple values. Never arrow-wrap a plain state ref; that is the legacy anti-pattern.
- Attribute interpolations are **bare and unquoted**: `class=${classList(...)}`, `data-x=${this.state.mode}` — never `class="${...}"`.
- Sigils: `?attr=${cond}` boolean attribute, `.prop=${value}` DOM property, `$attr=${state.key}` two-way binding (state key must equal attr name).
- Events: `@click=${this.handleClick}` — bare method ref; engine calls with `this` = component.
- Reactive class lists: `class=${classList('panel', () => { return this.state.open && 'is-open'; }, this.state.tags)}` — strings, token-returning fns, and reactive `Set` values collapse into a deduped class string with per-token diffing.
- Keyed lists / child components: `each(items, ChildClass, keyFn)` or `list('stateKey', ChildClass)` from `'webcomponent'` — never imperative markup strings.
- **Never query the DOM.** Write `#name` in the template, read `this.refs.name`. Ref names must match `/^[a-z_][a-z0-9_]*$/` — all lowercase, underscores allowed. `#camelCase` is lowercased by the parser and breaks; use `#snake_case`.
- Arrow bodies must be block-bodied (`() => { return …; }`) per eslint.

## 4. State discipline

- Class defaults: `static state = { … }`.
- Per-instance overrides: `new MyComp({ key: value })` (ctor-arg state, plain assign).
- Single-key write: `this.state.x = y`.
- Multi-key write: `this.assignState({ a, b, c })` — never `Object.assign(this.state, …)`.
- `Set` / `Map` values are reactive — `this.state.tags.add('x')` notifies like a prop write. Prefer a `Set` for class-list state over an array.
- Cross-component shared state: `this.globalState.theme` + `watchGlobal('theme', …)` / `this.observeGlobal(...)`.
- React to changes without rendering: `this.watchState(key, handler)` or `this.observe(keys, callback)`.
- Never write `this.STATE.x` from app code (bypasses tracking).
- Optional `static types = { 'a.b': { kind, react } }` — declare a `CONTENT_KIND` or mark a path `react: false`. Keys are exact dot-paths. Keep state reactive by default.

## 5. Events & global

- In a template: `@click=${this.handleClick}` — bare method ref.
- Emit upward: `this.emit('feature:phase', { id })`.
- Cross-component, tree-wide: `this.delegate('feature:thing', this.handleThing)` in `onConnect` — auto-cleaned on disconnect.
- Component DOM events: `this.on('pointerdown', this.handlePointerDown)` — auto-cleaned.
- `window`/`globalThis` events: pair an `AbortController` with `{ signal }`; abort in `onDisconnect`.
- **Never** `document.addEventListener` for custom cross-component events — use `delegate`.
- Event naming: `feature:phase` or `kebab-case-action`.

## 6. Refs & component lookup

- Template `#name` → `this.refs.name` (WeakRef-backed, per-instance). Deref once for hot loops.
- `getComponent` / `getComponents` / `findComponent` are **non-recursive — direct shadow children only**. Walk each parent to reach nested instances; fan updates out to every instance when a tag is mounted by multiple parents.

## 7. Styles

- `static styles = { … }` — compiled once per class, adopted via `adoptedStyleSheets`. Every component also gets `core/styles/base.css`.
- Theme via CSS vars (`styles/variables.css` + `styles/themes/`) — set tokens, never hard-code colors.
- Runtime toggles: `addStyle` / `removeStyle` / `hasStyle`.
- Subclass host states: target `:host(.active)` or `:host([active])`.
- Two component classes sharing one CSS file: scope `:host` rules so a fixed-position container rule doesn't leak onto every list item.

## 8. Built-in behaviors & global components

- **Tooltips** — add `tooltip="text"` (or `tooltip=${...}`) to any element in a template. Built-in behavior attribute; no import, no component. Hover-capable devices only. Never use native `title=`. Empty/null value = no tooltip. Never create `ui-tooltip` manually.
- **SVG icons** — use `<ui-icon name="arrow-up" size="md" tone="default">`. Global component backed by a generated Lucide sprite (`components/global/icon/sprite.svg`). Never inline `<svg>` or `<img>` for icons. Props: `name`, `size`, `tone`, `spin`, `animate`. Icons inherit text color via `currentColor`.
- Other behaviors: `copy=`, `confirm=`, `reveal=`, `autofocus`. Register custom ones with `registerBehavior(name, behavior)`.

## 9. Optional AI enablement

- Apply the AI mixin when the component must be agent-addressable.
- Expose concise tools (`aiDefineTool`) with clear input schemas.
- Default read-only; gate mutating tools by policy.

## Method form

- Use method shorthand: `handleClick() { ... }`.
- Do **not** use arrow class fields (`handleClick = () => {}`) — `delegate`, `on`, and template event spots all call handlers with `this` bound to the component; arrow fields add a per-instance closure and can't `super`.

## Output checklist

- extends `WebComponent`; declares `static url` + at least one `static styles` entry
- imports from the bare `'webcomponent'` specifier
- handlers are method shorthand, not arrow class fields
- **no `state = {…}` class field on subclasses** — defaults in `static state`
- bare `${this.state.x}` for plain reads; arrows only for genuine computation
- attribute interpolations are bare/unquoted (`class=${...}`)
- no `querySelector` / `getElementById` — `#name` + `this.refs`
- all `#refs` lowercase / underscore (match `/^[a-z_][a-z0-9_]*$/`)
- multi-key state writes use `assignState`
- reactive class state uses `Set` + `classList()`, not an array
- keyed lists use `each()` / `list()`, not imperative strings
- `getComponent` / `getComponents` callers handle nesting explicitly (non-recursive)
- lifecycle awaits use `this.lifecycle.whenX`
- cross-component listeners use `this.delegate(...)`, not `document.addEventListener`
- icons use `<ui-icon>`; hover hints use the `tooltip=` attribute
- `window` rewritten to `globalThis`
- no `delete` keyword
- no `for…of` in hot loops — indexed `for`
- no shadowing globals (`name`, `event`, `confirm`, `type`, `alert`, `fetch`, `parent`)
- no underscores in variable/method/function names (`#snake_case` refs excepted)
- emitted events use `feature:phase` or `kebab-case-action`
- if AI-enabled: clear `aiLabel`, `aiRole`, minimal `aiDefineTool` set

## Response contract when using this skill

Return:
1. Short implementation summary (1–3 sentences)
2. Files created/edited (paths only)
3. Component code (single complete block)
4. Brief verification notes (what to check in the browser, expected events)
