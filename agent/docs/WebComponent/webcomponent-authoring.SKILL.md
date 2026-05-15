---
name: webcomponent-authoring
description: Author or refactor a UWC custom element that extends the WebComponent base class.
---

# WebComponent Authoring Skill

Use when creating or refactoring custom elements that must be reactive, cleanup-safe, fast, and AI-operable.

## Reference docs (read these first)

- **Quick reference**: `agent/docs/WebComponent/WebComponent.md`
- **Full conceptual docs**: `docs/library/WebComponent/README.md`
- **Lifecycle deep dive**: `docs/library/WebComponent/lifecycle.md`
- **Class shape (auto-generated)**: `agent/docs/classes/core/WebComponent.json`

## Goal

Produce a component that is:
- standards-based (`customElements` + Shadow DOM, no compiler)
- strongly reactive (`state` proxy + auto-tracked spots)
- low-boilerplate and deterministic
- per-component-isolated (no shared refs, no DOM queries)
- agent-addressable for free (AXON / AI mixin when needed)

## Required build pattern

1. **Class scaffold**
   - `class X extends WebComponent`
   - `static url = import.meta.url`
   - `static styles = { name: './x.css' }`
   - `static state = { ... }` for reactive defaults (chain-merged + smart-cloned per instance)
   - Optional `static attrs`, `static config` (config = non-reactive ctor params)
   - Optional framework flags: `static mergeState = false` (skip chain merge), `static mergeObjects = true` (deep-merge containers across chain + ctor-arg state), `static skipStaticState = true` (bypass static state pipeline)
   - Constructor signature is `(state, config, flags)` — pass overrides per-instance when constructing manually
   - **NEVER** declare `state = {…}` as a subclass class field — it shadows the prototype accessor and silently breaks reactivity. Always use `static state`.

2. **Lifecycle placement**
   - `onConnect`: subscriptions (`this.delegate(...)`, `this.on(...)`), one-time prep
   - `beforeRender`: sync/async prep that influences render; return `false` to skip
   - `render`: declarative `this.html\`...\`` — no DOM mutation here
   - `onRendered`: after this render + children
   - `onMount` / `onLive`: first-render-done hooks (measurements, focus, animations)
   - `onDisconnect`: only for things the framework cannot auto-clean (rare). Never write `onUnmount` — it does not exist.

3. **Render discipline**
   - Wrap function spots: `${() => this.state.count}` or bare method refs `${this.computeLabel}`
   - Bare reads inside template `${this.state.x}` work but force a whole-template re-render on change
   - Quote attribute interpolations: `class="${cls}"`, not `class=${cls}`
   - **Never** query the DOM. For element handles, write `#name` in the template and read `this.refs.name`.

4. **State discipline**
   - Class-level defaults: `static state = { … }` (chain-merged, smart-cloned per instance)
   - Per-instance overrides: `new MyComp({ key: value })` (ctor-arg state — plain `Object.assign`, caller-owned values)
   - Single-key change: `this.state.x = y`
   - Multi-key change: `this.assignState({ a, b, c })` (not `Object.assign(this.state, …)`)
   - Cross-component shared state: `this.globalState.theme` + `watchGlobal('theme', ...)`
   - Never write `this.STATE.x = y` from app code (bypasses tracking)
   - **NEVER** use `state = {…}` class field on a subclass — silently breaks reactivity (shadows the accessor)

5. **Events**
   - **Within a template**: `@click=${this.handleClick}` — bare method ref, engine calls with `this = component`
   - **From handler back up**: `this.emit('thing:happened', { id })`
   - **Anywhere in the tree** (cross-component): `this.delegate('thing:happened', this.handleThing)` in `onConnect`. Auto-cleaned on disconnect.
   - **Component DOM events**: `this.on('pointerdown', this.handlePointerDown)` — auto-cleaned
   - **window/globalThis events**: pair with an `AbortController` + `{ signal }`; abort in `onDisconnect`
   - **Never** use raw `document.addEventListener` for custom cross-component events — use `delegate`.

6. **Refs (`#name`)**
   - Template: `<dialog #dialog>...</dialog>`
   - Code: `this.refs.dialog` — returns `Element` via `WeakRef.deref()`
   - Per-component-instance scoped. Names need only be unique within a single component's template.
   - For hot loops, deref once: `const el = this.refs.foo; el.x = 1;`

7. **Method form**
   - Use shorthand class methods: `handleClick() { ... }`
   - Do **not** use arrow class fields (`handleClick = () => {}`). The framework's `delegate`, `on`, and template event spots all call handlers with `this` bound to the component. Arrow fields add a closure per instance and can't `super.method()`.

8. **Styles**
   - Static style chain first (`static styles = { ... }`) — compiled once per class, adopted via `adoptedStyleSheets`
   - Runtime toggles via `addStyle`/`removeStyle`/`replaceStyle`
   - Subclass-only host states: target `:host(.active)` or `:host([active])`

9. **Optional AI enablement**
   - Apply AI mixin when the component must be agent-addressable
   - Expose concise tools (`aiDefineTool`) with clear input schemas
   - Default read-only; gate mutating tools by policy

## Output checklist

- extends `WebComponent`, defines `static url` + at least one `static styles` entry
- handlers are method shorthand, not arrow class fields
- **no `state = {…}` class field on subclasses** — defaults live in `static state`
- no `querySelector` / `getElementById` — uses `#name` + `this.refs`
- multi-key state writes use `assignState`
- lifecycle awaits use `this.lifecycle.whenX` namespace (not top-level `this.whenX`)
- cross-component listeners use `this.delegate(...)`, not `document.addEventListener`
- `window` references rewritten to `globalThis`
- no `delete` keyword anywhere
- emitted events use `feature:phase` or `kebab-case-action` naming
- if AI-enabled: clear `aiLabel`, `aiRole`, minimal `aiDefineTool` set

## Response contract when using this skill

Return:
1. Short implementation summary (1–3 sentences)
2. Files created/edited (paths only)
3. Component code (single block, complete)
4. Brief verification notes (what to check in the browser, expected events)
