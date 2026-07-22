import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Integration coverage for the explicit state channel: `.state.path=` deep
 * assignment into a CHILD's reactive state, and `.method(${value})` invocation.
 * Mirrors realm.test.js's load order — register the happy-dom globals and stub
 * the file: stylesheet fetch BEFORE the DOM-coupled core graph loads.
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
const { list } = await import('../../template.js');
async function mount(tag) {
	const domElement = document.createElement(tag);
	document.body.appendChild(domElement);
	await domElement.pendingConnect;
	return domElement;
}
function root(domElement) {
	return domElement.shadowRoot ?? domElement;
}
const CHILD_TAG = 'probe-deep-child';
class ProbeDeepChild extends WebComponent {
	static state = {
		dot: false,
		size: 'md',
	};
	growCalls = [];
	grow(value) {
		this.growCalls.push(value);
	}
	render() {
		this.html`<i>${this.state.size}</i>`;
	}
}
customElements.define(CHILD_TAG, ProbeDeepChild);
const PARENT_TAG = 'probe-deep-parent';
class ProbeDeepParent extends WebComponent {
	static state = {
		flag: true,
		amount: 1,
	};
	render() {
		this.html`<probe-deep-child .state.dot=${this.state.flag} .state.size=${'sm'} .grow(${this.state.amount})></probe-deep-child>`;
	}
}
customElements.define(PARENT_TAG, ProbeDeepParent);
test('.state.path= deep-writes a child key; .method() calls with arg-diff', async () => {
	const parentEl = await mount(PARENT_TAG);
	const child = root(parentEl).querySelector(CHILD_TAG);
	assert.ok(child, 'child element rendered into the parent shadow');
	await child.pendingConnect;
	assert.equal(child.state.dot, true, '.state.dot= wrote the child reactive state');
	assert.equal(child.state.size, 'sm', '.state.size= wrote the child reactive state');
	assert.deepEqual(child.growCalls, [1], '.grow(1) invoked once on first render');
	parentEl.state.amount = 2;
	await parentEl.nextFrame();
	assert.deepEqual(child.growCalls, [
		1,
		2,
	], '.grow re-invoked with the changed arg');
	parentEl.state.flag = false;
	await parentEl.nextFrame();
	assert.equal(child.state.dot, false, '.state.dot= reactively re-wrote the child key');
	assert.deepEqual(child.growCalls, [
		1,
		2,
	], 'arg-diff: .grow NOT re-invoked when its arg is unchanged');
});
test('a state key with NO hand-written accessor is reachable only via .state.key=', async () => {
	const parentEl = await mount(PARENT_TAG);
	const child = root(parentEl).querySelector(CHILD_TAG);
	await child.pendingConnect;
	assert.equal(Object.getOwnPropertyDescriptor(child, 'dot'), undefined, 'no own data property shadowing state');
	assert.equal(child.state.dot, true, 'value lives in reactive state, not on the element');
});
const ORDER_PARENT_TAG = 'probe-order-parent';
class ProbeOrderParent extends WebComponent {
	static state = {
		whole: {
			dot: false,
			size: 'lg',
		},
		override: true,
	};
	render() {
		this.html`<probe-deep-child .state=${this.state.whole} .state.dot=${this.state.override}></probe-deep-child>`;
	}
}
customElements.define(ORDER_PARENT_TAG, ProbeOrderParent);
test('.state.key= written after .state={} overlays the whole-object value (source order)', async () => {
	const parentEl = await mount(ORDER_PARENT_TAG);
	const child = root(parentEl).querySelector(CHILD_TAG);
	await child.pendingConnect;
	assert.equal(child.state.dot, true, '.state.dot= (later slot) overlays the whole-object dot:false');
	assert.equal(child.state.size, 'lg', 'whole-object key with no nested override survives the merge');
});
const STYLE_PARENT_TAG = 'probe-style-parent';
class ProbeStyleParent extends WebComponent {
	render() {
		this.html`<span style=${{
			color: 'red',
			fontSize: '10px',
		}}></span><b .style=${'color: blue;'}></b>`;
	}
}
customElements.define(STYLE_PARENT_TAG, ProbeStyleParent);
test('state-channel changes do NOT interfere with style=${obj} or .style=${cssText}', async () => {
	const parentEl = await mount(STYLE_PARENT_TAG);
	const span = root(parentEl).querySelector('span');
	const bold = root(parentEl).querySelector('b');
	assert.equal(span.style.color, 'red', 'style=${obj} still serializes through applyStyleObject');
	assert.equal(span.style.getPropertyValue('font-size'), '10px', 'camelCase style key still kebab-cased');
	assert.equal(bold.style.color, 'blue', '.style=${cssText} still assigns el.style directly (skips the state branch)');
});
/*
 * Deep-state pre-init rescue. The resolver imports a child's module
 * asynchronously and the render path does NOT await it (resolver.js) — so a
 * parent can commit `.state.x=` onto a child that is still an undefined element
 * (no live `.state`). The commit fallthrough stashes that as a dotted own
 * property `element['state.x']`; on upgrade, the constructor's
 * upgradeShadowedProperties must route it into reactive state, mirroring the
 * old auto-router's own-prop rescue — else the codemod silently drops a
 * parent's first-render deep write onto a lazily-loaded child.
 *
 * happy-dom does not fire custom-element upgrade reactions (defining a class
 * leaves an existing element as HTMLElement), so the full lazy-upgrade flow is
 * not reproducible in-harness. The rescue is driven directly: seed the dotted
 * own-prop the fallthrough would write, then run the rescue. The test still
 * exercises the exact new branch (a dotted key has no prototype setter, so
 * without the rescue the value never reaches state).
 */
