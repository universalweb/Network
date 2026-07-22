import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * onFlush no-op gate (ComponentStateBus.onFlush). When a flush leaves
 * `templateBuilt === true` (a purely SURGICAL spot batch — `bind()`/list/two-way
 * patched in place by drainSpots, no bare `${this.state.x}` renderDep to flip the
 * flag) AND the component declares no `onStateChange`, `updateView` is a proven
 * no-op that still allocates a promise every flush — so onFlush skips it.
 *
 * This is the ONLY suite that exercises the SKIP branch: every onStateChange.test
 * probe declares onStateChange (→ the don't-skip branch), leaving this path dark.
 * The distinguishing proof is the call-count spy: DOM-patched alone can't tell
 * "gate skipped updateView" from "gate ran a no-op updateView", because drainSpots
 * patches either way. Asserting updateView is NOT called on the surgical flush is
 * what pins the gate. Same happy-dom harness as onStateChange.test.js.
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
 * Surgical-spot probe: the template binds `value` via `this.bind('value')`, a
 * BindingSpot — NOT a bare `${this.state.value}` read. A bind() spot subscribes
 * its own bus path and patches through drainSpots; it records no renderDep, so
 * templateBuilt stays true across a value mutation. No onStateChange declared →
 * the surgical flush hits the skip branch.
 */
function defineSurgicalProbe() {
	const tag = `onflushgate-probe-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		render() {
			this.html`<span>${this.bind('value')}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
/*
 * Bare-read probe: `${this.state.value}` records a renderDep, so a value
 * mutation fires markRenderDirty → templateBuilt false → onFlush must NOT skip.
 * The complement that pins the gate to templateBuilt, not to "no hook" alone.
 */
function defineBareReadProbe() {
	const tag = `onflushgate-bare-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			value: 'a',
		};
		render() {
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
function spyUpdateView(element) {
	const spy = {
		calls: 0,
	};
	const baseUpdateView = WebComponent.prototype.updateView;
	element.updateView = function countingUpdateView() {
		spy.calls++;
		return baseUpdateView.call(this);
	};
	return spy;
}
test('surgical spot + no onStateChange: value mutation patches the DOM and skips updateView', {
	timeout: 8000,
}, async () => {
	const tag = defineSurgicalProbe();
	const element = await mount(tag);
	await element.nextFrame();
	assert.ok(element.stateBus, 'the bind() spot created a reactive bus');
	assert.equal(element.templateBuilt, true, 'first render left templateBuilt true (bind() records no renderDep)');
	assert.equal(root(element).querySelector('span').textContent, 'a', 'initial spot value rendered');
	/*
	 * Spy AFTER mount so the connect-pipeline renders don't count. On the surgical
	 * flush the gate must skip: 0 updateView calls, yet the spot still patches.
	 */
	const spy = spyUpdateView(element);
	element.state.value = 'b';
	await element.nextFrame();
	assert.equal(root(element).querySelector('span').textContent, 'b', 'drainSpots patched the spot in place');
	assert.equal(spy.calls, 0, 'onFlush skipped updateView on the surgical flush (the gate fired)');
	assert.equal(element.templateBuilt, true, 'templateBuilt stayed true — no structural re-render');
});
test('bare read + no onStateChange: renderDep flips templateBuilt, so onFlush does NOT skip', {
	timeout: 8000,
}, async () => {
	const tag = defineBareReadProbe();
	const element = await mount(tag);
	await element.nextFrame();
	assert.equal(root(element).querySelector('span').textContent, 'a', 'initial bare read rendered');
	const spy = spyUpdateView(element);
	element.state.value = 'b';
	await element.nextFrame();
	assert.ok(spy.calls >= 1, 'onFlush ran updateView (templateBuilt was flipped false by the renderDep)');
	assert.equal(root(element).querySelector('span').textContent, 'b', 'view re-rendered to the new value');
});
