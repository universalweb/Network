import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * D7 — destroy must not strand a lifecycle awaiter. handleDisconnect re-arms the
 * connect-cycle slots (SETTLED → PENDING) so a RECONNECT gets a fresh cycle, but
 * that re-arm ran before the pendingDestroy branch: on a destroy there is no
 * future connect to settle the re-armed slot, so a post-destroy read of
 * `whenConnected` armed a deferred nothing would ever fire. A never-connected
 * destroy strands the same way by the other route — it skips handleDisconnect
 * entirely, so the slots are never settled in the first place.
 *
 * Both are proven by RACE, since the failure mode is a hang: a stranded slot
 * never settles, so only a timeout can observe it. The final test pins the
 * invariant the re-arm exists for — a plain disconnect must still re-arm, and
 * must NOT hand back a pre-resolved promise for a connect that has not happened.
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
const TIMEOUT_TOKEN = Symbol('timeout');
function armTimeout(resolve, ms) {
	setTimeout(resolve, ms, TIMEOUT_TOKEN);
}
function timeoutToken(ms) {
	return new Promise((resolve) => {
		armTimeout(resolve, ms);
	});
}
async function settlesWithin(promise, ms) {
	const winner = await Promise.race([
		promise,
		timeoutToken(ms),
	]);
	return winner !== TIMEOUT_TOKEN;
}
class ProbeDestroySettle extends WebComponent {
	static state = {
		n: 0,
	};
	render() {
		this.html`<span>${this.state.n}</span>`;
	}
}
customElements.define('probe-destroy-settle', ProbeDestroySettle);
test('a post-destroy whenConnected read settles instead of hanging', async () => {
	const element = document.createElement('probe-destroy-settle');
	document.body.appendChild(element);
	await element.pendingConnect;
	await element.destroy();
	const settled = await settlesWithin(element.lifecycle.whenConnected, 50);
	assert.equal(settled, true, 'whenConnected read after destroy must not strand');
});
test('every forward slot settles after destroy, not just whenConnected', async () => {
	const element = document.createElement('probe-destroy-settle');
	document.body.appendChild(element);
	await element.pendingConnect;
	await element.destroy();
	const cycle = element.lifecycle;
	assert.equal(await settlesWithin(cycle.whenRendered, 50), true, 'whenRendered settles');
	assert.equal(await settlesWithin(cycle.whenMounted, 50), true, 'whenMounted settles');
	assert.equal(await settlesWithin(cycle.whenLive, 50), true, 'whenLive settles');
});
test('destroying a NEVER-connected component settles its slots too', async () => {
	const element = document.createElement('probe-destroy-settle');
	await element.destroy();
	const settled = await settlesWithin(element.lifecycle.whenConnected, 50);
	assert.equal(settled, true, 'the never-connected destroy route must not strand either');
});
test('whenDestroyed still resolves on both routes', async () => {
	const connected = document.createElement('probe-destroy-settle');
	document.body.appendChild(connected);
	await connected.pendingConnect;
	assert.equal(await settlesWithin(connected.destroy(), 50), true, 'connected destroy resolves');
	const bare = document.createElement('probe-destroy-settle');
	assert.equal(await settlesWithin(bare.destroy(), 50), true, 'never-connected destroy resolves');
});
test('a plain disconnect still re-arms — no pre-resolved promise for an unhappened connect', async () => {
	const element = document.createElement('probe-destroy-settle');
	document.body.appendChild(element);
	await element.pendingConnect;
	element.remove();
	await element.pendingDisconnect;
	const pendingReconnect = element.lifecycle.whenConnected;
	assert.equal(
		await settlesWithin(pendingReconnect, 30),
		false,
		'the re-armed slot must await the NEXT connect, never resolve on the last one'
	);
	document.body.appendChild(element);
	assert.equal(await settlesWithin(pendingReconnect, 50), true, 'and settles once that connect lands');
	element.remove();
});
