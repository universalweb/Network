import assert from 'node:assert/strict';
import test from 'node:test';
import { SPOT_TYPE } from '../constants.js';
import { buildHTML } from '../parser.js';
function metaByType(meta, type) {
	return meta.filter((entry) => {
		return entry.type === type;
	});
}
test('.state.path= parses as a PROP whose attr keeps the dotted path', () => {
	const result = buildHTML([
		'<ui-badge .state.size=',
		'></ui-badge>',
	], ['sm']);
	const props = metaByType(result.meta, SPOT_TYPE.PROP);
	assert.equal(props.length, 1);
	assert.equal(props[0].attr, 'state.size');
});
test('.state.deep.path= preserves the full nested path', () => {
	const result = buildHTML([
		'<ui-x .state.dock.activeIndex=',
		'></ui-x>',
	], ['wallet']);
	const props = metaByType(result.meta, SPOT_TYPE.PROP);
	assert.equal(props[0].attr, 'state.dock.activeIndex');
});
test('.method(${value}) parses as METHOD and strips the closing paren', () => {
	const result = buildHTML([
		'<ui-x .grow(',
		')></ui-x>',
	], [3]);
	const methods = metaByType(result.meta, SPOT_TYPE.METHOD);
	assert.equal(methods.length, 1);
	assert.equal(methods[0].method, 'grow');
	assert.ok(!result.html.includes('.grow('), 'method-call literal must become a marker');
	assert.ok(!result.html.includes(')'), 'closing paren must be consumed, not rendered');
	assert.ok(result.html.includes('data-uwc-method-0'), 'marker attribute must be stamped');
});
test('a method-call-looking pattern in TEXT position is NOT a method spot', () => {
	const result = buildHTML([
		'<p>see fn.call(',
		')</p>',
	], ['x']);
	assert.equal(metaByType(result.meta, SPOT_TYPE.METHOD).length, 0);
});
test('plain .foo= still parses as PROP attr foo (regression)', () => {
	const result = buildHTML([
		'<ui-x .foo=',
		'></ui-x>',
	], [1]);
	const props = metaByType(result.meta, SPOT_TYPE.PROP);
	assert.equal(props[0].attr, 'foo');
});
test('@event= still parses as EVENT (regression)', () => {
	function handler() {}
	const result = buildHTML([
		'<button @click=',
		'></button>',
	], [handler]);
	assert.equal(metaByType(result.meta, SPOT_TYPE.EVENT).length, 1);
});
test('plain hyphen/colon attr names are unaffected by the widened name class', () => {
	const result = buildHTML([
		'<svg xml:lang=',
		' data-x=',
		'></svg>',
	], [
		'en',
		'1',
	]);
	const attrs = metaByType(result.meta, SPOT_TYPE.ATTR);
	const names = attrs.map((entry) => {
		return entry.attr;
	});
	assert.ok(names.includes('xml:lang'));
	assert.ok(names.includes('data-x'));
});
test('.method() in a multi-interpolation tag (opener in an earlier string) parses', () => {
	const result = buildHTML([
		'<ui-x .state.dot=',
		' .grow(',
		')></ui-x>',
	], [
		true,
		3,
	]);
	assert.equal(metaByType(result.meta, SPOT_TYPE.PROP).length, 1);
	const methods = metaByType(result.meta, SPOT_TYPE.METHOD);
	assert.equal(methods.length, 1);
	assert.equal(methods[0].method, 'grow');
});
