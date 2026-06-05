import assert from 'node:assert/strict';
import test from 'node:test';
import { transformText } from './routeOrphanVars.js';
test('rewrites an undefined orphan token to its real semantic token', () => {
	assert.equal(transformText('.x { color: var(--color-accent, #6d4aff); }').text, '.x { color: var(--teal); }');
	assert.equal(transformText('.x { color: var(--text-default, #e8eaf2); }').text, '.x { color: var(--text-main); }');
});
test('rewrites --danger regardless of the discarded fallback hex (consolidation)', () => {
	assert.equal(transformText('.a { color: var(--danger, #f87171); }').text, '.a { color: var(--color-danger); }');
	assert.equal(transformText('.b { color: var(--danger, #ef4444); }').text, '.b { color: var(--color-danger); }');
});
test('does NOT collide with a longer token sharing the prefix (--danger-hover)', () => {
	const input = '.x { color: var(--danger-hover, #dc2626); }';
	const { text, routes } = transformText(input);
	assert.equal(text, input);
	assert.equal(routes.length, 0);
});
test('leaves a non-hex fallback (currentColor) untouched — not a proven identity', () => {
	const input = '.x { color: var(--text-default, currentColor); }';
	const { text, routes } = transformText(input);
	assert.equal(text, input);
	assert.equal(routes.length, 0);
});
test('leaves an already-correct token (not an orphan) untouched', () => {
	const input = '.x { color: var(--teal, #6d4aff); }';
	const { text, routes } = transformText(input);
	assert.equal(text, input);
	assert.equal(routes.length, 0);
});
test('rewrites an orphan inside a custom-property value', () => {
	assert.equal(transformText('.x { --accent: var(--color-accent, #6d4aff); }').text, '.x { --accent: var(--teal); }');
});
test('never rewrites a fallback written inside a comment', () => {
	const input = '/* old var(--color-accent, #6d4aff) */ .x { color: var(--color-accent, #6d4aff); }';
	assert.equal(transformText(input).text, '/* old var(--color-accent, #6d4aff) */ .x { color: var(--teal); }');
});
test('is idempotent', () => {
	const once = transformText('.x { color: var(--color-accent, #6d4aff); }').text;
	assert.equal(transformText(once).text, once);
});
