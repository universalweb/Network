import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Behaviors read DOM globals (and device.js reads navigator) at module load,
 * so happy-dom must register before the dynamic imports below.
 */
GlobalRegistrator.register();
const { BehaviorTeardown } = await import('../registry.js');
const { autoselect } = await import('../autoselect.js');
const { hotkey } = await import('../hotkey.js');
const { reveal } = await import('../reveal.js');
test('contract: no behavior install returns a value (closure-free teardown)', async () => {
	const { autofocus } = await import('../autofocus.js');
	const { autoResize } = await import('../autoResize.js');
	const { scrollReport } = await import('../scrollReport.js');
	const { tooltip } = await import('../tooltip.js');
	const behaviors = [
		autofocus, autoResize, autoselect, hotkey, reveal, scrollReport, tooltip,
	];
	const behaviorsLength = behaviors.length;
	for (let index = 0; index < behaviorsLength; index++) {
		const behavior = behaviors[index];
		const element = document.createElement('textarea');
		document.body.append(element);
		assert.equal(behavior.install(element, undefined), undefined, `${behavior.name} install must return nothing`);
		behavior.uninstall?.(element);
		element.remove();
	}
});
test('BehaviorTeardown routes unsubscribe to behavior.uninstall(element)', () => {
	const calls = [];
	const fakeElement = {};
	const fakeBehavior = {
		uninstall(element) {
			calls.push(element);
		},
	};
	const teardown = new BehaviorTeardown(fakeBehavior, fakeElement);
	teardown.unsubscribe();
	assert.equal(calls.length, 1);
	assert.equal(calls[0], fakeElement);
});
test('autoselect: shared listener selects on focus, uninstall detaches it', () => {
	const input = document.createElement('input');
	input.value = 'select me';
	document.body.append(input);
	let selectCount = 0;
	input.select = function countSelect() {
		selectCount++;
	};
	autoselect.install(input);
	input.dispatchEvent(new Event('focus'));
	assert.equal(selectCount, 1);
	autoselect.uninstall(input);
	input.dispatchEvent(new Event('focus'));
	assert.equal(selectCount, 1, 'listener must be gone after uninstall');
	input.remove();
});
test('hotkey behavior: install fires the hotkey event, uninstall releases the entry', () => {
	const element = document.createElement('div');
	document.body.append(element);
	const fired = [];
	element.addEventListener('hotkey', (hotkeyEvent) => {
		fired.push(hotkeyEvent.detail.combo);
	});
	hotkey.install(element, 'ctrl+q');
	document.dispatchEvent(new KeyboardEvent('keydown', {
		bubbles: true,
		ctrlKey: true,
		key: 'q',
		code: 'KeyQ',
	}));
	document.dispatchEvent(new KeyboardEvent('keyup', {
		bubbles: true,
		key: 'q',
		code: 'KeyQ',
	}));
	assert.deepEqual(fired, ['ctrl+q']);
	hotkey.uninstall(element);
	document.dispatchEvent(new KeyboardEvent('keydown', {
		bubbles: true,
		ctrlKey: true,
		key: 'q',
		code: 'KeyQ',
	}));
	assert.equal(fired.length, 1, 'released hotkey must not fire again');
	element.remove();
});
test('reveal: shares one observer per root margin, uninstall unobserves', () => {
	const observed = [];
	const unobserved = [];
	const created = [];
	class FakeIntersectionObserver {
		constructor(callback, options) {
			created.push(options.rootMargin);
		}
		observe(element) {
			observed.push(element);
		}
		unobserve(element) {
			unobserved.push(element);
		}
	}
	const realObserver = globalThis.IntersectionObserver;
	globalThis.IntersectionObserver = FakeIntersectionObserver;
	/*
	 * Fresh margins per test run — the module caches an observer per margin
	 * forever, so only unseen margins exercise the creation path.
	 */
	const first = document.createElement('div');
	const second = document.createElement('div');
	const other = document.createElement('div');
	reveal.install(first, '0px 0px -25% 0px');
	reveal.install(second, '0px 0px -25% 0px');
	reveal.install(other, '0px 0px -50% 0px');
	assert.deepEqual(created, ['0px 0px -25% 0px', '0px 0px -50% 0px'], 'same margin shares one observer; a new margin mints its own');
	assert.equal(observed.length, 3);
	reveal.uninstall(first);
	assert.deepEqual(unobserved, [first]);
	reveal.uninstall(other);
	assert.deepEqual(unobserved, [first, other]);
	reveal.uninstall(second);
	globalThis.IntersectionObserver = realObserver;
});
