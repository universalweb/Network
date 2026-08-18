import assert from 'node:assert/strict';
import test from 'node:test';
import { clampOffset, offsetIsOpen } from '../pulldownOffset.js';
test('clampOffset tracks start + delta within the travel span', () => {
	assert.equal(clampOffset(0, 120, 1000), 120);
	assert.equal(clampOffset(1000, -300, 1000), 700);
	assert.equal(clampOffset(600, 80, 1000), 680);
});
test('clampOffset holds the floor and ceiling on over-drag', () => {
	assert.equal(clampOffset(0, -50, 1000), 0);
	assert.equal(clampOffset(900, 400, 1000), 1000);
});
test('clampOffset never teleports: a down-drag from the top stays near the top', () => {
	/* The bug drove targetY to max here from a stale-open boolean; offset math
	   keeps the bar a delta away from where it actually was — no jump. */
	assert.equal(clampOffset(0, 60, 1208), 60);
});
test('close-drag from open reaches home after bar travel, not full viewport', () => {
	const max = 1000;
	assert.equal(clampOffset(max, -max, max), 0);
	assert.equal(clampOffset(max, -(max + 80), max), 0);
	assert.equal(clampOffset(max, -300, max), 700);
});
test('offsetIsOpen splits on the halfway line', () => {
	assert.equal(offsetIsOpen(0, 1000), false);
	assert.equal(offsetIsOpen(600, 1000), true);
	assert.equal(offsetIsOpen(500, 1000), false);
});