test('upgradeShadowedProperties rescues a pre-init .state.x= dotted own-prop into reactive state', async () => {
	const domElement = await mount(CHILD_TAG);
	Object.defineProperty(domElement, 'state.size', {
		value: 'lg',
		writable: true,
		enumerable: true,
		configurable: true,
	});
	Object.defineProperty(domElement, 'state.dot', {
		value: true,
		writable: true,
		enumerable: true,
		configurable: true,
	});
	domElement.upgradeShadowedProperties();
	assert.equal(domElement.state.size, 'lg', 'dotted state.size pre-init stash rescued into reactive state');
	assert.equal(domElement.state.dot, true, 'dotted state.dot pre-init stash rescued into reactive state');
});
/*
 * `.state=` carry-down. Mirrors the live GlobalDock → UIDock → DockIconButton
 * chain: a `dock` object (with an `items` array) passed down by `.state=`, the
 * mid level rendering those items through `list(…, ChildClass)`. The shared
 * reference makes a deep write reactive from EITHER origin — the fix is that an
 * ANCESTOR-origin deep write now reaches the leaf (previously only the
 * descendant-origin double-proxy write did).
 */
const CARRY_LEAF_TAG = 'probe-carry-leaf';
class ProbeCarryLeaf extends WebComponent {
	static state = {
		id: '',
		tooltip: '',
	};
	render() {
		this.html`<i>${this.state.tooltip}</i>`;
	}
}
customElements.define(CARRY_LEAF_TAG, ProbeCarryLeaf);
const CARRY_MID_TAG = 'probe-carry-mid';
class ProbeCarryMid extends WebComponent {
	static state = {
		items: [],
	};
	render() {
		this.html`<div>${list('items', ProbeCarryLeaf)}</div>`;
	}
}
customElements.define(CARRY_MID_TAG, ProbeCarryMid);
const CARRY_TOP_TAG = 'probe-carry-top';
class ProbeCarryTop extends WebComponent {
	static state = {
		dock: {
			items: [
				{
					id: 'a',
					tooltip: 'A',
				},
				{
					id: 'b',
					tooltip: 'B',
				},
			],
		},
	};
	render() {
		this.html`<probe-carry-mid .state=${this.state.dock}></probe-carry-mid>`;
	}
}
customElements.define(CARRY_TOP_TAG, ProbeCarryTop);
async function mountCarryTrio() {
	const topEl = await mount(CARRY_TOP_TAG);
	const mid = root(topEl).querySelector(CARRY_MID_TAG);
	await mid.pendingConnect;
	const leaves = root(mid).querySelectorAll(CARRY_LEAF_TAG);
	await leaves[0].pendingConnect;
	await leaves[1].pendingConnect;
	return {
		topEl,
		mid,
		leaves,
	};
}
function leafText(leaf) {
	return root(leaf).querySelector('i').textContent;
}
test('.state= passes the object down by reference and renders each list leaf', async () => {
	const {
		topEl, mid, leaves,
	} = await mountCarryTrio();
	assert.equal(leafText(leaves[0]), 'A', 'first leaf rendered its tooltip through the list');
	assert.equal(leafText(leaves[1]), 'B', 'second leaf rendered its tooltip through the list');
	topEl.state.dock.items[0].tooltip = 'shared-check';
	assert.equal(mid.state.items[0].tooltip, 'shared-check', 'parent and child read the SAME underlying item data (shared, not cloned)');
});
test('ancestor-origin deep write flows to the leaf (.state= carry-down fix)', async () => {
	const {
		topEl, mid, leaves,
	} = await mountCarryTrio();
	topEl.state.dock.items[0].tooltip = 'Z';
	await topEl.nextFrame();
	await topEl.nextFrame();
	assert.equal(mid.state.items[0].tooltip, 'Z', 'shared array reflects the ancestor-origin write');
	assert.equal(leafText(leaves[0]), 'Z', 'leaf re-rendered from the forwarded deep path');
	assert.equal(leafText(leaves[1]), 'B', 'untouched sibling leaf is unchanged');
});
test('descendant-origin deep write still flows to the leaf (regression, no double-render)', async () => {
	const {
		mid, leaves,
	} = await mountCarryTrio();
	mid.state.items[1].tooltip = 'Y';
	await mid.nextFrame();
	await mid.nextFrame();
	assert.equal(leafText(leaves[1]), 'Y', 'leaf re-rendered from the descendant-origin write');
	assert.equal(root(leaves[1]).querySelectorAll('i').length, 1, 'leaf patched in place — no duplicate render node');
});
test('a batch of sibling deep writes at the ancestor each reach their leaf', async () => {
	const {
		topEl, leaves,
	} = await mountCarryTrio();
	topEl.state.dock.items[0].tooltip = 'A2';
	topEl.state.dock.items[1].tooltip = 'B2';
	await topEl.nextFrame();
	await topEl.nextFrame();
	assert.equal(leafText(leaves[0]), 'A2', 'first sibling forwarded');
	assert.equal(leafText(leaves[1]), 'B2', 'second sibling forwarded (multiPath batch, not just the first)');
});
test('whole-object re-assign at the ancestor re-merges through the child (.state= top-level branch)', async () => {
	const {
		topEl, mid,
	} = await mountCarryTrio();
	topEl.state.dock = {
		items: [
			{
				id: 'c',
				tooltip: 'C',
			},
		],
	};
	await topEl.nextFrame();
	await topEl.nextFrame();
	assert.equal(mid.state.items.length, 1, 'child re-merged the replacement object');
	const leaf = root(mid).querySelector(CARRY_LEAF_TAG);
	assert.equal(leafText(leaf), 'C', 'leaf reflects the replacement item');
});
/*
 * Cross-namespace teardown guard. The carrier subscription lives on the SOURCE
 * bus keyed by the SOURCE path ('dock'); a child that ALSO observes its own
 * same-named key ('dock') must not lose the bridge when it unobserves that key.
 * The carrier is held off the child's `stateUnsubs` path-tracker entirely (only
 * on `child.stateCarrier`), so `unobserve('dock')` → `removeByKey('dock')` can
 * never reach it. Asserted SYNCHRONOUSLY — a later render would relink and mask
 * a regression.
 */
