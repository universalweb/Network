/*
 * UWC CSS cascade harness — the verification spine for the CSS framework
 * (must stay 42/42 green through any cascade-touching change; see
 * plan.private.md §1.6). Loaded by css-cascade-test.html. fetch() paths are
 * document-relative (unchanged); dynamic import() paths are module-relative
 * (rebased ../ from scripts/).
 */
const results = [];
let tokenSheet = null;
function record(testName, actual, expected) {
	const ok = String(actual) === String(expected);
	results.push({
		name: testName,
		actual,
		expected,
		ok,
	});
}
function sheetFrom(cssText) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(cssText);
	return sheet;
}
async function fetchSheet(path) {
	const text = await fetch(path).then((response) => {
		return response.text();
	});
	return sheetFrom(text);
}
function inShadow(sheets, markup, selector, prop) {
	const host = document.createElement('div');
	document.body.appendChild(host);
	const root = host.attachShadow({
		mode: 'open',
	});
	root.adoptedStyleSheets = sheets;
	root.innerHTML = markup;
	const value = getComputedStyle(root.querySelector(selector))[prop];
	host.remove();
	return value;
}
function inLight(sheets, tag, markup, selector, prop) {
	const previous = document.adoptedStyleSheets;
	document.adoptedStyleSheets = tokenSheet ? [tokenSheet, ...sheets] : sheets;
	const wrapper = document.createElement(tag);
	wrapper.innerHTML = markup;
	document.body.appendChild(wrapper);
	const value = getComputedStyle(wrapper.querySelector(selector))[prop];
	wrapper.remove();
	document.adoptedStyleSheets = previous;
	return value;
}
// Design tokens use :root (matches <html> only) — adopt at DOCUMENT level so every
// shadow-root probe inherits them, mirroring how the app loads variables.css.
tokenSheet = await fetchSheet('./styles/variables.css');
document.adoptedStyleSheets = [...document.adoptedStyleSheets, tokenSheet];
// ── PROVEN SELF-TESTS (Task 1) ──────────────────────────────
const order = sheetFrom('@layer uwc.reset, uwc.base, uwc.components, uwc.util;');
const base = sheetFrom('@layer uwc.base { .box { padding: 4px; } button { padding: 8px; } }');
const comp = sheetFrom('@layer uwc.components { .box { padding: 40px; } .btn { padding: 99px; } }');
const util = sheetFrom('@layer uwc.util { .pz { padding: 0px; } }');
const unl = sheetFrom('.box2 { padding: 40px; }');
record(
	'shadow util beats layered comp',
	inShadow([
		order, base, util, comp,
	], '<div class="box pz" id="t"></div>', '#t', 'paddingTop'),
	'0px'
);
record(
	'shadow unlayered comp beats util (must-layer proof)',
	inShadow([
		order, util, unl,
	], '<div class="box2 pz" id="t"></div>', '#t', 'paddingTop'),
	'40px'
);
record(
	'explicit statement: util wins even when comp adopted last',
	inShadow([
		order, util, comp,
	], '<div class="box pz" id="t"></div>', '#t', 'paddingTop'),
	'0px'
);
record(
	'without statement: last-adopted comp wins (statement mandatory)',
	inShadow([util, comp], '<div class="box pz" id="t"></div>', '#t', 'paddingTop'),
	'40px'
);
record(
	'component class beats base-element',
	inShadow([
		order, base, comp,
	], '<button class="btn" id="t"></button>', '#t', 'paddingTop'),
	'99px'
);
record(
	'bare element gets base styling',
	inShadow([
		order, base, comp,
	], '<button id="t"></button>', '#t', 'paddingTop'),
	'8px'
);
record(
	'light-DOM parity: util beats layered comp',
	inLight([
		order, base, util, comp,
	], 'test-light', '<div class="box pz" id="t"></div>', '#t', 'paddingTop'),
	'0px'
);
// @layer ⊃ @scope nesting (light-DOM component path)
const scoped = sheetFrom('@layer uwc.components { @scope (test-scope) { p { padding: 40px; } :scope { padding: 33px; } } }');
record(
	'nested @layer⊃@scope: util beats scoped comp',
	inLight([
		order, base, util, scoped,
	], 'test-scope', '<p class="pz" id="t">x</p>', '#t', 'paddingTop'),
	'0px'
);
record(
	'nested @layer⊃@scope: scoped comp beats base p',
	inLight([
		order, base, util, scoped,
	], 'test-scope', '<p id="t">x</p>', '#t', 'paddingTop'),
	'40px'
);
// Render
function render() {
	const lines = results.map((r) => {
		return `${r.ok ? '✅ PASS' : '❌ FAIL'}  ${r.name}  (got ${r.actual}, expected ${r.expected})`;
	});
	const failed = results.filter((r) => {
		return !r.ok;
	}).length;
	document.getElementById('out').innerHTML = `${failed === 0 ? '<span class="pass">ALL GREEN</span>' : `<span class="fail">${failed} FAILED</span>`}\n\n${lines.map((line) => {
		return line.replace('✅', '<span class="pass">✅</span>').replace('❌', '<span class="fail">❌</span>');
	}).join('\n')}`;
	globalThis.cssTestSummary = {
		total: results.length,
		failed,
	};
}
// Exposed for later tasks to extend.
const cssTest = {
	results,
	record,
	sheetFrom,
	fetchSheet,
	inShadow,
	inLight,
	render,
};
globalThis.cssTest = cssTest;
// ── Task 3: token scales resolve ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const probe = sheetFrom('.probe { padding: var(--space-5); font-size: var(--text-xs); border-radius: var(--radius-md); }');
	cssTest.record(
		'--space-5 resolves to 16px',
		inShadow([vars, probe], '<div class="probe" id="t"></div>', '#t', 'paddingTop'),
		'16px'
	);
	cssTest.record(
		'--text-xs resolves to 11px (0.6875rem @16px root)',
		inShadow([vars, probe], '<div class="probe" id="t">x</div>', '#t', 'fontSize'),
		'11px'
	);
	cssTest.render();
}
// ── Task 4: reset.css ──
{
	const reset = await fetchSheet('./components/core/styles/modules/reset.css');
	const utilSheet = sheetFrom('@layer uwc.util { .pz { padding: 0px; } }');
	const compSheet = sheetFrom('@layer uwc.components { .box { padding: 40px; } }');
	// reset's @layer statement must order a later-adopted comp BELOW util:
	cssTest.record(
		'reset.css statement orders comp < util',
		inShadow([
			reset, utilSheet, compSheet,
		], '<div class="box pz" id="t"></div>', '#t', 'paddingTop'),
		'0px'
	);
	cssTest.record(
		'reset applies border-box',
		inShadow([reset], '<div id="t" style="width:100px;padding:10px;border:5px solid">x</div>', '#t', 'boxSizing'),
		'border-box'
	);
	cssTest.render();
}
// ── Task 5: elements-forms.css ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const reset = await fetchSheet('./components/core/styles/modules/reset.css');
	const forms = await fetchSheet('./components/core/styles/modules/elements-forms.css');
	const compSheet = sheetFrom('@layer uwc.components { .btn { padding: 99px; } }');
	cssTest.record(
		'bare button gets base padding-top (--space-3 = 8px)',
		inShadow([
			vars, reset, forms,
		], '<button id="t">x</button>', '#t', 'paddingTop'),
		'8px'
	);
	cssTest.record(
		'component .btn beats base button',
		inShadow([
			vars, reset, forms, compSheet,
		], '<button class="btn" id="t">x</button>', '#t', 'paddingTop'),
		'99px'
	);
	cssTest.render();
}
// ── Task 6: elements-prose.css ──
// reset.css is included because it zeroes bare-element margins (as in the app);
// without it a bare <p> keeps its UA-default 16px margin. Tokens come from the
// document-level adoption, so no vars sheet is needed here.
{
	const reset = await fetchSheet('./components/core/styles/modules/reset.css');
	const prose = await fetchSheet('./components/core/styles/modules/elements-prose.css');
	cssTest.record(
		'p inside .prose gets margin (--space-4 = 12px)',
		cssTest.inShadow([reset, prose], '<div class="prose"><p id="t">x</p></div>', '#t', 'marginBottom'),
		'12px'
	);
	cssTest.record(
		'bare p OUTSIDE .prose is untouched (reset zeroes it, no prose leak)',
		cssTest.inShadow([reset, prose], '<p id="t">x</p>', '#t', 'marginBottom'),
		'0px'
	);
	cssTest.render();
}
// ── Task 7: modal-chrome.css (the legacy-dialog successor) ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const chrome = await fetchSheet('./components/user/shared/modal-chrome.css');
	cssTest.record(
		'.modal-shell has 0 top padding (core window-bar now owns top clearance, 8a3015dd)',
		inShadow([vars, chrome], '<div class="modal-shell" id="t">x</div>', '#t', 'paddingTop'),
		'0px'
	);
	cssTest.record(
		'.modal-meta-row keeps 2-col grid',
		inShadow([vars, chrome], '<div class="modal-meta-row" id="t"><span></span><span></span></div>', '#t', 'display'),
		'grid'
	);
	cssTest.render();
}
// ── Task 8: util-spacing.css ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const sp = await fetchSheet('./components/core/styles/modules/util-spacing.css');
	const compSheet = sheetFrom('@layer uwc.components { .box { padding: 40px; } }');
	const orderSheet = sheetFrom('@layer uwc.reset, uwc.base, uwc.components, uwc.util;');
	cssTest.record(
		'.p-5 = 16px',
		inShadow([vars, sp], '<div class="p-5" id="t"></div>', '#t', 'paddingTop'),
		'16px'
	);
	cssTest.record(
		'.p-0 utility beats layered component padding',
		inShadow([
			orderSheet, vars, compSheet, sp,
		], '<div class="box p-0" id="t"></div>', '#t', 'paddingTop'),
		'0px'
	);
	cssTest.record(
		'.gap-3 = 8px on a flex row',
		inShadow([vars, sp], '<div class="gap-3" id="t" style="display:flex"><i></i><i></i></div>', '#t', 'columnGap'),
		'8px'
	);
	cssTest.render();
}
// ── Task 9: util-layout.css ──
{
	const lay = await fetchSheet('./components/core/styles/modules/util-layout.css');
	cssTest.record(
		'.row is flex row',
		cssTest.inShadow([lay], '<div class="row" id="t"></div>', '#t', 'flexDirection'),
		'row'
	);
	cssTest.record(
		'.stack is flex column',
		cssTest.inShadow([lay], '<div class="stack" id="t"></div>', '#t', 'flexDirection'),
		'column'
	);
	cssTest.record(
		'.items-center aligns center',
		cssTest.inShadow([lay], '<div class="row items-center" id="t"></div>', '#t', 'alignItems'),
		'center'
	);
	cssTest.render();
}
// ── Task 10: util-type.css ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const ty = await fetchSheet('./components/core/styles/modules/util-type.css');
	cssTest.record(
		'.text-xs = 11px',
		cssTest.inShadow([vars, ty], '<div class="text-xs" id="t">x</div>', '#t', 'fontSize'),
		'11px'
	);
	cssTest.record(
		'.font-bold = 700',
		cssTest.inShadow([vars, ty], '<div class="font-bold" id="t">x</div>', '#t', 'fontWeight'),
		'700'
	);
	cssTest.render();
}
// ── Task 11: util-elevation.css ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const domElement = await fetchSheet('./components/core/styles/modules/util-elevation.css');
	cssTest.record(
		'.shadow-0 = none',
		cssTest.inShadow([vars, domElement], '<div class="shadow-0" id="t">x</div>', '#t', 'boxShadow'),
		'none'
	);
	cssTest.record(
		'.shadow-3 is non-empty',
		(cssTest.inShadow([vars, domElement], '<div class="shadow-3" id="t">x</div>', '#t', 'boxShadow') === 'none') ? 'no' : 'yes',
		'yes'
	);
	cssTest.render();
}
// ── Task 12: util-surface.css ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const su = await fetchSheet('./components/core/styles/modules/util-surface.css');
	cssTest.record(
		'.surface has a border',
		(cssTest.inShadow([vars, su], '<div class="surface" id="t">x</div>', '#t', 'borderTopWidth') === '0px') ? 'no' : 'yes',
		'yes'
	);
	cssTest.record(
		'.border applies a visible border (device-snap tolerant)',
		(parseFloat(cssTest.inShadow([vars, su], '<div class="border" id="t">x</div>', '#t', 'borderTopWidth')) > 0) ? 'yes' : 'no',
		'yes'
	);
	cssTest.render();
}
// ── Task 13: animations.css ──
{
	const an = await fetchSheet('./components/core/styles/modules/animations.css');
	cssTest.record(
		'.anim-spin uses uwc-spin keyframes',
		cssTest.inShadow([an], '<div class="anim-spin" id="t">x</div>', '#t', 'animationName'),
		'uwc-spin'
	);
	cssTest.record(
		'.anim-fade-in-up uses uwc-fade-in-up',
		cssTest.inShadow([an], '<div class="anim-fade-in-up" id="t">x</div>', '#t', 'animationName'),
		'uwc-fade-in-up'
	);
	cssTest.record(
		'.anim-pulse loops infinitely',
		cssTest.inShadow([an], '<div class="anim-pulse" id="t">x</div>', '#t', 'animationIterationCount'),
		'infinite'
	);
	cssTest.render();
}
// ── Task 14: effects.css ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const fx = await fetchSheet('./components/core/styles/modules/effects.css');
	cssTest.record(
		'.full-bleed is absolutely positioned',
		cssTest.inShadow([vars, fx], '<div class="full-bleed" id="t">x</div>', '#t', 'position'),
		'absolute'
	);
	cssTest.record(
		'.hero-split is a 2-col grid',
		(cssTest.inShadow([vars, fx], '<div class="hero hero-split" id="t"><a></a><b></b></div>', '#t', 'gridTemplateColumns').split(' ').length === 2) ? 'yes' : 'no',
		'yes'
	);
	cssTest.record(
		'.fx-glow has a box-shadow',
		(cssTest.inShadow([vars, fx], '<div class="fx-glow" id="t">x</div>', '#t', 'boxShadow') === 'none') ? 'no' : 'yes',
		'yes'
	);
	cssTest.render();
}
// ── Task 15: manifest exposes keyed module sheets ──
{
	const mod = await import('../../../components/core/styles/manifest.js');
	const keys = Object.keys(mod.uwcBase);
	const expected = [
		'uwc.reset', 'uwc.elements', 'uwc.prose', 'uwc.util-spacing', 'uwc.util-layout', 'uwc.util-type', 'uwc.util-elevation', 'uwc.util-surface', 'uwc.animations', 'uwc.effects',
	];
	cssTest.record(
		'manifest exposes all 10 module keys',
		expected.every((key) => {
			return keys.includes(key);
		}) ? 'yes' : 'no',
		'yes'
	);
	cssTest.record(
		'manifest values are CSSStyleSheet (awaited)',
		(await mod.uwcBase['uwc.reset']) instanceof CSSStyleSheet ? 'yes' : 'no',
		'yes'
	);
	cssTest.render();
}
// ── Task 16: component-sheet layering ──
{
	const api = await import('../../../components/core/styles/styleApi.js');
	const wrapped = api.layerComponentSheet('.x { padding: 7px; }');
	cssTest.record(
		'layerComponentSheet wraps in @layer uwc.components',
		(/@layer\s+uwc\.components\s*\{/).test(wrapped) ? 'yes' : 'no',
		'yes'
	);
	cssTest.render();
}
// ── Task 19: end-to-end with the real manifest ──
{
	const mod = await import('../../../components/core/styles/manifest.js');
	const sheets = await Promise.all(Object.values(mod.uwcBase));
	const vars = await cssTest.fetchSheet('./styles/variables.css');
	const compSheet = cssTest.sheetFrom('@layer uwc.components { button { padding: 50px; } }');
	cssTest.record(
		'e2e: .p-0 utility beats layered component button',
		cssTest.inShadow([
			vars, ...sheets, compSheet,
		], '<button class="p-0" id="t">x</button>', '#t', 'paddingTop'),
		'0px'
	);
	cssTest.record(
		'e2e: bare button gets base padding under full manifest',
		cssTest.inShadow([vars, ...sheets], '<button id="t">x</button>', '#t', 'paddingTop'),
		'8px'
	);
	cssTest.render();
}
// ── Task 20: .field theming scope (uwc.base) + .cq container marker (Phase 1 foundation) ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const reset = await fetchSheet('./components/core/styles/modules/reset.css');
	const forms = await fetchSheet('./components/core/styles/modules/elements-forms.css');
	const lay = await fetchSheet('./components/core/styles/modules/util-layout.css');
	const orderSheet = sheetFrom('@layer uwc.reset, uwc.base, uwc.components, uwc.util;');
	const compSheet = sheetFrom('@layer uwc.components { .field { gap: 40px; } }');
	cssTest.record(
		'framework .field is a flex column (uwc.base default)',
		inShadow([
			orderSheet, vars, reset, forms,
		], '<div class="field" id="t"><label>x</label></div>', '#t', 'flexDirection'),
		'column'
	);
	cssTest.record(
		'framework .field gap = --field-gap (--space-2 = 4px)',
		inShadow([
			orderSheet, vars, reset, forms,
		], '<div class="field" id="t"></div>', '#t', 'rowGap'),
		'4px'
	);
	cssTest.record(
		'LOAD-BEARING: component .field (uwc.components) beats framework .field (uwc.base)',
		inShadow([
			orderSheet, vars, reset, forms, compSheet,
		], '<div class="field" id="t"></div>', '#t', 'rowGap'),
		'40px'
	);
	cssTest.record(
		'.cq establishes an inline-size query container',
		inShadow([lay], '<div class="cq" id="t"></div>', '#t', 'containerType'),
		'inline-size'
	);
	cssTest.render();
}
// ── Task 21: universal base-select enhancement (uwc.base) + component-override law ──
{
	const vars = await fetchSheet('./styles/variables.css');
	const reset = await fetchSheet('./components/core/styles/modules/reset.css');
	const forms = await fetchSheet('./components/core/styles/modules/elements-forms.css');
	const orderSheet = sheetFrom('@layer uwc.reset, uwc.base, uwc.components, uwc.util;');
	const tinted = sheetFrom('@layer uwc.components { .sel-tinted { color: red; } }');
	const stripped = sheetFrom('@layer uwc.components { .sel-native { appearance: none; } }');
	// Progressive-enhancement posture in the harness itself: assert the enhancement
	// where base-select exists; record the degrade path where it doesn't.
	if (CSS.supports('appearance', 'base-select')) {
		cssTest.record(
			'universal base-select: bare <select> gets appearance:base-select (uwc.base @supports)',
			inShadow([
				orderSheet, vars, reset, forms,
			], '<select id="t"><option>x</option></select>', '#t', 'appearance'),
			'base-select'
		);
		cssTest.record(
			'appearance-silent component class keeps base-select (settings .sm-input path stays enhanced for free)',
			inShadow([
				orderSheet, vars, reset, forms, tinted,
			], '<select class="sel-tinted" id="t"><option>x</option></select>', '#t', 'appearance'),
			'base-select'
		);
		cssTest.record(
			'LOAD-BEARING: component appearance:none (uwc.components) beats base base-select → why transmit needs its own @supports flip',
			inShadow([
				orderSheet, vars, reset, forms, stripped,
			], '<select class="sel-native" id="t"><option>x</option></select>', '#t', 'appearance'),
			'none'
		);
	} else {
		cssTest.record('base-select unsupported here — native popup degrade path active (enhancement asserts skipped)', 'skipped', 'skipped');
	}
	cssTest.render();
}
/* ⟨INSERT TASK TESTS ABOVE⟩ — every later task inserts its test block directly above this sentinel line, never below it */
render();
globalThis.cssTestRender = render;
