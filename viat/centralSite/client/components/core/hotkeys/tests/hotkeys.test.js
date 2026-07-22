import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * hotkeys.js reads `navigator` at module load and lazily attaches its master
 * listener to `document`, so the happy-dom globals must exist before the module
 * loads — register first, then dynamic-import (static imports would hoist).
 */
GlobalRegistrator.register();
const {
	canonicalizeCombo, registerHotkey,
} = await import('../hotkeys.js');
function keydown(init) {
	document.dispatchEvent(new KeyboardEvent('keydown', {
		bubbles: true,
		cancelable: true,
		...init,
	}));
}
function keyup(init) {
	document.dispatchEvent(new KeyboardEvent('keyup', {
		bubbles: true,
		...init,
	}));
}
function makeTarget() {
	return {
		isConnected: true,
	};
}
function makeRecorder(log) {
	return function record(keyEvent, canonical) {
		log.push(canonical);
	};
}
test('canonicalizeCombo: order-insensitive, alias-resolved, deduped', () => {
	assert.equal(canonicalizeCombo('b+a'), 'a+b');
	assert.equal(canonicalizeCombo('Cmd+K'), canonicalizeCombo('meta+k'));
	assert.equal(canonicalizeCombo('ctrl+control+x'), 'ctrl+x');
	assert.equal(canonicalizeCombo('Shift+Esc'), 'escape+shift');
});
/*
 * Regression lock: `heldKeys` is a Map, and combo assembly must iterate its
 * VALUES. A bare `for…of heldKeys` yields [code, glyph] entries, which turns
 * every assembled combo into garbage ("keyk,k") and silently kills dispatch.
 */
test('dispatch: modifier+letter combo fires with the canonical combo', () => {
	const log = [];
	const target = makeTarget();
	const binding = registerHotkey(target, 'ctrl+k', makeRecorder(log), 'api');
	keydown({
		code: 'KeyK',
		ctrlKey: true,
		key: 'k',
	});
	assert.deepEqual(log, ['ctrl+k']);
	binding.unregister();
	keyup({
		code: 'KeyK',
		key: 'k',
	});
});
test('dispatch: multi-key chord assembles from every held glyph', () => {
	const log = [];
	const target = makeTarget();
	const binding = registerHotkey(target, 'b+a', makeRecorder(log), 'api');
	keydown({
		code: 'KeyA',
		key: 'a',
	});
	keydown({
		code: 'KeyB',
		key: 'b',
	});
	assert.deepEqual(log, ['a+b']);
	binding.unregister();
	keyup({
		code: 'KeyA',
		key: 'a',
	});
	keyup({
		code: 'KeyB',
		key: 'b',
	});
});
test('shift: meaningful for letters, ignored for shifted symbols', () => {
	const log = [];
	const target = makeTarget();
	const letter = registerHotkey(target, 'shift+k', makeRecorder(log), 'api');
	keydown({
		code: 'KeyK',
		key: 'K',
		shiftKey: true,
	});
	keyup({
		code: 'KeyK',
		key: 'K',
	});
	const symbol = registerHotkey(target, '~', makeRecorder(log), 'api');
	keydown({
		code: 'Backquote',
		key: '~',
		shiftKey: true,
	});
	keyup({
		code: 'Backquote',
		key: '~',
	});
	assert.deepEqual(log, [
		'k+shift',
		'~',
	]);
	letter.unregister();
	symbol.unregister();
});
test('keyup: released keys leave the held set — later combos carry no residue', () => {
	const log = [];
	const target = makeTarget();
	const binding = registerHotkey(target, 'b', makeRecorder(log), 'api');
	keydown({
		code: 'KeyA',
		key: 'a',
	});
	keyup({
		code: 'KeyA',
		key: 'a',
	});
	keydown({
		code: 'KeyB',
		key: 'b',
	});
	assert.deepEqual(log, ['b']);
	binding.unregister();
	keyup({
		code: 'KeyB',
		key: 'b',
	});
});
test('unregister: stops dispatch; a later binding re-arms the master listener', () => {
	const log = [];
	const target = makeTarget();
	const first = registerHotkey(target, 'ctrl+j', makeRecorder(log), 'api');
	first.unregister();
	keydown({
		code: 'KeyJ',
		ctrlKey: true,
		key: 'j',
	});
	keyup({
		code: 'KeyJ',
		key: 'j',
	});
	assert.deepEqual(log, []);
	const second = registerHotkey(target, 'ctrl+j', makeRecorder(log), 'api');
	keydown({
		code: 'KeyJ',
		ctrlKey: true,
		key: 'j',
	});
	assert.deepEqual(log, ['ctrl+j']);
	second.unregister();
	keyup({
		code: 'KeyJ',
		key: 'j',
	});
});
