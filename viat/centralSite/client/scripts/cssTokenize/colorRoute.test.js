import assert from 'node:assert/strict';
import test from 'node:test';
import { HEX_TO_TOKEN, transformText } from './colorRoute.js';
test('routes each status/brand hex to its semantic token', () => {
	const { text } = transformText('.x { color: #f87171; background: #34d399; border-color: #6d4aff; }');
	assert.match(text, /color: var\(--color-danger\)/);
	assert.match(text, /background: var\(--color-success\)/);
	assert.match(text, /border-color: var\(--teal\)/);
});
test('consolidates off-shades onto the canonical token', () => {
	const { text } = transformText('.x { color: #ef4444; } .y { color: #10b981; } .z { color: #f59e0b; } .w { color: #a5b4fc; }');
	assert.match(text, /color: var\(--color-danger\)/);
	assert.match(text, /color: var\(--color-success\)/);
	assert.match(text, /color: var\(--color-warning\)/);
	assert.match(text, /color: var\(--color-info\)/);
});
test('maps both #fff and #ffffff to --text-light (case-insensitive)', () => {
	const short = transformText('.x { color: #fff; }');
	const long = transformText('.y { color: #FFFFFF; }');
	assert.match(short.text, /color: var\(--text-light\)/);
	assert.match(long.text, /color: var\(--text-light\)/);
});
test('never touches a hex used as a var() fallback (C4 scope)', () => {
	const input = '.x { color: var(--teal, #6d4aff); }';
	const {
		text, subs,
	} = transformText(input);
	assert.equal(text, input);
	assert.equal(subs.length, 0);
});
test('handles spaceless var() fallback (the spec lookbehind would miss this)', () => {
	const input = '.x { color: var(--color-danger,#f87171); }';
	const { text } = transformText(input);
	assert.equal(text, input);
});
test('mixed value: routes the standalone hex, leaves the var() fallback hex', () => {
	const input = '.x { background: linear-gradient(var(--teal, #6d4aff), #34d399); }';
	const {
		text, subs,
	} = transformText(input);
	assert.match(text, /var\(--teal, #6d4aff\)/);
	assert.match(text, /, var\(--color-success\)\)/);
	assert.equal(subs.length, 1);
});
test('leaves component-local / decorative hexes untouched', () => {
	const input = '.x { color: #ff5d8f; background: #f7931a; border-color: #06151a; }';
	const {
		text, subs,
	} = transformText(input);
	assert.equal(text, input);
	assert.equal(subs.length, 0);
});
test('is idempotent', () => {
	const once = transformText('.x { color: #f87171; }').text;
	const twice = transformText(once).text;
	assert.equal(once, twice);
});
test('HEX_TO_TOKEN contains only the route-list hexes, lowercased', () => {
	const keys = [...HEX_TO_TOKEN.keys()];
	assert.ok(keys.every((hexKey) => {
		return hexKey === hexKey.toLowerCase();
	}));
	assert.ok(!HEX_TO_TOKEN.has('#ff5d8f'));
	assert.ok(!HEX_TO_TOKEN.has('#f7931a'));
});
