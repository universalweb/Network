import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transformLine, transformText } from './tokenizeCss.js';

test('transformLine tokenizes a px padding decl', function () {
	const out = transformLine('\tpadding: 16px;');
	assert.equal(out.line, '\tpadding: var(--space-5);');
	assert.equal(out.changes.length, 1);
});
test('transformLine preserves a trailing comment', function () {
	const out = transformLine('\tpadding: 8px; /* tight */');
	assert.equal(out.line, '\tpadding: var(--space-3); /* tight */');
});
test('transformLine leaves selectors, color, em, and is idempotent', function () {
	assert.equal(transformLine('button.size-md {').line, 'button.size-md {');
	assert.equal(transformLine('\tcolor: #10b981;').line, '\tcolor: #10b981;');
	assert.equal(transformLine('\tgap: 0.5em;').line, '\tgap: 0.5em;');
	assert.equal(transformLine('\tpadding: var(--space-2);').line, '\tpadding: var(--space-2);');
});
test('transformText snaps shorthands and is idempotent', function () {
	const css = 'a {\n\tpadding: 12px 20px;\n\tcolor: red;\n}\n';
	const once = transformText(css).text;
	const twice = transformText(once).text;
	assert.equal(once, 'a {\n\tpadding: var(--space-4) var(--space-6);\n\tcolor: red;\n}\n');
	assert.equal(twice, once);
});
test('transformText handles multiple declarations on one line', function () {
	const css = '.var-h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; }\n';
	assert.equal(
		transformText(css).text,
		'.var-h1 { font-size: var(--text-3xl); font-weight: var(--weight-bold); line-height: 1.2; }\n',
	);
});
test('transformText leaves custom-props and at-rule preludes', function () {
	assert.equal(transformText('--bar-gap: 4px;').text, '--bar-gap: 4px;');
	assert.equal(transformText('@media (max-width: 600px) {').text, '@media (max-width: 600px) {');
});
test('transformText leaves a px fallback inside var()', function () {
	assert.equal(transformText('\tborder-radius: var(--radius-md, 8px);').text, '\tborder-radius: var(--radius-md, 8px);');
});
