import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Disconnect timing + reconnect race (tk:30 D1/D2).
 * - Settled connect → handleDisconnect skips await (pendingConnect already null).
 * - Disconnect during in-flight connect + reconnect in the same task → teardown
 *   aborts; the live reconnected element is not torn down.
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
const { PHASE } = await import('../phase.js');
const TAG = 'probe-disconnect-timing';
class ProbeDisconnect extends WebComponent {
	static state = {
		n: 0,
	};
	disconnectHooks = 0;
	onDisconnect() {
		this.disconnectHooks += 1;
	}
	render() {
		this.html`<span>${this.state.n}</span>`;
	}
}
customElements.define(TAG, ProbeDisconnect);
async function mount() {
	const element = document.createElement(TAG);
	document.body.appendChild(element);
	await element.pendingConnect;
	return element;
}
test('settled connect: pendingConnect is null and disconnect tears down without hanging', async () => {
	const element = await mount();
	assert.equal(element.pendingConnect, null, 'settleConnect self-clears after connect');
	assert.notEqual(element.phase, PHASE.DISCONNECTED);
	element.remove();
	// Drain disconnectedCallback (may still be a microtask if any residual await).
	await Promise.resolve();
	await Promise.resolve();
	assert.equal(element.phase, PHASE.DISCONNECTED);
	assert.equal(element.disconnectHooks, 1);
	assert.equal(element.isConnected, false);
});
test('disconnect→reconnect race: resumed teardown does not clobber the live element', async () => {
	const element = document.createElement(TAG);
	// Hold connect open so disconnect will await an in-flight pendingConnect.
	let releaseConnect;
	const gate = new Promise((resolve) => {
		releaseConnect = resolve;
	});
	element.onConnect = async function holdConnect() {
		await gate;
	};
	document.body.appendChild(element);
	assert.ok(element.pendingConnect, 'connect in flight');
	// Disconnect while connect is still pending.
	element.remove();
	// Reconnect in the same task before the awaited connect settles.
	document.body.appendChild(element);
	assert.equal(element.isConnected, true);
	const liveGeneration = element.connectGeneration;
	releaseConnect();
	// Drain both connect settlements + the aborted disconnect.
	await element.pendingConnect;
	await Promise.resolve();
	await Promise.resolve();
	assert.equal(element.isConnected, true, 'element stays connected after race');
	assert.notEqual(element.phase, PHASE.DISCONNECTED, 'live element not torn down');
	assert.equal(element.connectGeneration, liveGeneration, 'reconnect generation preserved');
	// One intentional disconnect later should still work.
	element.remove();
	await Promise.resolve();
	await Promise.resolve();
	assert.equal(element.phase, PHASE.DISCONNECTED);
});
