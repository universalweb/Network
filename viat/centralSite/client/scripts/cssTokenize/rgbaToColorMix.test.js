import assert from 'node:assert/strict';
import test from 'node:test';
import {
	midnightTokenRgb, transformText,
} from './rgbaToColorMix.js';
const tokens = new Map([
	['109,74,255', '--teal'],
	['0,240,255', '--cyan'],
	['248,113,113', '--color-danger'],
]);
test('rewrites a translucent token rgba to color-mix(in oklab)', () => {
	const { text } = transformText('.x { background: rgba(109, 74, 255, 0.34); }', tokens);
	assert.equal(text, '.x { background: color-mix(in oklab, var(--teal) 34%, transparent); }');
});
test('formats fractional and small alphas as clean percentages', () => {
	assert.equal(transformText('.a { color: rgba(0,240,255,0.015); }', tokens).text, '.a { color: color-mix(in oklab, var(--cyan) 1.5%, transparent); }');
	assert.equal(transformText('.b { color: rgba(0,240,255,0.06); }', tokens).text, '.b { color: color-mix(in oklab, var(--cyan) 6%, transparent); }');
	assert.equal(transformText('.c { color: rgba(0,240,255,0.8); }', tokens).text, '.c { color: color-mix(in oklab, var(--cyan) 80%, transparent); }');
});
test('leaves a translucent rgba whose rgb matches no token', () => {
	const input = '.x { color: rgba(1, 2, 3, 0.5); }';
	const { text, mixes } = transformText(input, tokens);
	assert.equal(text, input);
	assert.equal(mixes.length, 0);
});
test('leaves a solid rgb / rgba(...,1) (C3 is translucent-only)', () => {
	const solid = '.x { color: rgb(109, 74, 255); }';
	const opaque = '.y { color: rgba(109, 74, 255, 1); }';
	assert.equal(transformText(solid, tokens).text, solid);
	assert.equal(transformText(opaque, tokens).text, opaque);
});
test('rewrites every translucent token rgba in a multi-value declaration', () => {
	const { text, mixes } = transformText('.x { box-shadow: 0 0 4px rgba(109,74,255,0.4), inset 0 0 2px rgba(248,113,113,0.2); }', tokens);
	assert.equal(text, '.x { box-shadow: 0 0 4px color-mix(in oklab, var(--teal) 40%, transparent), inset 0 0 2px color-mix(in oklab, var(--color-danger) 20%, transparent); }');
	assert.equal(mixes.length, 2);
});
test('never rewrites an rgba written inside a comment', () => {
	const input = '/* was rgba(109,74,255,0.34) */ .x { color: rgba(109,74,255,0.34); }';
	assert.equal(transformText(input, tokens).text, '/* was rgba(109,74,255,0.34) */ .x { color: color-mix(in oklab, var(--teal) 34%, transparent); }');
});
test('is idempotent', () => {
	const once = transformText('.x { color: rgba(109,74,255,0.34); }', tokens).text;
	assert.equal(transformText(once, tokens).text, once);
});
test('midnightTokenRgb excludes white/black and resolves variant collisions to the base token', () => {
	const css = [
		'  --text-light: #ffffff;',
		'  --ink: #000000;',
		'  --color-success: #34d399;',
		'  --green-hover: #34d399;',
		'  --teal: #6d4aff;',
	].join('\n');
	const map = midnightTokenRgb(css);
	assert.equal(map.has('255,255,255'), false);
	assert.equal(map.has('0,0,0'), false);
	assert.equal(map.get('52,211,153'), '--color-success');
	assert.equal(map.get('109,74,255'), '--teal');
});
