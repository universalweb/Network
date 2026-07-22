import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * tk:42 lazy lifecycle slots (lifecyclePromises.js). Two things are on trial:
 * the ALWAYS-SETTLE contract across every read timing — (a) never read,
 * (b) read before a pass, (c) read mid-pass, (d) read after a pass — and the
 * LAZINESS itself: a full connect→render→mount cycle with no reader must mint
 * ZERO lifecycle promises (the internal slot fields stay null), which is the
 * entire point of the conversion. Internal fields are probed deliberately —
 * that is the proof the lazy path is taken, not merely that behavior is green.
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
class ProbeLazyLifecycle extends WebComponent {
	static state = {
		n: 0,
	};
	render() {
		this.html`<span>${this.state.n}</span>`;
	}
}
customElements.define('probe-lazy-lifecycle', ProbeLazyLifecycle);
test('unread cycle mints ZERO lifecycle promises', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	document.body.appendChild(element);
	await element.pendingConnect;
	const cycle = element.lifecycle;
	assert.equal(cycle.whenConnectedPromise, null, 'connected slot never allocated');
	assert.equal(cycle.whenRenderedPromise, null, 'rendered slot never allocated');
	assert.equal(cycle.whenMountedPromise, null, 'mounted slot never allocated');
	assert.equal(cycle.whenDestroyedPromise, null, 'destroyed slot never allocated');
	element.remove();
});
test('read BEFORE a pass: arms, then settles when the pass completes', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	const early = element.lifecycle.whenRendered;
	assert.ok(element.lifecycle.whenRenderedPromise, 'pre-pass read armed the slot');
	document.body.appendChild(element);
	await early;
	assert.equal(element.lifecycle.whenRenderedPromise, null, 'settle released the deferred');
	element.remove();
});
test('read MID-pass: settles at that pass\'s end', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	document.body.appendChild(element);
	/*
	 * appendChild returns with the connect pipeline still in flight — this read
	 * lands mid-cycle, arms the pending slot, and must settle with the pass.
	 */
	const midPass = element.lifecycle.whenRendered;
	await midPass;
	await element.pendingConnect;
	element.remove();
});
test('read AFTER a pass: already settled, resolves without re-arming', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	document.body.appendChild(element);
	await element.pendingConnect;
	const late = element.lifecycle.whenRendered;
	await late;
	assert.equal(element.lifecycle.whenRenderedPromise, null, 'no deferred minted for a settled read');
	element.remove();
});
test('reconnect re-arms the cycle slots; the new cycle settles its own readers', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	document.body.appendChild(element);
	await element.pendingConnect;
	element.remove();
	await Promise.resolve();
	await Promise.resolve();
	document.body.appendChild(element);
	const secondCycle = element.lifecycle.whenRendered;
	await secondCycle;
	await element.pendingConnect;
	element.remove();
});
test('stranded disconnect settles an armed reader instead of hanging', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	document.body.appendChild(element);
	const liveReader = element.lifecycle.whenLive;
	element.remove();
	await liveReader;
	assert.equal(element.lifecycle.whenLivePromise, null, 'stranded resolve released the deferred');
});
test('whenDestroyed: lazy, and destroy() settles it', async () => {
	const element = document.createElement('probe-lazy-lifecycle');
	document.body.appendChild(element);
	await element.pendingConnect;
	assert.equal(element.lifecycle.whenDestroyedPromise, null);
	const gone = element.destroy();
	await gone;
	assert.equal(element.phase, 'destroyed');
});
