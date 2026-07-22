import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * ifThen branch-cache stability + each() copy-on-write (template split, tk:22).
 *
 * The ifThen contract under test: a branch component class is instantiated
 * ONCE per spot and reused across condition flips — including after an
 * UNRELATED full/patch re-render. Pre-fix, every render pass re-ran
 * `${ifThen(...)}` and minted a fresh thunk with a fresh closure cache, so
 * the first flip after any re-render re-instantiated the branch (lifecycle
 * churn, lost branch state). The cache now lives on the ComputedSpot.
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
const {
	each, ifThen,
} = await import('../../template.js');
function settle() {
	return new Promise(setImmediate);
}
let panelConstructs = 0;
class CachedPanel extends WebComponent {
	constructor(...args) {
		super(...args);
		panelConstructs += 1;
	}
	render() {
		this.html`<p class="cached">panel</p>`;
	}
}
customElements.define('ifthen-cached-panel', CachedPanel);
class IfThenHost extends WebComponent {
	static state = {
		flag: true,
		label: 'a',
	};
	render() {
		this.html`
			<section>
				<h1>${this.state.label}</h1>
				<div class="branch">${ifThen('flag', CachedPanel, 'fallback')}</div>
			</section>`;
	}
}
customElements.define('ifthen-cache-host', IfThenHost);
async function mountHost() {
	const host = new IfThenHost();
	document.body.appendChild(host);
	await host.pendingConnect;
	await settle();
	return host;
}
afterEach(() => {
	document.body.replaceChildren();
});
test('ifThen instantiates the branch class once and reuses it across flips', async () => {
	panelConstructs = 0;
	const host = await mountHost();
	const branch = host.shadowRoot.querySelector('.branch');
	const first = branch.querySelector('ifthen-cached-panel');
	assert.ok(first, 'then-branch mounted');
	assert.equal(panelConstructs, 1);
	host.state.flag = false;
	await settle();
	assert.equal(branch.querySelector('ifthen-cached-panel'), null, 'else branch active');
	assert.equal(branch.textContent.includes('fallback'), true, 'string else branch rendered');
	host.state.flag = true;
	await settle();
	assert.equal(branch.querySelector('ifthen-cached-panel'), first, 'same node reused on flip back');
	assert.equal(panelConstructs, 1, 'no re-instantiation across flips');
});
test('ifThen branch cache survives an unrelated re-render (per-spot cache)', async () => {
	panelConstructs = 0;
	const host = await mountHost();
	const branch = host.shadowRoot.querySelector('.branch');
	const first = branch.querySelector('ifthen-cached-panel');
	/*
	 * `label` is a bare tracked read → renderDep → patch-pass re-render, which
	 * re-runs render() and replaces the ifThen thunk on the spot. Pre-fix this
	 * orphaned the closure cache and the next flip constructed a new panel.
	 */
	host.state.label = 'b';
	await settle();
	host.state.flag = false;
	await settle();
	host.state.flag = true;
	await settle();
	assert.equal(branch.querySelector('ifthen-cached-panel'), first, 'same node after re-render + flips');
	assert.equal(panelConstructs, 1, 'no re-instantiation after re-render');
});
test('each() shares the source array copy-on-write — imperative mutation never touches the caller array', () => {
	const source = [
		1,
		2,
		3,
	];
	const live = each(source, String);
	assert.equal(live.items, source, 'items shared by reference before any mutation');
	live.push(4);
	assert.notEqual(live.items, source, 'first mutation takes a private copy');
	assert.deepEqual(source, [
		1,
		2,
		3,
	], 'caller array unmutated');
	assert.deepEqual(live.items, [
		1,
		2,
		3,
		4,
	], 'LiveList sees the mutation');
});
