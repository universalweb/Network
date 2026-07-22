import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * The core is DOM-coupled (`WebComponent extends HTMLElement`), so the happy-dom
 * globals must exist BEFORE the core module graph loads. Register first, then
 * dynamic-import the core (static imports would hoist above this).
 */
GlobalRegistrator.register();
/*
 * The core resolves base stylesheets via `fetch(file://…)` at module load;
 * happy-dom's fetch rejects the `file:` scheme, so stub it to hand back empty
 * CSS — AI registration is style-independent.
 */
async function emptyStylesheetText() {
	return '';
}
function stubbedFetch() {
	return Promise.resolve({
		ok: true,
		status: 200,
		text: emptyStylesheetText,
	});
}
globalThis.fetch = stubbedFetch;
const { WebComponent } = await import('../../base.js');
const {
	applyAiMixin, backfillAiRegistry,
} = await import('../mixin.js');
const {
	getComponentId, getParent, unregisterComponent,
} = await import('../registry.js');
/*
 * Production now arms AI LAZILY via `enableAi()` — the mixin is applied on first
 * agent use, not at load (see components/core/index.js), so a component that never
 * triggers AI pays nothing at connect/disconnect. This test applies the mixin
 * directly to exercise the registration lifecycle: the methods land on the base
 * prototype and the native connect/disconnect lifecycle drives register/unregister
 * (no `connectedCallback`/`disconnectedCallback` monkey-patch).
 */
applyAiMixin(WebComponent);
let probeSeq = 0;
function renderOk(component) {
	component.html`<span>ok</span>`;
}
function defineProbe() {
	const tag = `ai-reg-probe-${probeSeq++}`;
	class Probe extends WebComponent {
		render() {
			renderOk(this);
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
async function mount(tag) {
	const element = document.createElement(tag);
	document.body.appendChild(element);
	await element.pendingConnect;
	return element;
}
test('connect auto-registers the component (native lifecycle, formerly the connectedCallback monkey-patch)', async () => {
	const element = await mount(defineProbe());
	const id = getComponentId(element);
	assert.ok(id, 'registered in the AI registry after connect');
	assert.equal(element.aiId(), id, 'aiId() reflects the registry id');
});
test('disconnect unregisters synchronously — before the pendingConnect await — so list churn never strands a detached component', async () => {
	const element = await mount(defineProbe());
	assert.ok(getComponentId(element), 'registered while connected');
	element.remove();
	assert.equal(getComponentId(element), null, 'unregistered synchronously on remove, not deferred past the connect-cycle await');
});
test('a subclass that defines its own onConnect still auto-registers (the composition the monkey-patch existed to guarantee)', async () => {
	let onConnectRan = false;
	const tag = `ai-reg-probe-${probeSeq++}`;
	class ProbeWithHook extends WebComponent {
		onConnect() {
			onConnectRan = true;
		}
		render() {
			renderOk(this);
		}
	}
	customElements.define(tag, ProbeWithHook);
	const element = await mount(tag);
	assert.ok(onConnectRan, 'the subclass onConnect ran');
	assert.ok(getComponentId(element), 'auto-registered even though the subclass overrides onConnect');
});
test('registration is visible inside onConnect on BOTH the cold and warm (cached-styles) connect paths — deterministic, unlike the former monkey-patch', async () => {
	const tag = `ai-reg-probe-${probeSeq++}`;
	const registeredWhenOnConnectRan = [];
	class ProbeTiming extends WebComponent {
		onConnect() {
			registeredWhenOnConnectRan.push(Boolean(getComponentId(this)));
		}
		render() {
			renderOk(this);
		}
	}
	customElements.define(tag, ProbeTiming);
	/*
	 * Instance 1 is the COLD path (first of its class → styles resolve async, so
	 * handleConnect suspends before onConnect); instance 2 is the WARM path
	 * (styleMap now cached → applyStyles returns synchronously and connect runs
	 * straight through onConnect). The old connectedCallback monkey-patch fired
	 * aiRegister AFTER onConnect on the warm path and BEFORE it on the cold path;
	 * the native-lifecycle call registers BEFORE onConnect on both — this asserts
	 * that determinism, the one behavior the refactor deliberately changed.
	 */
	await mount(tag);
	await mount(tag);
	assert.deepEqual(registeredWhenOnConnectRan, [true, true], 'the component is already AI-registered when its own onConnect runs, on both the cold and warm connect paths');
});
test('backfillAiRegistry re-registers a tree that armed AFTER mount, resolving parent before child (pre-order walk)', async () => {
	const parentTag = `ai-reg-probe-${probeSeq++}`;
	const childTag = `ai-reg-probe-${probeSeq++}`;
	class BackfillParent extends WebComponent {
		render() {
			renderOk(this);
		}
	}
	class BackfillChild extends WebComponent {
		render() {
			renderOk(this);
		}
	}
	customElements.define(parentTag, BackfillParent);
	customElements.define(childTag, BackfillChild);
	const parentElement = document.createElement(parentTag);
	const childElement = document.createElement(childTag);
	parentElement.appendChild(childElement);
	document.body.appendChild(parentElement);
	await parentElement.pendingConnect;
	await childElement.pendingConnect;
	/*
	 * Simulate the components having mounted BEFORE AI armed: drop them from the
	 * registry, then backfill exactly as enableAi does on the first arm.
	 */
	unregisterComponent(parentElement);
	unregisterComponent(childElement);
	assert.equal(getComponentId(parentElement), null, 'parent cleared before backfill');
	assert.equal(getComponentId(childElement), null, 'child cleared before backfill');
	backfillAiRegistry();
	assert.ok(getComponentId(parentElement), 'parent re-registered by backfill');
	assert.ok(getComponentId(childElement), 'child re-registered by backfill');
	assert.equal(getParent(childElement), parentElement, 'backfill registered the parent before the child, so the child resolves its real ancestor (not a false root)');
});
