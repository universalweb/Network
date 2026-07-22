import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Local renderDep Set channel (tk:32). Contract under test:
 * - a bare `${this.state.x}` component re-renders on a write WITHOUT any
 *   Subscription objects or bus buckets for its render deps — including when
 *   the bus has ZERO buckets (the flush `subs` gate must not orphan the
 *   channel);
 * - overlap semantics match the bucket rules: exact, deep-write-under-flat-dep
 *   ('user.name' hits dep 'user'), dotted dep vs ancestor write both
 *   directions;
 * - notifyAll (replaceState) marks dirty when any dep exists;
 * - re-sync adds/removes in place with a correct nested count; disconnect
 *   clears the channel; reconnect re-mints it on the next render.
 * Same happy-dom harness as tests/startupFastPaths.test.js.
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
function flushMicrotasks() {
	return new Promise(queueMicrotask);
}
class DepProbe extends WebComponent {
	static state = {
		label: 'first',
		user: {
			name: 'ada',
		},
	};
	render() {
		this.html`<span>${this.state.label}</span><em>${this.state.user.name}</em>`;
	}
}
customElements.define('dep-probe', DepProbe);
async function mountProbe() {
	const element = document.createElement('dep-probe');
	document.body.appendChild(element);
	await element.pendingConnect;
	await element.lifecycle.whenRendered;
	return element;
}
test('bare deps re-render through the Set channel with ZERO Subscription buckets', async () => {
	const element = await mountProbe();
	const bus = element.stateBus;
	assert.ok(bus.renderDeps && bus.renderDeps.size >= 1, 'channel populated by the first render');
	assert.equal(bus.subs, null, 'no bucket Map exists — render deps allocated no Subscriptions');
	element.state.label = 'second';
	await flushMicrotasks();
	await element.lifecycle.whenRendered;
	assert.ok(element.shadowRoot.textContent.includes('second'), 'write through the channel re-rendered');
	element.remove();
});
test('deep write under a tracked parent path still hits (first-segment probe)', async () => {
	const element = await mountProbe();
	element.state.user.name = 'grace';
	await flushMicrotasks();
	await element.lifecycle.whenRendered;
	assert.ok(element.shadowRoot.textContent.includes('grace'), 'nested write re-rendered the bare reader');
	element.remove();
});
test('replaceState (notifyAll) marks dirty through the channel', async () => {
	const element = await mountProbe();
	element.state = {
		label: 'replaced',
		user: {
			name: 'lin',
		},
	};
	await flushMicrotasks();
	await element.lifecycle.whenRendered;
	assert.ok(element.shadowRoot.textContent.includes('replaced'), 'full replacement re-rendered');
	element.remove();
});
test('syncRenderDeps diffs in place and keeps the nested count honest', async () => {
	const element = await mountProbe();
	const bus = element.stateBus;
	bus.syncRenderDeps(new Set(['alpha', 'beta.gamma']));
	assert.equal(bus.renderDeps.size, 2);
	assert.equal(bus.nestedRenderDepCount, 1, 'dotted entry counted');
	assert.equal(bus.renderDepHit('alpha'), true, 'exact hit');
	assert.equal(bus.renderDepHit('beta'), true, 'ancestor write hits the dotted dep (scan path)');
	assert.equal(bus.renderDepHit('beta.gamma.deep'), true, 'descendant write hits the dotted dep');
	assert.equal(bus.renderDepHit('omega'), false, 'miss stays a miss');
	bus.syncRenderDeps(new Set(['alpha']));
	assert.equal(bus.renderDeps.size, 1, 'removed path left the set');
	assert.equal(bus.nestedRenderDepCount, 0, 'nested count returned to zero');
	const flatProbeSet = bus.renderDeps;
	bus.syncRenderDeps(new Set(['alpha']));
	assert.equal(bus.renderDeps, flatProbeSet, 'unchanged vocabulary keeps the same Set — zero churn');
	element.remove();
});
test('disconnect clears the channel; reconnect re-mints it', async () => {
	const element = await mountProbe();
	const bus = element.stateBus;
	assert.ok(bus.renderDeps && bus.renderDeps.size >= 1);
	element.remove();
	await flushMicrotasks();
	assert.equal(bus.renderDeps, null, 'disconnect cleared the channel beside clearRealmUnsubs');
	document.body.appendChild(element);
	await element.pendingConnect;
	await element.lifecycle.whenRendered;
	assert.ok(bus.renderDeps && bus.renderDeps.size >= 1, 'reconnect render re-minted the channel');
	element.state.label = 'reborn';
	await flushMicrotasks();
	await element.lifecycle.whenRendered;
	assert.ok(element.shadowRoot.textContent.includes('reborn'), 'reactivity intact after the round trip');
	element.remove();
});
