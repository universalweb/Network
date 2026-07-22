import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Synchronous patch-pass fast path (render.js canPatchSync/patchPassSync, R1).
 *
 * A re-render triggered purely by a tracked `${this.state.x}` read does only
 * synchronous work, so renderView runs it inline and returns undefined instead
 * of dragging it through updateView→renderView→renderPass→.then. These tests
 * pin BOTH halves of that claim: that the fast path is genuinely TAKEN (a green
 * suite would otherwise be satisfied by never reaching it), and that collapsing
 * the chain preserved the contracts that matter — whenRendered settles per
 * completed pass and can never be left wedged, a sync render() throw
 * propagates RAW per the failure contract (app bug, app stack — no framework
 * routing) with the deps intact and the component healing on its next pass,
 * and an async render is never dragged onto the sync lane.
 *
 * Same happy-dom harness as renderFailure.test.js.
 */
GlobalRegistrator.register();
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
const unhandledRejections = [];
function trackRejection(reason) {
	unhandledRejections.push(reason);
}
process.on('unhandledRejection', trackRejection);
const { WebComponent } = await import('../../base.js');
const { Perf } = await import('../../debug/perf.js');
let probeSeq = 0;
/*
 * A state write only SCHEDULES the bus flush; `markRenderDirty` — the renderDep
 * subscriber the bus invokes in that flush — is what actually flips the flags
 * canPatchSync reads. Tests that write state and immediately inspect the
 * component race that microtask and observe a not-yet-dirty component. Driving
 * the real prototype dirty-marker directly is the faithful, deterministic stand-in
 * for the flush: same function, same flags, no timing window.
 */
