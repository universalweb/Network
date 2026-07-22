import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Reactive host-ATTRIBUTE channel (`this.attrs.*`). Proves the missing halves
 * wired in this change: `attributeChangedCallback` → bus notify → patch pass, and
 * the attrs proxy recording a render-time dep so ONLY attrs actually read in
 * render() repaint. Mirrors state-channel.test.js's load order — register the
 * happy-dom globals and stub the file: stylesheet fetch BEFORE the DOM-coupled
 * core graph loads.
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
function root(domElement) {
	return domElement.shadowRoot ?? domElement;
}
const TAG = 'probe-attrs';
class ProbeAttrs extends WebComponent {
	/*
	 * spellcheck: STRING (enumerated "true"/"false"); disabled: BOOLEAN (presence,
	 * add/remove); unread: declared but NEVER read in render() — the precision probe.
	 */
	static attrs = {
		spellcheck: 'true',
		disabled: false,
		unread: false,
	};
	renderCount = 0;
	render() {
		this.renderCount += 1;
		this.html`<input spellcheck=${this.attrs.spellcheck} ?disabled=${this.attrs.disabled}>`;
	}
}
customElements.define(TAG, ProbeAttrs);
function inner(el) {
	return root(el).querySelector('input');
}
test('string attr: default read, and external setAttribute reactively re-patches the sub-element', async () => {
	const el = await mount(TAG);
	assert.equal(el.renderCount, 1, 'one render on mount');
	assert.equal(inner(el).getAttribute('spellcheck'), 'true', 'absent host attr → string default "true" passed through');
	el.setAttribute('spellcheck', 'false');
	await el.nextFrame();
	assert.equal(el.renderCount, 2, 'external setAttribute triggered exactly one patch pass');
	assert.equal(inner(el).getAttribute('spellcheck'), 'false', 'sub-element spellcheck reactively flipped to "false"');
});
test('boolean attr: presence add/remove drives the ?bool binding reactively', async () => {
	const el = await mount(TAG);
	assert.equal(inner(el).hasAttribute('disabled'), false, 'absent boolean attr → false');
	el.setAttribute('disabled', '');
	await el.nextFrame();
	assert.equal(inner(el).hasAttribute('disabled'), true, 'present boolean attr → sub-element disabled set');
	el.removeAttribute('disabled');
	await el.nextFrame();
	assert.equal(inner(el).hasAttribute('disabled'), false, 'removed boolean attr → sub-element disabled cleared');
});
test('imperative this.attrs.x = v routes through setAttribute and repaints (single notify point)', async () => {
	const el = await mount(TAG);
	el.attrs.spellcheck = 'false';
	assert.equal(el.getAttribute('spellcheck'), 'false', 'write-through set the host attribute');
	await el.nextFrame();
	assert.equal(inner(el).getAttribute('spellcheck'), 'false', 'imperative write reactively patched the sub-element');
	el.attrs.disabled = true;
	await el.nextFrame();
	assert.equal(el.getAttribute('disabled'), '', 'boolean true → present empty attribute');
	el.attrs.disabled = false;
	await el.nextFrame();
	assert.equal(el.hasAttribute('disabled'), false, 'boolean false → attribute removed (no manual removeAttribute)');
});
test('precision: changing a declared-but-unread attr does NOT repaint', async () => {
	const el = await mount(TAG);
	const baseline = el.renderCount;
	el.setAttribute('unread', '');
	await el.nextFrame();
	assert.equal(el.renderCount, baseline, 'no spot read this.attrs.unread → no subscriber → no patch pass');
});
test('sidebar pattern: imperative write to a WRITE-ONLY attr sets the host attr but does NOT repaint', async () => {
	// <ui-sidebar> writes this.attrs.open/inert for CSS :host([open]) targeting and
	// never reads them in render(). This asserts that class of write is inert to the
	// render pipeline post-change (the guard that stops the new callback from churning).
	const el = await mount(TAG);
	const baseline = el.renderCount;
	el.attrs.unread = true;
	assert.equal(el.hasAttribute('unread'), true, 'imperative boolean write set the host attribute (for CSS)');
	await el.nextFrame();
	assert.equal(el.renderCount, baseline, 'write-only attr (never read in render) → no repaint');
});
