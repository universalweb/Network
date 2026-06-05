import assert from 'node:assert/strict';
import test from 'node:test';
import { transformText } from './pxSizeToRem.js';
test('converts bare px in size props to rem (N/16)', () => {
	assert.equal(transformText('.x { width: 320px; }').text, '.x { width: 20rem; }');
	assert.equal(transformText('.x { min-height: 52px; }').text, '.x { min-height: 3.25rem; }');
	assert.equal(transformText('.x { max-width: 360px; }').text, '.x { max-width: 22.5rem; }');
});
test('leaves hairline / clip-rect ≤2px (sub-pixel risk under a narrow root)', () => {
	assert.equal(transformText('.x { width: 1px; height: 1px; }').text, '.x { width: 1px; height: 1px; }');
	assert.equal(transformText('.x { height: 2px; }').text, '.x { height: 2px; }');
});
test('leaves any value containing a function (already-adaptive composite)', () => {
	const clamp = '.x { width: clamp(160px, 26vw, 280px); }';
	const minFn = '.y { max-width: min(86vw, 440px); }';
	const calc = '.z { height: calc(100% - 20px); }';
	assert.equal(transformText(clamp).text, clamp);
	assert.equal(transformText(minFn).text, minFn);
	assert.equal(transformText(calc).text, calc);
});
test('ignores px in non-size properties (padding belongs to the spacing slice)', () => {
	const input = '.x { padding: 8px; margin-top: 16px; }';
	assert.equal(transformText(input).text, input);
});
test('leaves 0 and unitless / percentage values', () => {
	const input = '.x { width: 0; height: 100%; min-width: auto; }';
	assert.equal(transformText(input).text, input);
});
test('converts logical size properties too', () => {
	assert.equal(transformText('.x { inline-size: 480px; block-size: 240px; }').text, '.x { inline-size: 30rem; block-size: 15rem; }');
});
test('converts every size declaration in a rule', () => {
	const { text, subs } = transformText('.x { min-width: 320px; max-width: 480px; }');
	assert.equal(text, '.x { min-width: 20rem; max-width: 30rem; }');
	assert.equal(subs.length, 2);
});
test('is idempotent', () => {
	const once = transformText('.x { width: 320px; }').text;
	assert.equal(transformText(once).text, once);
});
