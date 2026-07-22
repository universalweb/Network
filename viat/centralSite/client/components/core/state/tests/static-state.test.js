import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Construction-time `static state` materialization: per-instance smartClone isolation,
 * the "clone only what the provided state is missing" merge optimization, and
 * function-valued state (both the `static state = () => ({…})` form, resolved once at
 * merge time, and the `Klass.create(() => ({…}))` constructor-arg form, resolved per
 * construction). Mirrors realm.test.js's load order — register happy-dom and stub the
 * stylesheet fetch BEFORE the DOM-coupled core graph loads.
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
async function mount(tag) {
	const domElement = document.createElement(tag);
	document.body.appendChild(domElement);
	await domElement.pendingConnect;
	return domElement;
}
const ISOLATION_TAG = 'probe-isolation';
class ProbeIsolation extends WebComponent {
	static state = {
		count: 0,
		items: [],
		nested: {
			label: 'base',
		},
	};
	render() {
		this.html`<i>${this.state.count}</i>`;
	}
}
customElements.define(ISOLATION_TAG, ProbeIsolation);
test('two instances of the same component own DISTINCT container objects (smartClone isolation)', async () => {
	const first = await mount(ISOLATION_TAG);
	const second = await mount(ISOLATION_TAG);
	assert.notEqual(first.STATE.items, second.STATE.items, 'each instance owns its own items array');
	assert.notEqual(first.STATE.nested, second.STATE.nested, 'each instance owns its own nested object');
	first.state.items.push('only-first');
	first.state.nested.label = 'mutated-first';
	assert.equal(second.state.items.length, 0, 'mutating the first array does not bleed into the second');
	assert.equal(second.state.nested.label, 'base', 'mutating the first nested object does not bleed into the second');
});
test('primitive defaults are shared by value, never cloned', async () => {
	const first = await mount(ISOLATION_TAG);
	const second = await mount(ISOLATION_TAG);
	first.state.count = 5;
	assert.equal(second.state.count, 0, 'a primitive write to one instance leaves the other at its default');
});
const PROVIDED_TAG = 'probe-provided';
class ProbeProvided extends WebComponent {
	static state = {
		provided: {
			fromStatic: true,
		},
		defaulted: {
			fromStatic: true,
		},
	};
	render() {
		this.html`<i></i>`;
	}
}
customElements.define(PROVIDED_TAG, ProbeProvided);
test('a provided key is adopted by reference (not cloned); a missing key falls back to a cloned default', async () => {
	const providedObject = {
		fromCaller: true,
	};
	const first = await ProbeProvided.create({
		provided: providedObject,
	});
	assert.equal(first.STATE.provided, providedObject, 'provided key adopted by reference — no wasteful clone-then-discard');
	assert.equal(first.STATE.defaulted.fromStatic, true, 'missing key fell back to the static default');
	const second = await ProbeProvided.create({
		provided: providedObject,
	});
	assert.notEqual(first.STATE.defaulted, second.STATE.defaulted, 'each instance still owns a distinct cloned default for the missing key');
	assert.equal(second.STATE.provided, providedObject, 'both adopt the SAME provided reference (caller-owned, shared)');
});
const STATIC_FN_TAG = 'probe-static-fn';
class ProbeStaticFn extends WebComponent {
	static state() {
		return {
			label: 'computed',
			rows: [
				'a',
				'b',
			],
		};
	}
	render() {
		this.html`<i>${this.state.label}</i>`;
	}
}
customElements.define(STATIC_FN_TAG, ProbeStaticFn);
test('static state declared as a function is invoked and its return used as the template', async () => {
	const first = await mount(STATIC_FN_TAG);
	const second = await mount(STATIC_FN_TAG);
	assert.equal(first.state.label, 'computed', 'function return folded into the merged template');
	assert.deepEqual([...first.state.rows], [
		'a',
		'b',
	], 'computed container materialized');
	assert.notEqual(first.STATE.rows, second.STATE.rows, 'per-instance smartClone still isolates the computed container');
});
const CTOR_FN_TAG = 'probe-ctor-fn';
class ProbeCtorFn extends WebComponent {
	static state = {
		seeded: false,
	};
	render() {
		this.html`<i></i>`;
	}
}
customElements.define(CTOR_FN_TAG, ProbeCtorFn);
test('a function constructor-arg state is invoked per construction and overlays the static defaults', async () => {
	let calls = 0;
	function makeState() {
		calls += 1;
		return {
			seeded: true,
			runId: calls,
		};
	}
	const first = await ProbeCtorFn.create(makeState);
	const second = await ProbeCtorFn.create(makeState);
	assert.equal(first.STATE.seeded, true, 'function return overlaid the static default');
	assert.equal(first.STATE.runId, 1, 'function invoked for the first construction');
	assert.equal(second.STATE.runId, 2, 'function invoked AGAIN for the second construction (fresh per instance)');
});
