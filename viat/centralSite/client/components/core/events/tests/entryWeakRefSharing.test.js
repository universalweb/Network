import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * E8 weakRefFor sharing (utilities.js weakRefFor + EventEntry/DelegateEntry/
 * hotkeys/listener conversion). The point is one WeakRef per target EVER, so
 * these tests assert REFERENCE IDENTITY across every subscription surface —
 * that is the direct proof the cached path is taken, not merely that behavior
 * stayed green. Dispatch binding is re-asserted at the end because sharing a
 * ref across entries must not change who `this` is at invoke time.
 */
GlobalRegistrator.register();
const {
	addEvent, listener,
} = await import('../events.js');
const { delegate } = await import('../../dom/delegate.js');
const { registerHotkey } = await import('../../hotkeys/hotkeys.js');
const { weakRefFor } = await import('../../utilities.js');
function noopHandler() {}
test('on-route EventEntry: componentRef IS elementRef IS the cached WeakRef', () => {
	const host = document.createElement('div');
	const entry = addEvent.call(host, 'click', noopHandler);
	assert.equal(entry.componentRef, entry.elementRef, 'element===component collapses to ONE ref object');
	assert.equal(entry.componentRef, weakRefFor(host), 'and it is the module-cached ref');
	assert.equal(entry.componentRef.deref(), host);
	const second = addEvent.call(host, 'focus', noopHandler);
	assert.equal(second.componentRef, entry.componentRef, 'later entries reuse the same ref');
	entry.unsubscribe();
	second.unsubscribe();
});
test('distinct element still gets its own ref', () => {
	const host = document.createElement('div');
	const other = document.createElement('span');
	const entry = addEvent.call(host, 'click', noopHandler, other);
	assert.notEqual(entry.componentRef, entry.elementRef);
	assert.equal(entry.elementRef.deref(), other);
	assert.equal(entry.elementRef, weakRefFor(other));
	entry.unsubscribe();
});
test('DelegateEntry, hotkey entry, and cached listener all share the component ref', () => {
	const owner = document.createElement('div');
	const ownerRef = weakRefFor(owner);
	const busEntry = delegate.call(owner, 'app:ping', noopHandler);
	assert.equal(busEntry.ownerRef, ownerRef);
	const binding = registerHotkey(owner, 'ctrl+shift+q', noopHandler, 'api');
	assert.equal(binding.entry.targetRef, ownerRef);
	const wrapper = listener.call(owner, noopHandler);
	assert.equal(wrapper.componentRef, ownerRef);
	busEntry.unsubscribe();
	binding.unregister();
});
test('dispatch through a shared ref still binds the component', () => {
	const host = document.createElement('div');
	const calls = [];
	function record(domEvent, element, eventName) {
		calls.push({
			element,
			eventName,
			self: this,
		});
	}
	const entry = addEvent.call(host, 'click', record);
	host.dispatchEvent(new Event('click'));
	assert.equal(calls.length, 1);
	assert.equal(calls[0].self, host, 'handler this is the component');
	assert.equal(calls[0].element, host);
	assert.equal(calls[0].eventName, 'click');
	entry.unsubscribe();
});
