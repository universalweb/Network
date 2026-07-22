import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * `#ref` capture, exercised through a real render.
 *
 * happy-dom's parser drops a leading `#` from attribute names, which would make
 * every assertion here vacuously pass against an empty refsMap — so the shim is
 * imported to repair it, and the first test PROVES the defect is still real
 * underneath rather than trusting that the shim is doing anything.
 */
GlobalRegistrator.register();
await import('../../tests/happyDomRefShim.js');
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
const { WebComponent } = await import('../../index.js');
async function settle() {
	for (let index = 0; index < 5; index += 1) {
		await new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
		await Promise.resolve();
	}
}
let hostSeq = 0;
async function mountRendering(renderBody) {
	const tag = `refs-host-${hostSeq++}`;
	class RefsHost extends WebComponent {
		render() {
			renderBody.call(this, this);
		}
	}
	customElements.define(tag, RefsHost);
	const host = document.createElement(tag);
	document.body.append(host);
	await host.pendingConnect;
	await host.lifecycle.whenRendered;
	await settle();
	return host;
}
test('control: the harness defect is real and live, so the tests below are not vacuous', () => {
	/* DOMParser reaches the same parser but is deliberately NOT patched by the
	   shim, so it still exhibits the raw defect. If happy-dom ever fixes this,
	   THIS test fails first and the shim can be retired — the ref assertions
	   below would otherwise keep passing either way and tell us nothing. */
	const parsed = new DOMParser().parseFromString('<div #probe></div>', 'text/html');
	const probe = parsed.querySelector('div');
	assert.equal(probe.hasAttribute('#probe'), false, 'happy-dom still drops a parsed leading #');
	assert.equal(probe.hasAttribute('probe'), true, 'and leaves the bare name behind');
	// setAttribute is unaffected — which is what lets the shim restore the names.
	const element = document.createElement('div');
	element.setAttribute('#kept', '');
	assert.equal(element.hasAttribute('#kept'), true, 'setAttribute preserves a leading #');
});
test('a #ref resolves for a direct child, a deep descendant, and a custom element', async () => {
	const host = await mountRendering((component) => {
		component.html`
			<div class="wrap" #wrap>
				<section><span #deep>deep</span></section>
			</div>
			<div #sibling></div>
		`;
	});
	assert.equal(host.refs.wrap?.className, 'wrap', 'direct child ref resolved');
	assert.equal(host.refs.deep?.localName, 'span', 'ref nested two levels down resolved');
	assert.equal(host.refs.sibling?.localName, 'div', 'second top-level ref resolved');
	host.remove();
});
test('the # is stripped from the live DOM and refs survive a re-render', async () => {
	const host = await mountRendering((component) => {
		component.html`<div class="box" #box>${component.state.label ?? ''}</div>`;
	});
	const box = host.refs.box;
	assert.ok(box, 'ref captured');
	assert.equal(box.hasAttribute('#box'), false, 'the #ref attribute is removed from the live element');
	assert.equal(box.getAttribute('box'), null, 'and does not leak through as a plain attribute either');
	host.state.label = 'changed';
	await settle();
	assert.equal(host.refs.box, box, 'the same element is still referenced after a patch pass');
	host.remove();
});
test('encoding never corrupts a "#" that is not an attribute name', async () => {
	const host = await mountRendering((component) => {
		component.html`
			<a href="#top" class="a #b" title="#quoted" #link>#text stays</a>
		`;
	});
	const link = host.refs.link;
	assert.ok(link, 'the real #ref on the same element still resolved');
	assert.equal(link.getAttribute('href'), '#top', 'a quoted href fragment is untouched');
	assert.equal(link.getAttribute('class'), 'a #b', 'a "#" inside a quoted value is untouched');
	assert.equal(link.getAttribute('title'), '#quoted', 'a quoted value that is only a # token is untouched');
	assert.match(link.textContent, /#text stays/, 'a "#" in body text is untouched');
	host.remove();
});
test('refs are released on disconnect', async () => {
	const host = await mountRendering((component) => {
		component.html`<div #gone></div>`;
	});
	assert.ok(host.refs.gone, 'ref present while connected');
	host.remove();
	await settle();
	assert.equal(host.refsMap, null, 'the ref map is torn down with the component');
});
