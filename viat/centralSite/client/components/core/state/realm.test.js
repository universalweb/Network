import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * The reactivity core is DOM-coupled and `WebComponent extends HTMLElement`, so
 * the happy-dom globals must exist BEFORE the core module graph loads. Register
 * first, then dynamic-import the core (static imports would hoist above this).
 */
GlobalRegistrator.register();
/*
 * The core eagerly resolves its base stylesheets via `fetch(file://…)` at module
 * load (styles/manifest.js). happy-dom's fetch rejects the `file:` scheme, so
 * stub it to hand back empty CSS — the realm/binding behavior under test is
 * style-independent. Must be set after register() (which installs happy-dom's
 * fetch) and before the core import.
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
const {
	WebComponent, classList,
} = await import('../base.js');
const { bind } = await import('./binding.js');
const { list } = await import('../template.js');
const { globalState } = await import('./globalState.js');
function rowId(item) {
	return item.id;
}
let probeSeq = 0;
function defineProbe(body) {
	const tag = `probe-counter-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = {
			count: 0,
		};
		render() {
			body(this);
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
/* `handleConnect` (the async lifecycle that ends in the first render) is stored
 * on `this.pendingConnect`; awaiting it is the deterministic first-render flush.
 * Reactive re-renders batch through the scheduler, drained on `nextFrame()`. */
