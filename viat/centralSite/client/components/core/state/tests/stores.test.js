import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Phase 4a — named reactive stores accessed through the `this.stores` namespace:
 * `this.stores.<name>.path`. DOM-coupled (real components), so register happy-dom
 * BEFORE importing the core, then stub the file: stylesheet fetch (identical
 * harness to realm.test.js).
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
const { bind } = await import('../binding.js');
const { list } = await import('../../template.js');
const { Store } = await import('../globalState.js');
let probeSeq = 0;
function rowId(item) {
	return item.id;
}
/*
 * A named store is just a Store.create() the component declares via
 * `static stores = { <name>: store }` and reads as `this.stores.<name>.path`.
 * This is the reference consumer + copy-paste template for the feature.
 */
function defineStoreComponent(stores, staticState, renderBody) {
	const tag = `store-probe-${probeSeq++}`;
	class Probe extends WebComponent {
		static stores = stores;
		static state = staticState;
		render() {
			renderBody(this);
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
function root(element) {
	return element.shadowRoot ?? element;
}
test('this.stores.<name>.path renders the store value and reacts to store.set', async () => {
	const shop = Store.create();
	shop.set({
		count: 2,
	});
	const tag = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<span>${component.stores.shop.count}</span>`;
	});
	const element = await mount(tag);
	const span = root(element).querySelector('span');
	assert.equal(span.textContent, '2', 'store → DOM (initial)');
	shop.set({
		count: 7,
	});
	await element.nextFrame();
	assert.equal(span.textContent, '7', 'component re-rendered on the store write (via drainGlobalRenders)');
});
test('this.stores.<name>.path re-renders after store.replaceState (Phase 3 reset + realm)', async () => {
	const shop = Store.create();
	shop.set({
		label: 'first',
	});
	const tag = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<span>${component.stores.shop.label}</span>`;
	});
	const element = await mount(tag);
	assert.equal(root(element).querySelector('span').textContent, 'first');
	shop.replaceState({
		label: 'second',
	});
	await element.nextFrame();
	assert.equal(root(element).querySelector('span').textContent, 'second', 're-rendered against the reset store');
});
test('a store path does NOT collide with a same-named LOCAL state key (separate realms)', async () => {
	const shop = Store.create();
	shop.set({
		mode: 'STORE',
	});
	const tag = defineStoreComponent({
		shop,
	}, {
		mode: 'LOCAL',
	}, (component) => {
		component.html`<i>${component.state.mode}</i><b>${component.stores.shop.mode}</b>`;
	});
	const element = await mount(tag);
	assert.equal(root(element).querySelector('i').textContent, 'LOCAL', 'this.state.mode → local realm');
	assert.equal(root(element).querySelector('b').textContent, 'STORE', 'this.stores.shop.mode → store realm');
	element.state.mode = 'LOCAL2';
	await element.nextFrame();
	assert.equal(root(element).querySelector('i').textContent, 'LOCAL2', 'local write reflected');
	assert.equal(root(element).querySelector('b').textContent, 'STORE', 'store span untouched by the local write');
	shop.set({
		mode: 'STORE2',
	});
	await element.nextFrame();
	assert.equal(root(element).querySelector('b').textContent, 'STORE2', 'store write reflected');
	assert.equal(root(element).querySelector('i').textContent, 'LOCAL2', 'local span untouched by the store write');
});
test('a store named after a component METHOD coexists — the namespace removes the collision class entirely', async () => {
	const shop = Store.create();
	shop.set({
		count: 3,
	});
	const tag = `store-method-${probeSeq++}`;
	class MethodProbe extends WebComponent {
		static stores = {
			shop,
		};
		/*
		 * The whole point of the `this.stores` namespace: a method (or field)
		 * named `shop` lives on the component, the STORE named `shop` lives
		 * under `this.stores` — no shadowing in either direction.
		 */
		shop() {
			return 'method-result';
		}
		render() {
			this.html`<b>${this.stores.shop.count}</b>`;
		}
	}
	customElements.define(tag, MethodProbe);
	const element = await mount(tag);
	assert.equal(element.shop(), 'method-result', 'the component method named shop is untouched');
	assert.equal(root(element).querySelector('b').textContent, '3', 'the store named shop renders through the namespace');
	shop.set({
		count: 4,
	});
	await element.nextFrame();
	assert.equal(root(element).querySelector('b').textContent, '4', 'store reactivity intact alongside the method');
});
test('the stores namespace is enumerable and read-only', async () => {
	const shop = Store.create();
	const extra = Store.create();
	const tag = defineStoreComponent({
		shop,
		extra,
	}, {}, (component) => {
		component.html`<span>ok</span>`;
	});
	const element = await mount(tag);
	assert.deepEqual(Object.keys(element.stores).sort(), ['extra', 'shop'], 'Object.keys(this.stores) lists the declared store names');
	assert.ok('shop' in element.stores, '`in` sees a declared store');
	assert.equal(element.stores.missing, undefined, 'an undeclared name reads undefined (optional-chaining friendly)');
	assert.throws(() => {
		element.stores.shop = Store.create();
	}, /read-only/, 'assigning through the namespace throws');
	assert.throws(() => {
		delete element.stores.shop;
	}, /cannot be deleted/, 'deleting through the namespace throws');
});
test('a store shared by two components re-renders BOTH on a single write', async () => {
	const shop = Store.create();
	shop.set({
		n: 1,
	});
	const tagA = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<span>${component.stores.shop.n}</span>`;
	});
	const tagB = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<b>${component.stores.shop.n}</b>`;
	});
	const elementA = await mount(tagA);
	const elementB = await mount(tagB);
	assert.equal(root(elementA).querySelector('span').textContent, '1');
	assert.equal(root(elementB).querySelector('b').textContent, '1');
	shop.set({
		n: 9,
	});
	await elementA.nextFrame();
	await elementB.nextFrame();
	assert.equal(root(elementA).querySelector('span').textContent, '9', 'component A re-rendered from the shared store');
	assert.equal(root(elementB).querySelector('b').textContent, '9', 'component B re-rendered from the shared store');
});
test('static stores merges on subclass — inherited AND own stores are reactive', async () => {
	const parentStore = Store.create();
	parentStore.set({
		p: 'P',
	});
	const childStore = Store.create();
	childStore.set({
		c: 'C',
	});
	const parentTag = `store-parent-${probeSeq++}`;
	class ParentProbe extends WebComponent {
		static stores = {
			parentStore,
		};
		render() {
			this.html`<i>${this.stores.parentStore.p}</i>`;
		}
	}
	customElements.define(parentTag, ParentProbe);
	const childTag = `store-child-${probeSeq++}`;
	class ChildProbe extends ParentProbe {
		static stores = {
			childStore,
		};
		render() {
			this.html`<i>${this.stores.parentStore.p}</i><b>${this.stores.childStore.c}</b>`;
		}
	}
	customElements.define(childTag, ChildProbe);
	const element = await mount(childTag);
	assert.equal(root(element).querySelector('i').textContent, 'P', 'inherited parent store accessible on the child');
	assert.equal(root(element).querySelector('b').textContent, 'C', 'child-declared store accessible');
	parentStore.set({
		p: 'P2',
	});
	await element.nextFrame();
	assert.equal(root(element).querySelector('i').textContent, 'P2', 'child reacts to the INHERITED store');
	childStore.set({
		c: 'C2',
	});
	await element.nextFrame();
	assert.equal(root(element).querySelector('b').textContent, 'C2', 'child reacts to its OWN store');
});
test('disconnect tears down the store renderDep (a shared store outlives the component — no detached leak)', async () => {
	const shop = Store.create();
	shop.set({
		count: 0,
	});
	const tag = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<span>${component.stores.shop.count}</span>`;
	});
	const element = await mount(tag);
	assert.ok(shop.bus.subs.has('count'), 'store bus holds the renderDep while connected');
	await element.handleDisconnect();
	assert.equal(shop.bus.subs.has('count'), false, 'store renderDep unsubscribed on disconnect (clearRealmUnsubs sweeps the store realm)');
	/*
	 * The store outlives the detached component — a later write must not fault
	 * or re-fire a handler on it. With the sub gone, the flush is a clean no-op.
	 */
	shop.set({
		count: 5,
	});
	shop.bus.flush();
	assert.ok(true, 'store write after disconnect did not fault the detached component');
});
/* ── Keyed STORE bindings (Phase 4b) — the `stores.<name>.<path>` channel in
 *   bind()/list(), resolved against `static stores` at spot install. ──────── */
test('bind("stores.shop.count") — a keyed content spot reads the store and reacts', async () => {
	const shop = Store.create();
	shop.set({
		count: 1,
	});
	const tag = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<b>${bind('stores.shop.count')}</b>`;
	});
	const element = await mount(tag);
	const node = root(element).querySelector('b');
	assert.equal(node.textContent, '1', 'store-keyed bind renders the store value');
	shop.set({
		count: 8,
	});
	await element.nextFrame();
	assert.equal(node.textContent, '8', 'store-keyed bind spot reacts to a store write');
});
test('list("stores.shop.items") — a keyed list renders store rows and reacts to a store write', async () => {
	const shop = Store.create();
	shop.set({
		items: [
			{
				id: 1,
			},
			{
				id: 2,
			},
		],
	});
	const tag = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<ul>${list('stores.shop.items', 'div', rowId)}</ul>`;
	});
	const element = await mount(tag);
	const listRoot = root(element).querySelector('ul');
	assert.equal(listRoot.querySelectorAll('div').length, 2, 'initial rows from the STORE');
	shop.set({
		items: [
			{
				id: 1,
			},
			{
				id: 2,
			},
			{
				id: 3,
			},
		],
	});
	await element.nextFrame();
	assert.equal(listRoot.querySelectorAll('div').length, 3, 'store-keyed list re-renders on the store write');
});
test('a store-keyed list re-renders after store.replaceState (reset flows through the spot)', async () => {
	const shop = Store.create();
	shop.set({
		items: [
			{
				id: 1,
			},
		],
	});
	const tag = defineStoreComponent({
		shop,
	}, {}, (component) => {
		component.html`<ul>${list('stores.shop.items', 'div', rowId)}</ul>`;
	});
	const element = await mount(tag);
	const listRoot = root(element).querySelector('ul');
	assert.equal(listRoot.querySelectorAll('div').length, 1);
	shop.replaceState({
		items: [
			{
				id: 7,
			},
			{
				id: 8,
			},
		],
	});
	await element.nextFrame();
	assert.equal(listRoot.querySelectorAll('div').length, 2, 'notifyAll reset reached the store-keyed list spot');
});
test('a path-less store key throws at authoring; an undeclared store throws at spot install', async () => {
	assert.throws(() => {
		return bind('stores.shop');
	}, /WITHIN the store/, 'stores.<name> without a path is an authoring error');
	let captured = null;
	const tag = `store-ghost-${probeSeq++}`;
	class GhostProbe extends WebComponent {
		render() {
			this.html`<b>${bind('stores.ghost.x')}</b>`;
		}
		constructor() {
			super();
			this.addEventListener('renderError', this);
		}
		/*
		 * A throw during template build is a RENDER failure: the pipeline
		 * contains it (renderView never rejects) and routes it to the
		 * 'renderError' event, not to 'lifecycleError'. preventDefault marks
		 * it handled — no loud rethrow.
		 */
		handleEvent(domEvent) {
			domEvent.preventDefault();
			captured = domEvent.detail.data;
		}
	}
	customElements.define(tag, GhostProbe);
	await mount(tag);
	assert.match(String(captured?.message), /declares no store "ghost"/, 'binding an undeclared store surfaces a clear install-time error');
});
