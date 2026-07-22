import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * EventEntry's handleEvent serves two roles branched by the dispatched event —
 * the subscribed DOM event, and the AbortSignal's own 'abort'. Keying that
 * branch on `domEvent.type === 'abort'` alone conflates them: `abort` is a
 * GENUINE DOM event (img / video / XHR all fire it), so a real subscriber was
 * swallowed and torn down instead of invoked. The discriminator has to be the
 * event's TARGET (the signal itself), not the type string, because only the
 * target distinguishes the two roles when both carry the type 'abort'.
 */
GlobalRegistrator.register();
const { addEvent } = await import('../events.js');
function makeRecorder() {
	const calls = [];
	function record(domEvent) {
		calls.push(domEvent.type);
	}
	return {
		calls,
		record,
	};
}
test('a genuine "abort" DOM event reaches its handler', () => {
	const host = document.createElement('img');
	const recorder = makeRecorder();
	const entry = addEvent.call(host, 'abort', recorder.record);
	host.dispatchEvent(new Event('abort'));
	assert.deepEqual(recorder.calls, ['abort'], 'the subscribed abort handler fired');
	assert.equal(entry.subscribed, true, 'a real event must not tear the entry down');
	entry.unsubscribe();
});
test('an aborted signal still tears the entry down', () => {
	const host = document.createElement('div');
	const controller = new AbortController();
	const recorder = makeRecorder();
	const entry = addEvent.call(host, 'click', recorder.record, host, {
		signal: controller.signal,
	});
	assert.equal(entry.subscribed, true);
	controller.abort();
	assert.equal(entry.subscribed, false, 'the signal role still cleans up');
	assert.equal(entry.signal, null, 'and releases the signal');
	assert.deepEqual(recorder.calls, [], 'the signal abort is never handler traffic');
});
test('an "abort" subscription carrying a signal keeps both roles apart', () => {
	const host = document.createElement('img');
	const controller = new AbortController();
	const recorder = makeRecorder();
	const entry = addEvent.call(host, 'abort', recorder.record, host, {
		signal: controller.signal,
	});
	host.dispatchEvent(new Event('abort'));
	assert.deepEqual(recorder.calls, ['abort'], 'the element abort is handler traffic');
	assert.equal(entry.subscribed, true, 'and left the subscription live');
	controller.abort();
	assert.equal(entry.subscribed, false, 'while the signal abort still tears down');
	assert.deepEqual(recorder.calls, ['abort'], 'without reaching the handler');
});
