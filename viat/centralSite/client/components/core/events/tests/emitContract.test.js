import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * E7 shared-init contract (events.js createBusEvent/emit + delegate.js
 * emitDelegate). The CustomEvent init dictionary is a module-level object
 * mutated per emit — safe ONLY because the constructor converts it
 * synchronously. These tests pin the observable half of that claim: nested
 * emits cannot clobber the outer event, sequential emits get distinct detail
 * wrappers, and every default/override of the old per-emit-literal shape
 * survives the sharing.
 */
GlobalRegistrator.register();
const {
	addEvent, emit, off,
} = await import('../events.js');
const { emitDelegate } = await import('../../dom/delegate.js');
test('emit defaults: bubbles + composed true, cancelable false, {data, source} detail', () => {
	const host = document.createElement('div');
	const child = document.createElement('span');
	host.append(child);
	let seen = null;
	function capture(domEvent) {
		seen = domEvent;
	}
	host.addEventListener('thing:change', capture);
	const payload = {
		value: 7,
	};
	const proceeded = emit.call(child, 'thing:change', payload);
	assert.equal(proceeded, true, 'non-cancelable dispatch reports true');
	assert.equal(seen.bubbles, true, 'bubbled to the parent');
	assert.equal(seen.composed, true);
	assert.equal(seen.cancelable, false);
	assert.equal(seen.detail.data, payload, 'payload rides detail.data by reference');
	assert.equal(seen.detail.source, child, 'source defaults to the emitter');
});
test('emit overrides: cancelable honours preventDefault, bubbles:false stays local', () => {
	const host = document.createElement('div');
	const child = document.createElement('span');
	host.append(child);
	function cancelIt(domEvent) {
		domEvent.preventDefault();
	}
	child.addEventListener('ask:confirm', cancelIt);
	const proceeded = emit.call(child, 'ask:confirm', {}, {
		cancelable: true,
	});
	assert.equal(proceeded, false, 'preventDefault flows back through the return');
	let parentSaw = 0;
	function countAtParent() {
		parentSaw += 1;
	}
	host.addEventListener('local:ping', countAtParent);
	emit.call(child, 'local:ping', {}, {
		bubbles: false,
	});
	assert.equal(parentSaw, 0, 'bubbles:false never reached the parent');
});
test('nested emit inside a handler leaves the outer event intact — the shared-init proof', () => {
	const host = document.createElement('div');
	const events = [];
	function onInner(domEvent) {
		events.push(domEvent);
	}
	function onOuter(domEvent) {
		events.push(domEvent);
		emit.call(host, 'inner:change', {
			n: 2,
		}, {
			bubbles: false,
			cancelable: true,
		});
	}
	host.addEventListener('outer:change', onOuter);
	host.addEventListener('inner:change', onInner);
	emit.call(host, 'outer:change', {
		n: 1,
	});
	const outer = events[0];
	const inner = events[1];
	assert.equal(events.length, 2);
	assert.equal(outer.type, 'outer:change');
	assert.equal(outer.bubbles, true, 'inner bubbles:false did not clobber the outer event');
	assert.equal(outer.cancelable, false, 'inner cancelable:true did not clobber the outer event');
	assert.equal(inner.bubbles, false);
	assert.equal(inner.cancelable, true);
	assert.notEqual(outer.detail, inner.detail, 'each emit owns a fresh detail wrapper');
	assert.equal(outer.detail.data.n, 1);
	assert.equal(inner.detail.data.n, 2);
});
test('sequential emits carry distinct detail objects', () => {
	const host = document.createElement('div');
	const details = [];
	function keepDetail(domEvent) {
		details.push(domEvent.detail);
	}
	host.addEventListener('seq:ping', keepDetail);
	emit.call(host, 'seq:ping', {
		n: 1,
	});
	emit.call(host, 'seq:ping', {
		n: 2,
	});
	assert.notEqual(details[0], details[1]);
	assert.equal(details[0].data.n, 1, 'first detail unchanged after the second emit');
});
test('emitDelegate: bus shape with a null source', () => {
	let seen = null;
	function capture(domEvent) {
		seen = domEvent;
	}
	document.addEventListener('svc:ping', capture);
	emitDelegate('svc:ping', {
		up: true,
	});
	document.removeEventListener('svc:ping', capture);
	assert.equal(seen.bubbles, true);
	assert.equal(seen.composed, true);
	assert.equal(seen.cancelable, false);
	assert.equal(seen.detail.data.up, true);
	assert.equal(seen.detail.source, null, 'owner-less bus publish carries source null');
});
test('event names trim once and behave identically: install, fire, off', () => {
	const button = document.createElement('button');
	let hits = 0;
	function onClick() {
		hits += 1;
	}
	const entry = addEvent.call(button, '  click  ', onClick);
	assert.equal(entry.eventName, 'click', 'stored name is the trimmed name');
	button.dispatchEvent(new Event('click'));
	assert.equal(hits, 1);
	off.call(button, ' click ', onClick);
	button.dispatchEvent(new Event('click'));
	assert.equal(hits, 1, 'off matched the trimmed name and detached');
});