const COLLIDE_CHILD_TAG = 'probe-collide-child';
class ProbeCollideChild extends WebComponent {
	static state = {
		dock: false,
		items: [],
	};
	render() {
		this.html`<div>${list('items', ProbeCarryLeaf)}</div>`;
	}
}
customElements.define(COLLIDE_CHILD_TAG, ProbeCollideChild);
const COLLIDE_PARENT_TAG = 'probe-collide-parent';
class ProbeCollideParent extends WebComponent {
	static state = {
		dock: {
			items: [
				{
					id: 'a',
					tooltip: 'A',
				},
			],
		},
	};
	render() {
		this.html`<probe-collide-child .state=${this.state.dock}></probe-collide-child>`;
	}
}
customElements.define(COLLIDE_PARENT_TAG, ProbeCollideParent);
test('carrier survives unobserve() of a same-named own key (no cross-namespace teardown)', async () => {
	const parentEl = await mount(COLLIDE_PARENT_TAG);
	const child = root(parentEl).querySelector(COLLIDE_CHILD_TAG);
	await child.pendingConnect;
	assert.ok(child.stateCarrier, 'carrier bridge installed for the shared dock subtree');
	assert.equal(child.stateCarrier.sourcePath, 'dock', 'carrier keyed on the SOURCE path');
	let dockObservations = 0;
	function onDockChange() {
		dockObservations += 1;
	}
	child.observe('dock', onDockChange);
	child.unobserve('dock');
	assert.ok(child.stateCarrier.subscription.handler, 'carrier subscription still LIVE after unobserve of the same-named own key');
	const childLeaf = root(child).querySelector(CARRY_LEAF_TAG);
	parentEl.state.dock.items[0].tooltip = 'LIVE';
	await parentEl.nextFrame();
	await parentEl.nextFrame();
	assert.equal(leafText(childLeaf), 'LIVE', 'bridge still delivers ancestor-origin deep writes after the unobserve');
});
/*
 * Root carrier guard. `.state=${this.state}` passes the WHOLE state — its
 * carrier path is '' (the tracking-proxy root). A '' prefix has nothing to strip
 * and a '' subscription never matches a deep path, so the bridge is skipped
 * outright (no dead subscription, no garbage-path forward). Whole-state sharing
 * keeps its existing render-driven behavior.
 */
