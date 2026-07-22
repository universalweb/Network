import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * onStateChange fire-count contract. DOM-coupled (real components + the render
 * pipeline), so register happy-dom BEFORE importing core, then stub the
 * stylesheet fetch (identical harness to stores.test.js / realm.test.js).
 *
 * Under test: replaceState is notify-only when the component has a reactive bus
 * (the flush's onFlush → updateView fires onStateChange EXACTLY once). Before
 * the fix, replaceState both notified AND called updateView directly, so
 * onStateChange fired twice (and N same-tick replacements fired it N+1 times).
 * Each test clears the document between runs so mounted probes don't leak
 * pending rAF/observer work into the next test.
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
const { WebComponent } = await import('../../base.js');
let probeSeq = 0;
function noop() {}
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
/*
 * Probe with an onStateChange counter. `renderBody(component)` decides whether
 * the template reads state reactively (→ a renderDep bus) or is static;
 * `connectBody` optionally seeds a bus via observe() WITHOUT a reactive read.
 */
function defineProbe(staticState, renderBody, connectBody) {
	const tag = `onstatechange-probe-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = staticState;
		stateChangeCount = 0;
		render() {
			renderBody(this);
		}
		onStateChange() {
			this.stateChangeCount++;
		}
	}
	if (connectBody) {
		Probe.prototype.onConnect = connectBody;
	}
	customElements.define(tag, Probe);
	return tag;
}
function renderReactive(component) {
	component.html`<span>${component.state.value}</span>`;
}
function renderStatic(component) {
	component.html`<span>static</span>`;
}
function observeValue() {
	this.observe('value', noop);
}
test('bus + renderDeps: replaceState fires onStateChange exactly once', {
	timeout: 8000,
}, async () => {
	const tag = defineProbe({
		value: 'a',
	}, renderReactive);
	const element = await mount(tag);
	element.stateChangeCount = 0;
	element.replaceState({
		value: 'b',
	});
	await element.nextFrame();
	assert.equal(element.stateChangeCount, 1, 'onStateChange fired once, not twice');
	assert.equal(root(element).querySelector('span').textContent, 'b', 'view reflects the replacement');
});
test('bus present but template reads no state reactively: replaceState fires onStateChange once, NOT zero', {
	timeout: 8000,
}, async () => {
	const tag = defineProbe({
		value: 'a',
	}, renderStatic, observeValue);
	const element = await mount(tag);
	assert.ok(element.stateBus, 'observe() created a reactive bus');
	element.stateChangeCount = 0;
	element.replaceState({
		value: 'b',
	});
	await element.nextFrame();
	assert.equal(element.stateChangeCount, 1, 'the unconditional onFlush → updateView still fires onStateChange once (the once-not-zero trap)');
});
test('assignState/patch regression guard: still fires onStateChange once', {
	timeout: 8000,
}, async () => {
	const tag = defineProbe({
		value: 'a',
	}, renderReactive);
	const element = await mount(tag);
	element.stateChangeCount = 0;
	element.assignState({
		value: 'b',
	});
	await element.nextFrame();
	assert.equal(element.stateChangeCount, 1, 'patch fires onStateChange once (unchanged by the fix)');
	assert.equal(root(element).querySelector('span').textContent, 'b');
});
test('await replaceState(): the awaited view reflects the new state (microtask ordering)', {
	timeout: 8000,
}, async () => {
	const tag = defineProbe({
		value: 'a',
	}, renderReactive);
	const element = await mount(tag);
	await element.replaceState({
		value: 'reflected',
	});
	assert.equal(root(element).querySelector('span').textContent, 'reflected', 'DOM patched before the await resumes');
});
test('N replaceState in one tick coalesce to a single onStateChange (notifyAll pendingAll)', {
	timeout: 8000,
}, async () => {
	const tag = defineProbe({
		value: 'a',
	}, renderReactive);
	const element = await mount(tag);
	element.stateChangeCount = 0;
	element.replaceState({
		value: 'b',
	});
	element.replaceState({
		value: 'c',
	});
	element.replaceState({
		value: 'd',
	});
	await element.nextFrame();
	assert.equal(element.stateChangeCount, 1, 'coalesced: one flush → one onStateChange for three same-tick replacements');
	assert.equal(root(element).querySelector('span').textContent, 'd', 'view reflects the last replacement');
});
