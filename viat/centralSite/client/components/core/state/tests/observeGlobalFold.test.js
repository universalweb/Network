import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * X15 (tk:37) — observeGlobal used to carry its own GlobalObserver class, which
 * was StateKeyObserver minus the `{ once: true }` tail and with `callback`
 * renamed to `handler`. The twin is gone; these tests pin the contract it was
 * responsible for, which had NO coverage before the fold.
 *
 * The load-bearing details are the ones a shared class could plausibly break:
 * handler `this` must be the observing component (that is why the observer
 * carries `component` at all), and `previousValue` must advance per fire rather
 * than sticking at the seed value.
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
const { globalState } = await import('../globalState.js');
const { observeGlobal } = await import('../subscriptions.js');
function flushMicrotasks() {
	return new Promise((resolve) => {
		setTimeout(resolve, 5);
	});
}
class ProbeGlobalObserver extends WebComponent {
	static state = {
		n: 0,
	};
	render() {
		this.html`<span>${this.state.n}</span>`;
	}
}
customElements.define('probe-global-observer', ProbeGlobalObserver);
async function mountProbe() {
	const element = document.createElement('probe-global-observer');
	document.body.appendChild(element);
	await element.pendingConnect;
	return element;
}
test('the callback fires with the component as `this`, and previousValue advances', async () => {
	globalState.setOne('foldKey', 'seed');
	const element = await mountProbe();
	const seen = [];
	function recordChange(nextValue, previousValue) {
		seen.push({
			thisIsComponent: this === element,
			nextValue,
			previousValue,
		});
	}
	observeGlobal.call(element, 'foldKey', recordChange);
	globalState.setOne('foldKey', 'first');
	await flushMicrotasks();
	globalState.setOne('foldKey', 'second');
	await flushMicrotasks();
	assert.equal(seen.length, 2, 'fired once per change');
	assert.equal(seen[0].thisIsComponent, true, 'handler `this` is the observing component');
	assert.equal(seen[0].nextValue, 'first');
	assert.equal(seen[0].previousValue, 'seed', 'seeded from the value at subscribe time');
	assert.equal(seen[1].nextValue, 'second');
	assert.equal(seen[1].previousValue, 'first', 'previousValue advanced — not stuck at the seed');
	element.remove();
});
test('a bare construct leaves the once-tail inert — it does not self-unsubscribe', async () => {
	globalState.setOne('foldOnce', 0);
	const element = await mountProbe();
	let fires = 0;
	function countFire() {
		fires += 1;
	}
	observeGlobal.call(element, 'foldOnce', countFire);
	globalState.setOne('foldOnce', 1);
	await flushMicrotasks();
	globalState.setOne('foldOnce', 2);
	await flushMicrotasks();
	assert.equal(fires, 2, 'observeGlobal is a durable subscription, not a one-shot');
	element.remove();
});
test('multi-key form observes every key', async () => {
	globalState.setOne('foldA', 'a0');
	globalState.setOne('foldB', 'b0');
	const element = await mountProbe();
	const seen = [];
	function recordAny(nextValue, previousValue, changedPath) {
		seen.push(changedPath);
	}
	observeGlobal.call(element, [
		'foldA',
		'foldB',
	], recordAny);
	globalState.setOne('foldA', 'a1');
	globalState.setOne('foldB', 'b1');
	await flushMicrotasks();
	assert.deepEqual(seen.sort(), [
		'foldA',
		'foldB',
	], 'both keys fired');
	element.remove();
});
