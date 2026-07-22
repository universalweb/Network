import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * The REAL <ui-input> — proves the shipped spellcheck fix end-to-end on the
 * actual component (not a probe): the string-channel default, the parse-time
 * markup path (attribute present at upgrade), and a reactive toggle. Register
 * happy-dom + stub the stylesheet fetch BEFORE the component graph loads.
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
await import('../input.js');
function root(domElement) {
	return domElement.shadowRoot ?? domElement;
}
function innerInput(el) {
	return root(el).querySelector('input');
}
async function mountMarkup(markup) {
	document.body.innerHTML = markup;
	const el = document.body.firstElementChild;
	await el.pendingConnect;
	return el;
}
test('default: absent spellcheck attr → string default "true" reaches the inner input', async () => {
	const el = await mountMarkup('<ui-input></ui-input>');
	assert.equal(innerInput(el).getAttribute('spellcheck'), 'true', 'default "true" passed through');
});
test('parse-time markup: <ui-input spellcheck="false"> disables spellcheck on the inner input (the original bug)', async () => {
	const el = await mountMarkup('<ui-input spellcheck="false"></ui-input>');
	assert.equal(el.attrs.spellcheck, 'false', 'host attr read as the string "false"');
	assert.equal(innerInput(el).getAttribute('spellcheck'), 'false', 'inner input spellcheck="false" — OFF, not inverted to ON');
});
test('reactive: toggling the host spellcheck attribute re-patches the inner input', async () => {
	const el = await mountMarkup('<ui-input></ui-input>');
	assert.equal(innerInput(el).getAttribute('spellcheck'), 'true', 'starts on');
	el.setAttribute('spellcheck', 'false');
	await el.nextFrame();
	assert.equal(innerInput(el).getAttribute('spellcheck'), 'false', 'reactively flipped to off');
	el.setAttribute('spellcheck', 'true');
	await el.nextFrame();
	assert.equal(innerInput(el).getAttribute('spellcheck'), 'true', 'reactively flipped back on');
});
