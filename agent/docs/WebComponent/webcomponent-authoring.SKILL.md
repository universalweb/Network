---
name: webcomponent-authoring
description: Generate compact, high-performance custom classes extending WebComponent with reactive state, lifecycle discipline, and optional agentic AI tooling.
---

# WebComponent Authoring Skill

Use when creating or refactoring custom elements in this project that should be reactive, cleanup-safe, and AI-operable.

## Goal

Produce a component that is:
- standards-based (`customElements` + Shadow DOM)
- strongly reactive (`state` proxy + `updateView` flow)
- low-boilerplate and deterministic
- optionally discoverable/controllable by agent tools without vision

## Required build pattern

1. **Class scaffold**
   - `class X extends WebComponent`
   - define `static url = import.meta.url`
   - define `static styles = { ... }`
   - `constructor` calls `super(config)` and initializes `this.state`

2. **Lifecycle placement**
   - `onConnect`: startup work (subscriptions, fetch, observers)
   - `onDisconnect`: teardown for anything not auto-managed
   - `onRenderComplete`: post-layout work (measurements, focus, animations)

3. **Render discipline**
   - implement `render()` with `this.html`
   - keep render declarative; avoid imperative DOM mutation during render

4. **State discipline**
   - mutate via `this.state` or `replaceState`
   - use `watchState`/`observe` for reactions
   - do not write raw `STATE` from app code

5. **Events and globals**
   - use `emit`, `on`, `off`, `once`
   - use `globalState` + `watchGlobal` only when shared app state is needed

6. **Styles**
   - rely on static style chain first
   - use `addStyle`/`removeStyle`/`replaceStyle` for runtime style toggles

7. **Optional AI enablement**
   - apply AI mixin when the component must be agent-addressable
   - expose concise tools (`aiDefineTool`) with clear schemas
   - prefer read-only tools by default; gate mutating tools by policy

## Output checklist

- component extends `WebComponent`
- reactive update path works (`state` change -> `updateView` -> `renderView`)
- no timer/listener/subscription leaks
- style strategy is explicit
- emitted events are meaningful and scoped
- if AI enabled: component has useful label/role/description and minimal tool set

## Response contract when using this skill

Return:
1. short implementation summary
2. files created/edited
3. component code
4. brief verification notes
