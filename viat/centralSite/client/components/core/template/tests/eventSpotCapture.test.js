import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Capture/bubble keying for event spots (template.js EVENT_SPOTS, E10).
 *
 * `@click` and `@click.capture` on one element are two native registrations that
 * differ only by phase. The per-element spot map used to be keyed by event name
 * alone, so the second install overwrote the first while BOTH registrations
 * stayed live: the surviving spot ran on both phases and the other never ran at
 * all. The map is now keyed by name+phase, and the phase comes from the listener
 * IDENTITY (one dispatcher per phase) because it is not recoverable from the
 * event — at the target element both registrations report AT_TARGET.
 *
 * SCOPE: this covers capture-vs-bubble only. Two spots for the same event in the
 * SAME phase still share a key and still collide — that is the spot-as-listener
 * conversion deferred to tk26.10, deliberately not addressed here.
 *
 * happy-dom caveat: capture/bubble dispatch is native browser behaviour, so a
 * green run here is a regression guard, NOT proof. The claim is verified against
 * real Chrome separately.
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
function root(element) {
	return element.shadowRoot ?? element;
}
async function mount(tag) {
	const element = document.createElement(tag);
	document.body.appendChild(element);
	await element.pendingConnect;
	return element;
}
afterEach(() => {
	document.body.replaceChildren();
});
class CaptureHost extends WebComponent {
	bubbleCount = 0;
	captureCount = 0;
	onBubble() {
		this.bubbleCount++;
	}
	onCapture() {
		this.captureCount++;
	}
	render() {
		this.html`<button class="go" @click=${this.onBubble} @click.capture=${this.onCapture}>go</button>`;
	}
}
customElements.define('evt-capture-host', CaptureHost);
test('@click and @click.capture on one element each fire exactly once', async () => {
	const element = await mount('evt-capture-host');
	root(element).querySelector('.go').click();
	/*
	 * Counts, not order: at AT_TARGET both registrations fire and their relative
	 * order follows registration order, which is not the property under test.
	 * Pre-fix these read captureCount 2 / bubbleCount 0 — the survivor ran on both
	 * phases and the overwritten spot never ran.
	 */
	assert.equal(element.captureCount, 1, '@click.capture fired exactly once');
	assert.equal(element.bubbleCount, 1, '@click fired exactly once — it was not overwritten');
});
test('both spots keep firing across repeated clicks', async () => {
	const element = await mount('evt-capture-host');
	const button = root(element).querySelector('.go');
	button.click();
	button.click();
	button.click();
	assert.equal(element.captureCount, 3);
	assert.equal(element.bubbleCount, 3);
});
class CaptureOnlyHost extends WebComponent {
	captureCount = 0;
	onCapture() {
		this.captureCount++;
	}
	render() {
		this.html`<button class="go" @click.capture=${this.onCapture}>go</button>`;
	}
}
customElements.define('evt-capture-only-host', CaptureOnlyHost);
test('a lone @click.capture spot still dispatches', async () => {
	const element = await mount('evt-capture-only-host');
	root(element).querySelector('.go').click();
	assert.equal(element.captureCount, 1, 'the capture dispatcher resolves its own key');
});
class BubbleOnlyHost extends WebComponent {
	bubbleCount = 0;
	onBubble() {
		this.bubbleCount++;
	}
	render() {
		this.html`<button class="go" @click=${this.onBubble}>go</button>`;
	}
}
customElements.define('evt-bubble-only-host', BubbleOnlyHost);
test('a lone @click spot still dispatches — the no-modifier path is unchanged', async () => {
	const element = await mount('evt-bubble-only-host');
	root(element).querySelector('.go').click();
	assert.equal(element.bubbleCount, 1);
});
/*
 * Teardown is the third site of the keying lockstep and the easiest to half-fix:
 * removeEventListener matches on (type, listener, capture), so an unsubscribe
 * that deletes the wrong key or removes the wrong dispatcher leaves the listener
 * attached and the spot firing after the component is gone.
 */
class OnceCaptureHost extends WebComponent {
	bubbleCount = 0;
	captureCount = 0;
	onBubble() {
		this.bubbleCount++;
	}
	onCapture() {
		this.captureCount++;
	}
	render() {
		this.html`<button class="go" @click=${this.onBubble} @click.capture.once=${this.onCapture}>go</button>`;
	}
}
customElements.define('evt-once-capture-host', OnceCaptureHost);
test('.once on the capture spot detaches only itself, leaving the bubble spot live', async () => {
	const element = await mount('evt-once-capture-host');
	const button = root(element).querySelector('.go');
	button.click();
	assert.equal(element.captureCount, 1);
	assert.equal(element.bubbleCount, 1);
	button.click();
	assert.equal(element.captureCount, 1, '.once detached the capture spot after its first dispatch');
	assert.equal(element.bubbleCount, 2, 'the bubble spot survived its sibling unsubscribing');
});
