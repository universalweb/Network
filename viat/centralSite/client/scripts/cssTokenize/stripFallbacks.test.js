import assert from 'node:assert/strict';
import test from 'node:test';
import { transformText } from './stripFallbacks.js';
const allowed = new Set([
	'--teal', '--cyan', '--bg-dark',
]);
test('strips a dead hex fallback for an allowed base token', () => {
	const { text } = transformText('.x { color: var(--teal, #6d4aff); }', allowed);
	assert.equal(text, '.x { color: var(--teal); }');
});
test('leaves the fallback for a token NOT in the allowlist (may be live)', () => {
	const input = '.x { color: var(--color-accent, #6d4aff); }';
	const {
		text, strips,
	} = transformText(input, allowed);
	assert.equal(text, input);
	assert.equal(strips.length, 0);
});
test('strips regardless of whether the fallback hex matches the token value', () => {
	const { text } = transformText('.x { color: var(--teal, #ffffff); }', allowed);
	assert.equal(text, '.x { color: var(--teal); }');
});
test('leaves a var() whose fallback is itself a var (no hex)', () => {
	const input = '.x { background: var(--bg-dark, var(--cyan)); }';
	const {
		text, strips,
	} = transformText(input, allowed);
	assert.equal(text, input);
	assert.equal(strips.length, 0);
});
test('nested: strips the inner hex fallback, preserves the outer var', () => {
	const { text } = transformText('.x { color: var(--accent, var(--teal, #6d4aff)); }', allowed);
	assert.equal(text, '.x { color: var(--accent, var(--teal)); }');
});
test('strips every dead fallback in a multi-var declaration', () => {
	const {
		text, strips,
	} = transformText('.x { box-shadow: 0 0 2px var(--teal, #fff), inset 0 0 var(--cyan, #000); }', allowed);
	assert.equal(text, '.x { box-shadow: 0 0 2px var(--teal), inset 0 0 var(--cyan); }');
	assert.equal(strips.length, 2);
});
test('mixed: strips the allowed one, leaves the non-allowed one', () => {
	const {
		text, strips,
	} = transformText('.x { border-color: var(--teal, #111); color: var(--danger, #f00); }', allowed);
	assert.equal(text, '.x { border-color: var(--teal); color: var(--danger, #f00); }');
	assert.equal(strips.length, 1);
});
test('is idempotent', () => {
	const once = transformText('.x { color: var(--teal, #6d4aff); }', allowed).text;
	const twice = transformText(once, allowed).text;
	assert.equal(once, twice);
});
test('strips a dead fallback inside a custom-property value', () => {
	const { text } = transformText('.x { --accent: var(--teal, #6d4aff); }', allowed);
	assert.equal(text, '.x { --accent: var(--teal); }');
});
test('never strips a fallback written inside a comment', () => {
	const input = '/* legacy: var(--teal, #6d4aff) */ .x { color: var(--teal, #6d4aff); }';
	const { text, strips } = transformText(input, allowed);
	assert.equal(text, '/* legacy: var(--teal, #6d4aff) */ .x { color: var(--teal); }');
	assert.equal(strips.length, 1);
});
