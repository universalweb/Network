import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	nearestIndex, snapSpacing, snapRadiusPx, snapFontRem, snapWeight,
	snapPiece, snapValue, bucketForProperty,
} from './snap.js';

test('nearestIndex ties resolve down', function () {
	assert.equal(nearestIndex(18, [0, 2, 4, 8, 12, 16, 20, 24]), 5); // 16 over 20
});
test('snapSpacing maps; ties resolve down; index === --space-N', function () {
	assert.equal(snapSpacing(16), '--space-5');
	assert.equal(snapSpacing(18), '--space-5'); // tie 16/20 → 16
	assert.equal(snapSpacing(10), '--space-3'); // tie 8/12 → 8
	assert.equal(snapSpacing(64), '--space-12');
});
test('snapSpacing leaves hairlines/zero/negatives/outliers', function () {
	assert.equal(snapSpacing(1), null);
	assert.equal(snapSpacing(0), null);
	assert.equal(snapSpacing(-4), null);
	assert.equal(snapSpacing(80), null);
});
test('snapRadiusPx is structural-only and preserves sharp corners', function () {
	assert.equal(snapRadiusPx(6), '--radius-md');
	assert.equal(snapRadiusPx(8), '--radius-md');
	assert.equal(snapRadiusPx(9), null); // themeable lg/xl band left raw
	assert.equal(snapRadiusPx(0), null); // sharp corner preserved
});
test('snapFontRem maps in-scale rem; leaves off-scale display/micro sizes', function () {
	assert.equal(snapFontRem(0.75), '--text-sm');
	assert.equal(snapFontRem(0.6875), '--text-xs');
	assert.equal(snapFontRem(1), '--text-lg');
	assert.equal(snapFontRem(0.65), '--text-2xs'); // 0.025 away → snap
	assert.equal(snapFontRem(2.25), null); // display heading above scale → leave
	assert.equal(snapFontRem(2.4), null);  // display heading above scale → leave
	assert.equal(snapFontRem(0.5), null);  // micro-label below scale → leave
});
test('snapWeight is exact-only', function () {
	assert.equal(snapWeight(600), '--weight-semibold');
	assert.equal(snapWeight(450), null);
});
test('snapPiece respects unit gates', function () {
	assert.equal(snapPiece('16px', 'spacing'), 'var(--space-5)');
	assert.equal(snapPiece('0.5rem', 'spacing'), null); // rem already relative
	assert.equal(snapPiece('11px', 'fontSize'), null);  // px font-size left (§2b)
	assert.equal(snapPiece('0.75rem', 'fontSize'), 'var(--text-sm)');
	assert.equal(snapPiece('auto', 'spacing'), null);
});
test('snapValue handles shorthand; leaves function values whole', function () {
	assert.equal(snapValue('8px 16px', 'spacing').value, 'var(--space-3) var(--space-5)');
	assert.equal(snapValue('calc(100% - 8px)', 'spacing').value, 'calc(100% - 8px)');
});
test('bucketForProperty maps in-scope props only', function () {
	assert.equal(bucketForProperty('padding'), 'spacing');
	assert.equal(bucketForProperty('padding-inline-start'), 'spacing');
	assert.equal(bucketForProperty('gap'), 'spacing');
	assert.equal(bucketForProperty('border-radius'), 'radius');
	assert.equal(bucketForProperty('font-size'), 'fontSize');
	assert.equal(bucketForProperty('color'), null);
	assert.equal(bucketForProperty('width'), null); // sizing out of scope
});
