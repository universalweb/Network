import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Warm-adoption sheet merging (tk:32). Contract under test:
 * - consecutive framework-owned sheets collapse into ONE merged sheet whose
 *   rules keep the exact pre-merge cascade order;
 * - the merged sheet is CACHED — every class with the same framework run
 *   shares one object (reference identity), preserving the browser's
 *   shared-contents optimization;
 * - compiledStyles (the per-key Map) stays UNMERGED so the
 *   addStyle/removeStyle fork path keeps per-key granularity;
 * - an opt-out (null) shrinks the run; a subclass override SPLITS the run in
 *   place (single-sheet runs pass through by identity, no pointless clone).
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
const { ensureCompiledStyles } = await import('../styleApi.js');
function probeSheet(cssText) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(cssText);
	return sheet;
}
function serializedRules(sheet) {
	const rules = sheet.cssRules;
	let cssText = '';
	const rulesLength = rules.length;
	for (let ruleIndex = 0; ruleIndex < rulesLength; ruleIndex++) {
		cssText += `${rules[ruleIndex].cssText}\n`;
	}
	return cssText;
}
const FRAMEWORK_A = probeSheet('.fw-a { color: red; }');
const FRAMEWORK_B = probeSheet('.fw-b { color: green; }');
const FRAMEWORK_C = probeSheet('.fw-c { color: blue; }');
const OWN_SHEET = probeSheet('.own { color: black; }');
const OVERRIDE_SHEET = probeSheet('.fw-b-override { color: white; }');
/*
 * Replace the real uwcBase modules (empty under the stubbed fetch) with three
 * content-bearing probes so order and membership are observable. WebComponent
 * IS the framework base (direct HTMLElement subclass), so these entries are
 * framework-owned by the same structural test production uses.
 */
WebComponent.styles = {
	'fw.a': FRAMEWORK_A,
	'fw.b': FRAMEWORK_B,
	'fw.c': FRAMEWORK_C,
};
class MergeOne extends WebComponent {
	static styles = {
		own: OWN_SHEET,
	};
	render() {
		this.html`<span class="own">one</span>`;
	}
}
class MergeTwo extends WebComponent {
	static styles = {
		own: OWN_SHEET,
	};
	render() {
		this.html`<span class="own">two</span>`;
	}
}
class MergeOptOut extends WebComponent {
	static styles = {
		'fw.b': null,
		own: OWN_SHEET,
	};
	render() {
		this.html`<span class="own">optout</span>`;
	}
}
class MergeOverride extends WebComponent {
	static styles = {
		'fw.b': OVERRIDE_SHEET,
		own: OWN_SHEET,
	};
	render() {
		this.html`<span class="own">override</span>`;
	}
}
customElements.define('merge-one', MergeOne);
customElements.define('merge-two', MergeTwo);
customElements.define('merge-opt-out', MergeOptOut);
customElements.define('merge-override', MergeOverride);
test('framework run merges into one sheet, in cascade order; the map stays unmerged', async () => {
	await ensureCompiledStyles(MergeOne);
	const adoption = MergeOne.compiledStylesArray;
	assert.equal(adoption.length, 2, 'three framework sheets + one own sheet adopt as [merged, own]');
	const mergedText = serializedRules(adoption[0]);
	const indexA = mergedText.indexOf('.fw-a');
	const indexB = mergedText.indexOf('.fw-b');
	const indexC = mergedText.indexOf('.fw-c');
	assert.ok(indexA >= 0 && indexB > indexA && indexC > indexB, 'merged rules keep the framework declaration order');
	assert.equal(MergeOne.compiledStyles.size, 4, 'per-key map keeps every entry individually');
	assert.equal(MergeOne.compiledStyles.get('fw.a'), FRAMEWORK_A, 'map holds the ORIGINAL framework sheet, not the merged one');
});
test('classes with the same framework run share ONE merged sheet object', async () => {
	await ensureCompiledStyles(MergeOne);
	await ensureCompiledStyles(MergeTwo);
	assert.equal(MergeTwo.compiledStylesArray.length, 2);
	assert.equal(
		MergeOne.compiledStylesArray[0],
		MergeTwo.compiledStylesArray[0],
		'merged-run cache returns the same object for the same member identity sequence'
	);
});
test('a null opt-out shrinks the run to a different cached merged sheet', async () => {
	await ensureCompiledStyles(MergeOne);
	await ensureCompiledStyles(MergeOptOut);
	const adoption = MergeOptOut.compiledStylesArray;
	assert.equal(adoption.length, 2, 'opted-out entry vanishes before partitioning');
	assert.notEqual(adoption[0], MergeOne.compiledStylesArray[0], 'a two-member run is a distinct merged sheet');
	const mergedText = serializedRules(adoption[0]);
	assert.ok(mergedText.includes('.fw-a') && mergedText.includes('.fw-c'), 'surviving members merged');
	assert.equal(mergedText.includes('.fw-b'), false, 'opted-out sheet contributes nothing');
	assert.equal(MergeOptOut.compiledStyles.has('fw.b'), false, 'map drops the opted-out key too');
});
test('a subclass override splits the run in place; single-sheet runs pass through by identity', async () => {
	await ensureCompiledStyles(MergeOverride);
	const adoption = MergeOverride.compiledStylesArray;
	assert.equal(adoption.length, 4, 'override splits [a][override][c][own] — no cross-override merging');
	assert.equal(adoption[0], FRAMEWORK_A, 'run of one adopts the original sheet object, no clone');
	assert.equal(adoption[2], FRAMEWORK_C, 'trailing run of one also passes through');
	const overrideText = serializedRules(adoption[1]);
	assert.ok(overrideText.includes('.fw-b-override'), 'override slot keeps its in-place position');
});
test('warm instances adopt the short array synchronously', async () => {
	await ensureCompiledStyles(MergeOne);
	const element = document.createElement('merge-one');
	document.body.appendChild(element);
	await element.pendingConnect;
	assert.equal(element.shadowRoot.adoptedStyleSheets.length, 2, 'per-root adoption pays two entries, not four');
	assert.equal(element.shadowRoot.adoptedStyleSheets[0], MergeOne.compiledStylesArray[0]);
	element.remove();
});
