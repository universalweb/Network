import assert from 'node:assert/strict';
import test from 'node:test';
import { Binding } from '../binding.js';
/*
 * Pure-node — Binding's channel resolution is DOM-free. The channel parse is
 * memoized (X18): repeated constructions of one key must resolve identical
 * routing, and a bad key must throw on EVERY construction (a throwing key
 * never enters the cache).
 */
function newBogusChannel() {
	return new Binding('bogus.channel', 1);
}
function newBareStoreKey() {
	return new Binding('stores.shop', 1);
}
test('Binding resolves each channel shape to its routing fields', () => {
	const bare = new Binding('items', 1);
	assert.deepEqual([
		bare.global,
		bare.storeName,
		bare.key,
	], [
		false,
		null,
		'items',
	]);
	const local = new Binding('state.items', 1);
	assert.deepEqual([
		local.global,
		local.storeName,
		local.key,
	], [
		false,
		null,
		'items',
	]);
	const prefixed = new Binding('this.state.user.profile', 1);
	assert.deepEqual([
		prefixed.global,
		prefixed.storeName,
		prefixed.key,
	], [
		false,
		null,
		'user.profile',
	]);
	const shared = new Binding('global.things.count', 1);
	assert.deepEqual([
		shared.global,
		shared.storeName,
		shared.key,
	], [
		true,
		null,
		'things.count',
	]);
	const named = new Binding('stores.shop.items.4.label', 1);
	assert.deepEqual([
		named.global,
		named.storeName,
		named.key,
	], [
		false,
		'shop',
		'items.4.label',
	]);
});
test('repeated construction of one key resolves identically (memoized parse)', () => {
	const first = new Binding('global.cart.total', 1);
	const second = new Binding('global.cart.total', 2);
	assert.equal(second.global, first.global);
	assert.equal(second.storeName, first.storeName);
	assert.equal(second.key, first.key);
	assert.equal(second.value, 2, 'value stays per-instance');
});
test('a bad channel key throws on every construction — never cached', () => {
	assert.throws(newBogusChannel, /must name its channel/);
	assert.throws(newBogusChannel, /must name its channel/, 'second construction throws again');
	assert.throws(newBareStoreKey, /WITHIN the store/);
});