const WHOLE_PARENT_TAG = 'probe-whole-parent';
class ProbeWholeParent extends WebComponent {
	static state = {
		items: [
			{
				id: 'a',
				tooltip: 'A',
			},
		],
	};
	render() {
		this.html`<probe-carry-mid .state=${this.state}></probe-carry-mid>`;
	}
}
customElements.define(WHOLE_PARENT_TAG, ProbeWholeParent);
test('.state=${this.state} (root carrier, path "") installs no bridge', async () => {
	const parentEl = await mount(WHOLE_PARENT_TAG);
	const mid = root(parentEl).querySelector(CARRY_MID_TAG);
	await mid.pendingConnect;
	assert.equal(mid.stateCarrier, undefined, 'root-carrier whole-state pass skips the bridge (path "" guarded)');
	const leaf = root(mid).querySelector(CARRY_LEAF_TAG);
	assert.equal(leafText(leaf), 'A', 'whole-state pass still renders each leaf via the shared reference');
});
/*
 * Teardown — the carrier is a FOREIGN-bus subscription held off `stateUnsubs`,
 * so `handleDisconnect` must release it explicitly (`unlinkStateCarrier`). Drives
 * the disconnect directly (its sole runtime path) and asserts the subscription is
 * gone from the SOURCE bus, not merely flagged — a leaked foreign-bus sub would
 * keep firing into a dead child.
 */
test('handleDisconnect releases the carrier from the source bus (no foreign-bus leak)', async () => {
	const {
		topEl, mid,
	} = await mountCarryTrio();
	const carrierSub = mid.stateCarrier.subscription;
	assert.ok(carrierSub.handler, 'carrier subscription live before disconnect');
	const sourceBus = topEl.stateBus;
	assert.ok(sourceBus.subs.get('dock')?.has(carrierSub), 'source bus holds the carrier on the dock path before disconnect');
	await mid.handleDisconnect();
	assert.equal(mid.stateCarrier, null, 'stateCarrier nulled on disconnect');
	assert.equal(carrierSub.handler, null, 'carrier subscription unsubscribed (handler nulled)');
	assert.ok(!sourceBus.subs.get('dock')?.has(carrierSub), 'source bus no longer holds the carrier after disconnect');
});
/*
 * `.state=` (whole object, shared by reference + carrier) and `.state.key=`
 * (single-key overlay) on the SAME element must coexist: the object merge seeds
 * the child, the later key write overlays on top in source order, and the overlay
 * stays reactive. Mirrors `.state=${this.state.object} .state.test=${this.state.seed}`
 * → child.state.test follows seed; the merged object keys survive alongside it.
 */
