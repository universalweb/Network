import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
/*
 * Logger data-arg forwarding (the audit's tk:20 fix). `#levelLog` used to call
 * `printLine(level, label, resolved, [])` for plain (non-function) messages,
 * hard-dropping every trailing data arg — so `onLifecycleError`/`onRenderError`
 * (base.js), which pass the component, state, and the Error object, printed the
 * label + message and SILENTLY lost the error object in dev AND prod. The fix
 * forwards `extra` for the plain form while keeping the lazy-function form
 * (invoke → may return null to skip). A regression re-swallows diagnostics.
 * No DOM needed — the logger only touches console.
 */
const { defaultLogger } = await import('../logger.js');
const originalError = console.error;
const captured = [];
function captureError(...args) {
	captured.push(args);
}
afterEach(() => {
	console.error = originalError;
	captured.length = 0;
});
test('plain-message error forwards trailing data args (the dropped error object)', () => {
	console.error = captureError;
	const errorObject = new Error('boom');
	const stateSnapshot = {
		open: true,
	};
	defaultLogger.error('LIFECYCLE', 'render failed', errorObject, stateSnapshot);
	assert.equal(captured.length, 1, 'one console.error call');
	const args = captured[0];
	assert.ok(args.includes(errorObject), 'the Error object reached the console (was dropped pre-fix)');
	assert.ok(args.includes(stateSnapshot), 'the state snapshot reached the console too');
});
test('lazy-function message still resolves and skips on null', () => {
	console.error = captureError;
	function formatMessage(count) {
		return count > 0 ? `count is ${count}` : null;
	}
	defaultLogger.error('LAZY', formatMessage, 3);
	assert.equal(captured.length, 1, 'non-null lazy result printed');
	assert.ok(captured[0].includes('count is 3'), 'formatter received the trailing arg');
	defaultLogger.error('LAZY', formatMessage, 0);
	assert.equal(captured.length, 1, 'null lazy result skipped the line entirely');
});
