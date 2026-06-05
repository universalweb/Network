import assert from 'node:assert/strict';
import { resolveListFilter } from './listFilter.js';
import test from 'node:test';
test('a string names a flag that HIDES the item when truthy', () => {
	const keep = resolveListFilter('hidden');
	assert.equal(keep({
		id: 1,
		hidden: true,
	}), false);
	assert.equal(keep({
		id: 2,
		hidden: false,
	}), true);
	assert.equal(keep({
		id: 3,
	}), true);
});
test('the flag name is arbitrary (disabled, etc.)', () => {
	const keep = resolveListFilter('disabled');
	assert.equal(keep({
		disabled: true,
	}), false);
	assert.equal(keep({
		disabled: 0,
	}), true);
});
test('a function is the keep-predicate verbatim', () => {
	const keep = resolveListFilter((item) => {
		return item.ready === true;
	});
	assert.equal(keep({
		ready: true,
	}), true);
	assert.equal(keep({
		ready: false,
	}), false);
});
test('a non-string, non-function test keeps every item', () => {
	assert.equal(resolveListFilter(null)({
		hidden: true,
	}), true);
	assert.equal(resolveListFilter(undefined)({
		x: 1,
	}), true);
});
