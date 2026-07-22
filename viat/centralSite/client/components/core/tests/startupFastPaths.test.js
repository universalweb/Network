import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * tk:33 startup fast paths. Each test asserts the NEW path is TAKEN, not merely
 * that behavior stayed green:
 * - S1: warm applyStyles returns undefined (non-thenable) — the whole point of
 *   de-asyncing it; an async fn would return a promise here and the connect
 *   guard would await it every instance.
 * - S3: the accessor-rescue map still migrates pre-upgrade shadowed props, on
 *   consecutive instances (second construct = the cached-map path).
 * - S4: no-config instances SHARE the frozen class config (reference identity),
 *   a post-construct knob write throws, and a ctor-arg config forks.
 * - S9: create() with a plain state resolves to an instance; a promise state
 *   still awaits.
 * Same happy-dom harness as lifecycle/tests/disconnect.test.js.
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
const { WebComponent } = await import('../base.js');
const PROBE_SHEET = new CSSStyleSheet();
PROBE_SHEET.replaceSync('.probe { color: red; }');
class ProbeStartup extends WebComponent {
	static styles = {
		probe: PROBE_SHEET,
	};
	static state = {
		n: 0,
	};
	render() {
		this.html`<span class="probe">${this.state.n}</span>`;
	}
}
customElements.define('probe-startup', ProbeStartup);
test('S1: applyStyles is sync-undefined on the warm per-class path, and still adopts', async () => {
	const first = document.createElement('probe-startup');
	document.body.appendChild(first);
	await first.pendingConnect;
	first.remove();
	/*
	 * The class is now warm (compiledStylesArray stamped). A fresh instance's
	 * applyStyles must complete synchronously — undefined return IS the fast
	 * path; a promise return would mean every later instance still pays the
	 * cold tail's microtasks.
	 */
	const second = new ProbeStartup();
	const outcome = second.applyStyles();
	assert.equal(outcome, undefined, 'warm path returned a non-thenable');
	assert.ok(second.shadowRoot.adoptedStyleSheets.length > 0, 'sheets adopted synchronously');
});
test('S3: pre-upgrade shadowed state prop still migrates, including on the cached-map path', async () => {
	function buildShadowed() {
		const element = document.createElement('probe-lazy-thing');
		document.body.appendChild(element);
		element.state = {
			foo: 7,
		};
		return element;
	}
	const firstShadowed = buildShadowed();
	const secondShadowed = buildShadowed();
	class ProbeLazyThing extends WebComponent {
		static state = {
			foo: 0,
		};
		render() {
			this.html`<span>${this.state.foo}</span>`;
		}
	}
	customElements.define('probe-lazy-thing', ProbeLazyThing);
	customElements.upgrade(firstShadowed);
	customElements.upgrade(secondShadowed);
	assert.equal(firstShadowed.state.foo, 7, 'first upgrade migrated the shadowed state');
	assert.equal(secondShadowed.state.foo, 7, 'second upgrade (cached rescue map) migrated too');
	firstShadowed.remove();
	secondShadowed.remove();
});
test('S4: no-config instances share ONE frozen class config; ctor config forks', () => {
	const plainOne = new ProbeStartup();
	const plainTwo = new ProbeStartup();
	assert.equal(plainOne.config, plainTwo.config, 'shared resolvedConfig — no per-instance object');
	assert.equal(Object.isFrozen(plainOne.config), true);
	assert.equal(plainOne.config.mergeState, true, 'knob defaults present on the resolved config');
	assert.throws(() => {
		plainOne.config.mergeState = false;
	}, TypeError, 'post-construct knob write throws loudly instead of bleeding across instances');
	const forked = new ProbeStartup({}, {
		debugPatchOn: false,
	});
	assert.notEqual(forked.config, plainOne.config, 'ctor config forks a per-instance copy');
	assert.equal(forked.config.debugPatchOn, false);
	assert.equal(forked.config.mergeState, true, 'fork still carries the knob defaults');
	assert.equal(Object.isFrozen(forked.config), false, 'fork stays writable for the owner');
});
test('S9: create() constructs from plain state without requiring one, and from promised state', async () => {
	const plain = await ProbeStartup.create({
		n: 3,
	});
	assert.equal(ProbeStartup.isWebComponent(plain), true);
	assert.equal(plain.state.n, 3);
	const fromPromise = await ProbeStartup.create(Promise.resolve({
		n: 9,
	}));
	assert.equal(fromPromise.state.n, 9, 'promised state still awaited before construction');
});