const COMBO_CHILD_TAG = 'probe-combo-child';
class ProbeComboChild extends WebComponent {
	static state = {
		label: '',
		test: 0,
	};
	render() {
		this.html`<i>${this.state.test}</i>`;
	}
}
customElements.define(COMBO_CHILD_TAG, ProbeComboChild);
const COMBO_PARENT_TAG = 'probe-combo-parent';
class ProbeComboParent extends WebComponent {
	static state = {
		object: {
			label: 'fromObject',
		},
		seed: 1,
	};
	render() {
		this.html`<probe-combo-child .state=${this.state.object} .state.test=${this.state.seed}></probe-combo-child>`;
	}
}
customElements.define(COMBO_PARENT_TAG, ProbeComboParent);
test('.state=${obj} + .state.test=${n} coexist → object merged AND key overlaid, reactively', async () => {
	const parentEl = await mount(COMBO_PARENT_TAG);
	const child = root(parentEl).querySelector(COMBO_CHILD_TAG);
	await child.pendingConnect;
	assert.equal(child.state.test, 1, '.state.test= overlay applied on top of the .state= object merge');
	assert.equal(child.state.label, 'fromObject', '.state= object keys merged (coexist with the overlay)');
	assert.equal(leafText(child), '1', 'child rendered the overlaid key');
	parentEl.state.seed = 5;
	await parentEl.nextFrame();
	assert.equal(child.state.test, 5, '.state.test= overlay reactively re-applies when its source changes');
	assert.equal(child.state.label, 'fromObject', 'merged object key still intact after the overlay update');
});
/*
 * Reverse carrier — a CHILD-origin top-level PRIMITIVE write mirrors back onto the
 * `.state=` source object. Mirrors the live GlobalDock → UIDock `activeIndex`: the dock
 * self-highlights on click (`this.state.activeIndex = id`) and the parent's
 * `state.dock.activeIndex` must follow synchronously, without a router round-trip. Nested
 * objects already sync by shared reference; this covers the top-level primitive that was
 * copied BY VALUE at merge time and so could not share by reference.
 */
const SYNC_CHILD_TAG = 'probe-sync-child';
class ProbeSyncChild extends WebComponent {
	static state = {
		activeIndex: '',
		items: [],
	};
	render() {
		this.html`<i>${this.state.activeIndex}</i>`;
	}
}
customElements.define(SYNC_CHILD_TAG, ProbeSyncChild);
const SYNC_PARENT_TAG = 'probe-sync-parent';
class ProbeSyncParent extends WebComponent {
	static state = {
		dock: {
			activeIndex: 'wallet',
			items: [
				{
					id: 'wallet',
					tooltip: 'Wallet',
				},
			],
		},
	};
	render() {
		this.html`<probe-sync-child #dock .state=${this.state.dock}></probe-sync-child>`;
	}
}
customElements.define(SYNC_PARENT_TAG, ProbeSyncParent);
test('child-origin top-level primitive write mirrors back to the .state= source (reverse carrier)', async () => {
	const parentEl = await mount(SYNC_PARENT_TAG);
	const child = root(parentEl).querySelector(SYNC_CHILD_TAG);
	await child.pendingConnect;
	assert.equal(child.state.activeIndex, 'wallet', 'child seeded with the source activeIndex');
	child.state.activeIndex = 'explorer';
	assert.equal(parentEl.state.dock.activeIndex, 'explorer', 'source dock.activeIndex mirrors the child write synchronously');
	await parentEl.nextFrame();
	assert.equal(child.state.activeIndex, 'explorer', 'child value stable after the source re-merge round-trip');
	assert.equal(leafText(child), 'explorer', 'child re-rendered its own write');
});
test('parent-origin primitive write still flows down to the child (no regression)', async () => {
	const parentEl = await mount(SYNC_PARENT_TAG);
	const child = root(parentEl).querySelector(SYNC_CHILD_TAG);
	await child.pendingConnect;
	parentEl.state.dock.activeIndex = 'accounts';
	await parentEl.nextFrame();
	await parentEl.nextFrame();
	assert.equal(child.state.activeIndex, 'accounts', 'child reflects the ancestor-origin primitive write');
	assert.equal(parentEl.state.dock.activeIndex, 'accounts', 'source value intact');
});
test('a child write to a key absent from the source stays child-local (no leak)', async () => {
	const parentEl = await mount(SYNC_PARENT_TAG);
	const child = root(parentEl).querySelector(SYNC_CHILD_TAG);
	await child.pendingConnect;
	child.state.localOnly = 42;
	assert.equal('localOnly' in parentEl.state.dock, false, 'a key the source does not own is never mirrored up');
	assert.equal(child.state.localOnly, 42, 'the child still holds its own local key');
});
