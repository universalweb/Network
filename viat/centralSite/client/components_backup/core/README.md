# 🌐 Universal Web Components

> Native Web Components for the **Universal Web** — reactive, agent-native, no-build.

Universal Web Components (UWC) is a thin **enhancement layer** over the native
`HTMLElement` / Custom Elements / Shadow DOM stack — not a framework, not a
runtime, not a 100KB ecosystem. It sharpens what the platform already gives you
and adds the one thing the platform forgot: **first-class AI Agent support**.

The base class — `WebComponent` — is what every Universal Web component extends.

---

## ⚡ Core idea

Every component is an **agent-addressable surface**.

Native Web Components were designed for humans clicking pixels. UWC components
are designed for **humans *and* autonomous agents**. State, intent, actions,
and semantics are exposed structurally — not painted into a screenshot an
agent has to OCR back into meaning.

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

## 🚫 #noBuild, by intent

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

## 🧬 What `WebComponent` gives you

A reactive base class that stays out of your way:

| Capability          | How                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------ |
| 🔄 Reactive state    | `this.state.x = …` — auto-tracked via `Proxy`, render deps inferred                  |
| 🌍 Global state      | `this.globalState.*` with the same proxy ergonomics                                  |
| 🎨 Style chain       | Static `styles = {}` merged across the inheritance chain, cached as `CSSStyleSheet`  |
| 🧱 Attrs schema      | Static `attrs = {}` → typed two-way attribute proxy + `observedAttributes`           |
| 🪝 Lifecycle         | `onConnect` · `onRender` · `onMounted` · `onVisible` · `onRendered` · `onDisconnect` |
| 📡 Events            | Auto-cleaned listeners, delegate channels, global observers                          |
| 🧹 Auto cleanup      | Timeouts, intervals, observers, subscriptions all torn down on disconnect            |
| 📨 Children registry | `liveChildren`, `getComponent`, `findComponent`                                      |
| 🧠 Agent surface     | State, attrs, actions exposed to AXON automatically                                  |

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
  a UWC app as well as a frontier multimodal model — often better.

This makes UWC the **default UI layer for cheap, fast, autonomous agents**
on the Universal Web.

---

## 🧭 Where this fits

UWC is one piece of the **Universal Web** stack:

- **Universal Web Components** — UI primitives (you are here)
- **AXON** — agent ↔ component / agent ↔ service protocol (MCP replacement)
- **Universal Web dApps** — apps composed of agent-native components
- **Viat** — reference client built on top

You can adopt UWC alone in a plain HTML page. You get more leverage as you
add AXON and the rest of the stack — but nothing forces you up the ladder.

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

No build. No bundler. No framework. Just a component — and an agent can drive
it the moment it's mounted.
