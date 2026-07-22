import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * E1/E9 keydown fast paths (hotkeys.js onKeydown + comboHasBypassModifier).
 *
 * The single-key fast path and the repeat cache must be OBSERVABLY equivalent
 * to the full comboFromEvent rebuild — the matrix tests pin that. The probe
 * tests go further: a real keyboard can never fire `repeat: true` with a key
 * that differs from the cached one, so a synthetic event that does exactly
 * that splits the two implementations — the cached canonical dispatches where
 * a recompute would produce the probe's own glyph. That is how these tests
 * prove the cache path is TAKEN and that every invalidation edge (keyup, blur,
 * modifier-bit change, codeless event) actually drops the cache.
 *
 * Same happy-dom harness as hotkeys.test.js — register before the dynamic import.
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
/*
 * dispatch()'s default repeat policy skips entries on `repeat: true` events, so
 * every probe that must OBSERVE a repeat dispatch — including the recompute
 * counterfactual, which would otherwise pass vacuously — opts in here.
 */
const REPEAT_OK = {
	allowRepeat: true,
};
const SINGLE_KEY_MATRIX = [
	{
		code: 'KeyA',
		key: 'a',
		spec: 'a',
	},
	{
		code: 'KeyZ',
		key: 'z',
		spec: 'z',
	},
	{
		code: 'Digit0',
		key: '0',
		spec: '0',
	},
	{
		code: 'Enter',
		key: 'Enter',
		spec: 'return',
	},
	{
		code: 'Escape',
		key: 'Escape',
		spec: 'esc',
	},
	{
		code: 'Space',
		key: ' ',
		spec: 'spacebar',
	},
	{
		code: 'ArrowDown',
		key: 'ArrowDown',
		spec: 'down',
	},
	{
		code: 'Slash',
		key: '/',
		spec: '/',
	},
];
test('single-key fast path: dispatch canonical === registration canonical across the matrix', () => {
	const target = makeTarget();
	const matrixLength = SINGLE_KEY_MATRIX.length;
	for (let index = 0; index < matrixLength; index += 1) {
		const sample = SINGLE_KEY_MATRIX[index];
		const log = [];
		const binding = registerHotkey(target, sample.spec, makeRecorder(log), 'api');
		keydown({
			code: sample.code,
			key: sample.key,
		});
		assert.deepEqual(log, [canonicalizeCombo(sample.spec)], `fast path diverged for ${sample.spec}`);
		binding.unregister();
		keyup({
			code: sample.code,
			key: sample.key,
		});
	}
});
const MODIFIER_MATRIX = [
	{
		init: {
			code: 'KeyK',
			ctrlKey: true,
			key: 'k',
		},
		spec: 'ctrl+k',
	},
	{
		init: {
			altKey: true,
			code: 'KeyK',
			key: 'k',
		},
		spec: 'alt+k',
	},
	{
		init: {
			code: 'KeyK',
			key: 'k',
			metaKey: true,
		},
		spec: 'cmd+k',
	},
	{
		init: {
			code: 'KeyK',
			key: 'K',
			shiftKey: true,
		},
		spec: 'shift+k',
	},
	{
		init: {
			code: 'KeyP',
			ctrlKey: true,
			key: 'P',
			shiftKey: true,
		},
		spec: 'ctrl+shift+p',
	},
];
test('modifier combos still resolve through the full rebuild, exactly', () => {
	const target = makeTarget();
	const matrixLength = MODIFIER_MATRIX.length;
	for (let index = 0; index < matrixLength; index += 1) {
		const sample = MODIFIER_MATRIX[index];
		const log = [];
		const binding = registerHotkey(target, sample.spec, makeRecorder(log), 'api');
		keydown(sample.init);
		assert.deepEqual(log, [canonicalizeCombo(sample.spec)], `slow path diverged for ${sample.spec}`);
		binding.unregister();
		keyup({
			code: sample.init.code,
			key: sample.init.key,
		});
	}
});
test('repeat cache is consulted: synthetic repeat with a foreign key serves the cached canonical', () => {
	const target = makeTarget();
	const aLog = [];
	const bLog = [];
	const aBinding = registerHotkey(target, 'a', makeRecorder(aLog), 'api', REPEAT_OK);
	const bBinding = registerHotkey(target, 'b', makeRecorder(bLog), 'api', REPEAT_OK);
	keydown({
		code: 'KeyA',
		key: 'a',
	});
	/*
	 * Impossible on hardware: repeat=true, cached code, DIFFERENT key. A cache
	 * hit dispatches the cached 'a'; a recompute would dispatch 'b'.
	 */
	keydown({
		code: 'KeyA',
		key: 'b',
		repeat: true,
	});
	assert.deepEqual(aLog, [
		'a',
		'a',
	], 'second dispatch came from the cache');
	assert.deepEqual(bLog, [], 'the probe glyph never dispatched — cache path taken');
	aBinding.unregister();
	bBinding.unregister();
	keyup({
		code: 'KeyA',
		key: 'a',
	});
});
test('keyup invalidates: a held chord repeat recomputes after a member is released', () => {
	const target = makeTarget();
	const chordLog = [];
	const soloLog = [];
	const chordBinding = registerHotkey(target, 'a+b', makeRecorder(chordLog), 'api', REPEAT_OK);
	const soloBinding = registerHotkey(target, 'b', makeRecorder(soloLog), 'api', REPEAT_OK);
	keydown({
		code: 'KeyA',
		key: 'a',
	});
	keydown({
		code: 'KeyB',
		key: 'b',
	});
	keydown({
		code: 'KeyB',
		key: 'b',
		repeat: true,
	});
	assert.deepEqual(chordLog, [
		'a+b',
		'a+b',
	], 'chord repeat served while both keys held');
	keyup({
		code: 'KeyA',
		key: 'a',
	});
	keydown({
		code: 'KeyB',
		key: 'b',
		repeat: true,
	});
	assert.deepEqual(soloLog, ['b'], 'post-release repeat recomputed — stale a+b never served');
	assert.deepEqual(chordLog, [
		'a+b',
		'a+b',
	], 'chord did not fire after release');
	chordBinding.unregister();
	soloBinding.unregister();
	keyup({
		code: 'KeyB',
		key: 'b',
	});
});
test('modifier-bit change mid-repeat recomputes the combo', () => {
	const target = makeTarget();
	const bareLog = [];
	const ctrlLog = [];
	const bareBinding = registerHotkey(target, 'a', makeRecorder(bareLog), 'api', REPEAT_OK);
	const ctrlBinding = registerHotkey(target, 'ctrl+a', makeRecorder(ctrlLog), 'api', REPEAT_OK);
	keydown({
		code: 'KeyA',
		key: 'a',
	});
	keydown({
		code: 'KeyA',
		ctrlKey: true,
		key: 'a',
		repeat: true,
	});
	assert.deepEqual(bareLog, ['a']);
	assert.deepEqual(ctrlLog, ['a+ctrl'], 'bits mismatch forced a recompute with the modifier');
	bareBinding.unregister();
	ctrlBinding.unregister();
	keyup({
		code: 'KeyA',
		key: 'a',
	});
});
test('window blur clears held keys AND the repeat cache', () => {
	const target = makeTarget();
	const aLog = [];
	const bLog = [];
	const aBinding = registerHotkey(target, 'a', makeRecorder(aLog), 'api', REPEAT_OK);
	const bBinding = registerHotkey(target, 'b', makeRecorder(bLog), 'api', REPEAT_OK);
	keydown({
		code: 'KeyA',
		key: 'a',
	});
	globalThis.dispatchEvent(new Event('blur'));
	keydown({
		code: 'KeyA',
		key: 'b',
		repeat: true,
	});
	assert.deepEqual(aLog, ['a'], 'stale cached canonical was not served after blur');
	assert.deepEqual(bLog, ['b'], 'post-blur repeat recomputed from live state');
	aBinding.unregister();
	bBinding.unregister();
	keyup({
		code: 'KeyA',
		key: 'b',
	});
});
test('input guard with cached bypass: bare combo stays suppressed, bypass combo fires repeatedly', () => {
	const target = makeTarget();
	const bareLog = [];
	const bypassLog = [];
	const bareBinding = registerHotkey(target, 'j', makeRecorder(bareLog), 'api', REPEAT_OK);
	const bypassBinding = registerHotkey(target, 'ctrl+j', makeRecorder(bypassLog), 'api', REPEAT_OK);
	const field = document.createElement('input');
	document.body.append(field);
	function typeOnField(init) {
		field.dispatchEvent(new KeyboardEvent('keydown', {
			bubbles: true,
			cancelable: true,
			composed: true,
			...init,
		}));
	}
	function releaseOnField(init) {
		field.dispatchEvent(new KeyboardEvent('keyup', {
			bubbles: true,
			...init,
		}));
	}
	typeOnField({
		code: 'KeyJ',
		key: 'j',
	});
	releaseOnField({
		code: 'KeyJ',
		key: 'j',
	});
	typeOnField({
		code: 'KeyJ',
		key: 'j',
	});
	releaseOnField({
		code: 'KeyJ',
		key: 'j',
	});
	assert.deepEqual(bareLog, [], 'bare combo never fires while typing');
	typeOnField({
		code: 'KeyJ',
		ctrlKey: true,
		key: 'j',
	});
	releaseOnField({
		code: 'KeyJ',
		key: 'j',
	});
	typeOnField({
		code: 'KeyJ',
		ctrlKey: true,
		key: 'j',
	});
	releaseOnField({
		code: 'KeyJ',
		key: 'j',
	});
	assert.deepEqual(bypassLog, [
		'ctrl+j',
		'ctrl+j',
	], 'bypass verdict identical on the cached second pass');
	bareBinding.unregister();
	bypassBinding.unregister();
	field.remove();
});
