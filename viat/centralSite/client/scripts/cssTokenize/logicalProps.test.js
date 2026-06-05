import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renameProperty, transformText } from './logicalProps.js';
test('renameProperty maps padding/margin sides', () => {
	assert.equal(renameProperty('padding-left'), 'padding-inline-start');
	assert.equal(renameProperty('padding-right'), 'padding-inline-end');
	assert.equal(renameProperty('margin-top'), 'margin-block-start');
	assert.equal(renameProperty('margin-bottom'), 'margin-block-end');
});
test('renameProperty maps bare positioning to inset-*', () => {
	assert.equal(renameProperty('top'), 'inset-block-start');
	assert.equal(renameProperty('left'), 'inset-inline-start');
	assert.equal(renameProperty('right'), 'inset-inline-end');
	assert.equal(renameProperty('bottom'), 'inset-block-end');
});
test('renameProperty maps border sides + sub-props', () => {
	assert.equal(renameProperty('border-bottom'), 'border-block-end');
	assert.equal(renameProperty('border-left-color'), 'border-inline-start-color');
	assert.equal(renameProperty('border-top-width'), 'border-block-start-width');
});
test('renameProperty leaves out-of-scope props', () => {
	assert.equal(renameProperty('padding'), null);
	assert.equal(renameProperty('width'), null); // sizing slice
	assert.equal(renameProperty('height'), null);
	assert.equal(renameProperty('color'), null);
	assert.equal(renameProperty('border-radius'), null);
});
test('transformText renames declarations, preserves value + leaves selectors', () => {
	const css = '.x:hover {\n\tpadding-left: 12px;\n\tleft: 0;\n\tborder-bottom: 1px solid var(--c);\n\tcolor: red;\n}\n';
	const out = transformText(css).text;
	assert.equal(
		out,
		'.x:hover {\n\tpadding-inline-start: 12px;\n\tinset-inline-start: 0;\n\tborder-block-end: 1px solid var(--c);\n\tcolor: red;\n}\n'
	);
});
test('transformText is idempotent and does not corrupt a .left:hover selector', () => {
	const css = '.left:hover { color: red; }\n.bar { top: 4px; }\n';
	const once = transformText(css).text;
	const twice = transformText(once).text;
	assert.equal(once, '.left:hover { color: red; }\n.bar { inset-block-start: 4px; }\n');
	assert.equal(twice, once);
});