function markDirtyAsBusWould(element) {
	element.markRenderDirty();
}
function root(element) {
	return element.shadowRoot ?? element;
}
async function mount(tag) {
	const element = document.createElement(tag);
	document.body.appendChild(element);
	await element.pendingConnect;
	return element;
}
afterEach(() => {
	document.body.replaceChildren();
});
function defineSyncProbe() {
	const tag = `pp-sync-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		renderCount = 0;
		renderErrors = [];
		constructor() {
			super();
			this.addEventListener('renderError', this);
		}
		handleEvent(domEvent) {
			domEvent.preventDefault();
			this.renderErrors.push(domEvent.detail.data);
		}
		render() {
			this.renderCount++;
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('sync render(): first pass learns renderIsSync, later dep write takes the fast path', async () => {
	const element = await mount(defineSyncProbe());
	assert.equal(element.renderIsSync, true, 'first render taught the fact from what render() returned');
	assert.equal(element.firstRenderDone, true);
	assert.equal(element.renderCount, 1);
	/*
	 * The decisive probe. A tracked write flips renderDepDirty, which is the last
	 * canPatchSync condition — so this renderView call MUST run inline and hand
	 * back undefined. A Promise here means the fast path was never reached and
	 * every other assertion in this file would be passing vacuously.
	 */
	element.state.value = 'b';
	markDirtyAsBusWould(element);
	assert.equal(element.renderDepDirty, true, 'dirty-marker flipped the patch-pass flag');
	assert.equal(element.templateBuilt, false, 'dirty-marker invalidated the template');
	const returned = element.renderView();
	assert.equal(returned, undefined, 'fast path returns undefined, not a Promise');
	assert.equal(element.renderCount, 2, 'render() re-ran synchronously — no await needed');
	assert.equal(root(element).querySelector('span').textContent, 'b', 'spot patched in place, inline');
	assert.equal(element.templateBuilt, true);
	assert.equal(element.renderDepDirty, false, 'dirty flag consumed by the pass');
	assert.equal(element.renderTracking, false, 'tracking window closed');
});
test('whenRendered settles on the sync fast path', async () => {
	const element = await mount(defineSyncProbe());
	element.state.value = 'b';
	markDirtyAsBusWould(element);
	const returned = element.renderView();
	assert.equal(returned, undefined, 'guard: this pass really was the fast path');
	/*
	 * The contract R1 most had to protect: the pass allocates no promise chain,
	 * but anyone holding whenRendered must still be released. A regression here
	 * hangs the ancestor tree rather than failing loudly, so the suite timeout is
	 * the real assertion.
	 */
	await element.lifecycle.whenRendered;
	assert.equal(root(element).querySelector('span').textContent, 'b');
});
test('whenRendered settles on the async slow path too', async () => {
	const tag = `pp-async-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		renderCount = 0;
		async render() {
			this.renderCount++;
			await Promise.resolve();
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	const element = await mount(tag);
	assert.equal(element.renderIsSync, false, 'async render() is never eligible for the fast path');
	await element.lifecycle.whenRendered;
	assert.equal(element.renderCount, 1);
});
test('beforeRender keeps a component on the async path, and the hook still runs', async () => {
	const tag = `pp-before-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		beforeRenderCount = 0;
		beforeRender() {
			this.beforeRenderCount++;
		}
		render() {
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	const element = await mount(tag);
	assert.equal(element.beforeRenderCount, 1, 'beforeRender ran on the first pass');
	/*
	 * No state write here on purpose: a write would schedule a real bus flush that
	 * races the hand-driven pass below and inflates the hook count. Marking dirty
	 * is the whole precondition under test — that a beforeRender component is
	 * routed AWAY from the fast path even when otherwise eligible.
	 */
	markDirtyAsBusWould(element);
	const returned = element.renderView();
	assert.notEqual(returned, undefined, 'a component with beforeRender stays on the async path');
	await returned;
	assert.equal(element.beforeRenderCount, 2, 'beforeRender still runs on a patch pass — eligibility never skips work');
});
test('beforeRender component still patches the DOM through the real flush', async () => {
	const tag = `pp-before-e2e-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		beforeRender() {
			this.sawBeforeRender = true;
		}
		render() {
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	const element = await mount(tag);
	element.state.value = 'b';
	await Perf.settle(4);
	assert.equal(root(element).querySelector('span').textContent, 'b', 'async path still reacts to a tracked write');
	assert.equal(element.sawBeforeRender, true);
});
test('sync throw on the fast path propagates RAW — no routing, nothing wedges, next pass heals', async () => {
	const tag = `pp-throw-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		renderErrors = [];
		explode = false;
		constructor() {
			super();
			this.addEventListener('renderError', this);
		}
		handleEvent(domEvent) {
			domEvent.preventDefault();
			this.renderErrors.push(domEvent.detail.data);
		}
		render() {
			if (this.explode) {
				throw new Error('patch pass boom');
			}
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	const element = await mount(tag);
	assert.equal(element.renderIsSync, true);
	element.explode = true;
	element.state.value = 'b';
	markDirtyAsBusWould(element);
	function renderBoom() {
		element.renderView();
	}
	assert.throws(renderBoom, /patch pass boom/, 'the app render bug surfaces raw with the app stack — fail fast');
	assert.equal(element.renderErrors.length, 0, 'no framework routing on the sync lane — the callee owns its failure');
	/*
	 * The un-wedgeable guarantee that replaced the old catch: the epoch arms
	 * only AFTER the app call, so a throwing pass never leaves whenRendered
	 * pending — this await must resolve (previous pass's settled slot), never
	 * hang an ancestor.
	 */
	await element.lifecycle.whenRendered;
	/*
	 * A failed pass must KEEP the previous render's dep subscriptions — tearing
	 * them down froze components permanently (the old finally-block bug). Proof
	 * is behavioural: the component still reacts to the next tracked write,
	 * which also resets the leaked renderTracking flag at its pass start.
	 */
	element.explode = false;
	element.state.value = 'c';
	await Perf.settle(4);
	assert.equal(root(element).querySelector('span').textContent, 'c', 'still reactive after a failed pass — deps survived');
	assert.equal(element.renderTracking, false, 'the next pass reset the leaked tracking flag');
	assert.equal(unhandledRejections.length, 0, 'a raw sync throw is not a rejection — the async contract holds');
});
/*
 * The shape-shifter: sync on its first render (so renderIsSync latches true and
 * canPatchSync lets it onto the fast lane), thenable afterwards. patchPassSync
 * must abandon that pass rather than commit spots against a half-built template,
 * and must not DROP the thenable — a dropped rejection is unhandled and a dropped
 * promise can wedge an awaiter. Rare, but the guard exists, so it gets exercised.
 */
function defineShapeShifterProbe(rejectLater) {
	const tag = `pp-shift-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		goAsync = false;
		renderErrors = [];
		constructor() {
			super();
			this.addEventListener('renderError', this);
		}
		handleEvent(domEvent) {
			domEvent.preventDefault();
			this.renderErrors.push(domEvent.detail.data);
		}
		render() {
			if (!this.goAsync) {
				this.html`<span>${this.state.value}</span>`;
				return undefined;
			}
			if (rejectLater) {
				return Promise.reject(new Error('late async render boom'));
			}
			this.html`<span>${this.state.value}</span>`;
			return Promise.resolve();
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('known-sync render that turns thenable: pass is abandoned, thenable is settled, patch still lands', async () => {
	const element = await mount(defineShapeShifterProbe(false));
	assert.equal(element.renderIsSync, true, 'first render latched the sync fact');
	element.goAsync = true;
	element.state.value = 'b';
	markDirtyAsBusWould(element);
	const returned = element.renderView();
	assert.notEqual(returned, undefined, 'the abandoned pass hands back a Promise to settle');
	await returned;
	assert.equal(element.renderIsSync, false, 'the fact self-corrected — no longer fast-path eligible');
	assert.equal(root(element).querySelector('span').textContent, 'b', 'the rescue pass actually landed the patch');
	assert.equal(unhandledRejections.length, 0);
});
test('known-sync render that turns into a REJECTING thenable: routed, not leaked', async () => {
	const element = await mount(defineShapeShifterProbe(true));
	element.goAsync = true;
	markDirtyAsBusWould(element);
	const returned = element.renderView();
	await returned;
	assert.equal(element.renderErrors.length, 1, 'the abandoned thenable rejected into the renderError event');
	assert.match(element.renderErrors[0].message, /late async render boom/);
	await element.lifecycle.whenRendered;
	await Perf.settle(4);
	assert.equal(unhandledRejections.length, 0, 'the dropped-promise leak this guard exists to prevent');
});
test('updateView returns undefined for an inline patch, so onFlush arms no .catch', async () => {
	const element = await mount(defineSyncProbe());
	element.state.value = 'z';
	markDirtyAsBusWould(element);
	/*
	 * updateView is what onFlush actually calls, and it only arms `.catch` when
	 * the return is promise-like — the last two allocations R1 removes. Asserting
	 * on updateView (not renderView) is what pins that.
	 */
	const returned = element.updateView();
	assert.equal(returned, undefined, 'updateView returns undefined when the flush completed inline');
	assert.equal(root(element).querySelector('span').textContent, 'z', 'patched inline, before any await');
});
test('end-to-end: a tracked write through the real bus flush still patches the DOM', async () => {
	const element = await mount(defineSyncProbe());
	/*
	 * The others drive markRenderDirty directly for determinism; this one lets the
	 * genuine `write → bus flush → onFlush → updateView` path run untouched, so a
	 * fast path that only works when hand-driven cannot pass this file.
	 */
	element.state.value = 'z';
	await Perf.settle(4);
	assert.equal(root(element).querySelector('span').textContent, 'z', 'real flush drove the patch');
	assert.equal(element.renderCount, 2, 'exactly one re-render — no double pass');
	assert.equal(unhandledRejections.length, 0);
});