async function mount(tag) {
	const el = document.createElement(tag);
	document.body.appendChild(el);
	await el.pendingConnect;
	return el;
}
function root(el) {
	return el.shadowRoot ?? el;
}
test('harness: a component renders state and reacts to a mutation', async () => {
	const tag = defineProbe((component) => {
		component.html `<span>${component.state.count}</span>`;
	});
	const el = await mount(tag);
	const span = root(el).querySelector('span');
	assert.ok(span, 'rendered a <span>');
	assert.equal(span.textContent, '0');
	el.state.count = 5;
	await el.nextFrame();
	assert.equal(span.textContent, '5', 'reactive update reflected');
});
function defineComponent(staticState, renderBody) {
	const tag = `probe-counter-${probeSeq++}`;
	class Probe extends WebComponent {
		static state = staticState;
		render() {
			renderBody(this);
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
/* ── Group A: LOCAL bindings (must stay green through Phase 2) ───────────── */
test('A: $value="key" two-way on local state round-trips DOM↔state', async () => {
	const tag = defineComponent({
		name: 'ada',
	}, (component) => {
		component.html `<input $value="name">`;
	});
	const el = await mount(tag);
	const input = root(el).querySelector('input');
	assert.equal(input.value, 'ada', 'state → DOM (initial)');
	input.value = 'grace';
	input.dispatchEvent(new Event('input'));
	assert.equal(el.state.name, 'grace', 'DOM → state (writeback)');
	el.state.name = 'lin';
	await el.nextFrame();
	assert.equal(input.value, 'lin', 'state → DOM (reactive)');
});
test('A2: inferred two-way value=${() => state.x} round-trips (uses realmForKey)', async () => {
	const tag = defineComponent({
		city: 'oslo',
	}, (component) => {
		component.html `<input value=${() => {
			return component.state.city;
		}}>`;
	});
	const el = await mount(tag);
	const input = root(el).querySelector('input');
	assert.equal(input.value, 'oslo', 'state → DOM (initial)');
	input.value = 'kyoto';
	input.dispatchEvent(new Event('input'));
	assert.equal(el.state.city, 'kyoto', 'DOM → state writeback wired');
});
/* ── Group B: GLOBAL read via this.global (must stay green) ──────────────── */
test('B: this.global.<key> renders and reacts to globalState.set', async () => {
	const key = `probeTheme${probeSeq}`;
	globalState.set({
		[key]: 'dark',
	});
	const tag = defineComponent({}, (component) => {
		component.html `<span>${component.global[key]}</span>`;
	});
	const el = await mount(tag);
	const span = root(el).querySelector('span');
	assert.equal(span.textContent, 'dark', 'global → DOM (initial)');
	globalState.set({
		[key]: 'light',
	});
	await el.nextFrame();
	assert.equal(span.textContent, 'light', 'global mutation reflected');
});
/* ── Group C: latent 2007 bug — non-anchored reactive bind('x') content spot.
 *   RED until the keyDepMap fix lands. ──────────────────────────────────── */
test('C: ${this.bind("msg")} (sole child, reactive) subscribes without throwing', async () => {
	const tag = defineComponent({
		msg: 'hi',
	}, (component) => {
		component.html `<div>${bind('msg')}</div>`;
	});
	const el = await mount(tag);
	const div = root(el).querySelector('div');
	assert.equal(div.textContent, 'hi', 'initial bind render');
	el.state.msg = 'bye';
	await el.nextFrame();
	assert.equal(div.textContent, 'bye', 'bind spot reacts to state change');
});
/* ── Group D: invariant — DataBindSpot ($value/data-bind) is LOCAL-ONLY.
 *   It reads component.STATE and writes stateProxy directly; it never consults
 *   realmForKey, so a key like `global.x` is a literal LOCAL path (no misroute).
 *   Passes today; must stay green. ───────────────────────────────────────── */
test('D: $value="global.x" via DataBindSpot reads LOCAL state, never the global store', async () => {
	globalState.set({
		x: 'GLOBAL-WRONG',
	});
	const tag = defineComponent({
		global: {
			x: 'local-right',
		},
	}, (component) => {
		component.html `<input $value="global.x">`;
	});
	const el = await mount(tag);
	const input = root(el).querySelector('input');
	assert.equal(input.value, 'local-right', 'DataBindSpot resolves global.x against LOCAL state');
});
/* ── Group E: invariant — a LOCAL top-level key NAMED `global` is local, never
 *   the global store. `value=${() => this.state.global}` is a single dep 'global'
 *   (no `.` suffix), so it resolves local and two-way round-trips to LOCAL.
 *   Guards the flag-carry design: scope comes from the binding, not from the key
 *   string spelling. (The `global.x` misroute is unreachable in practice —
 *   nested access is multi-dep so two-way inference bails before realm
 *   resolution, and data-bind is local-only — so it can't be exercised here.) */
test('E: inferred two-way to a top-level key named `global` round-trips to LOCAL', async () => {
	globalState.set({
		global: 'GLOBAL-WRONG',
	});
	const tag = defineComponent({
		global: 'local-seed',
	}, (component) => {
		component.html `<input value=${() => {
			return component.state.global;
		}}>`;
	});
	const el = await mount(tag);
	const input = root(el).querySelector('input');
	assert.equal(input.value, 'local-seed', 'reads LOCAL state.global, not globalState.global');
	input.value = 'typed';
	input.dispatchEvent(new Event('input'));
	assert.equal(el.state.global, 'typed', 'writeback reaches LOCAL state.global');
});
/* ── Group F: GLOBAL keyed binding — bind('global.x') resolves to the global
 *   store (the intended `global.` precedence). Must stay green. ──────────── */
test('F: ${bind("global.gx")} resolves to the GLOBAL store', async () => {
	globalState.set({
		gx: 'from-global',
	});
	const tag = defineComponent({}, (component) => {
		component.html `<b>${bind('global.gx')}</b>`;
	});
	const el = await mount(tag);
	const node = root(el).querySelector('b');
	assert.equal(node.textContent, 'from-global', 'global. keyed binding reads globalState');
});
/* ── Group G: classList with a keyed Binding item resolves the LOCAL realm
 *   (exercises realmForKey in the class-list path). Must stay green. ─────── */
test('G: classList(base, bind("extra")) reads LOCAL state for the token', async () => {
	const tag = defineComponent({
		extra: 'hot',
	}, (component) => {
		component.html `<span class=${classList('base', bind('extra'))}></span>`;
	});
	const el = await mount(tag);
	const span = root(el).querySelector('span');
	assert.ok(span.classList.contains('base'), 'static token present');
	assert.ok(span.classList.contains('hot'), 'keyed token from LOCAL state present');
	el.state.extra = 'cold';
	await el.nextFrame();
	assert.ok(span.classList.contains('cold'), 'classList reacts to local state change');
	assert.ok(!span.classList.contains('hot'), 'stale token removed');
});
/* ── Group H: LOCAL list() spot (exercises ListSpot.refresh →
 *   resolveBindingValue with the carried flag). Must stay green. ─────────── */
test('H: list("items", "div", keyFn) renders LOCAL rows and reacts to mutation', async () => {
	const tag = defineComponent({
		items: [
			{
				id: 1,
			},
			{
				id: 2,
			},
		],
	}, (component) => {
		component.html `<ul>${list('items', 'div', rowId)}</ul>`;
	});
	const el = await mount(tag);
	const ul = root(el).querySelector('ul');
	assert.equal(ul.querySelectorAll('div').length, 2, 'initial row count from LOCAL state.items');
	el.state.items = [
		{
			id: 1,
		},
		{
			id: 2,
		},
		{
			id: 3,
		},
	];
	await el.nextFrame();
	assert.equal(ul.querySelectorAll('div').length, 3, 'list spot re-renders on LOCAL items mutation');
});
/* ── Group I: ANCHORED binding — a static sibling forces the comment-anchored
 *   partial path (installAnchoredTextSpot), the contrast to C's sole-child
 *   non-anchored path. Must stay green. ─────────────────────────────────── */
test('I: ${bind("msg")} beside static text uses the anchored path and reacts', async () => {
	const tag = defineComponent({
		msg: 'hi',
	}, (component) => {
		component.html `<div>prefix ${bind('msg')}</div>`;
	});
	const el = await mount(tag);
	const div = root(el).querySelector('div');
	assert.match(div.textContent, /prefix\s*hi/, 'anchored bind renders beside the static sibling');
	el.state.msg = 'bye';
	await el.nextFrame();
	assert.match(div.textContent, /prefix\s*bye/, 'anchored bind spot reacts to state change');
});
