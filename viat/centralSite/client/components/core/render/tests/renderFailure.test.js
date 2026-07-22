import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Render-failure containment (render.js renderView/renderPass). The contract
 * under test: renderView NEVER rejects and a throwing hook can never wedge
 * the lifecycle — `whenRendered`/`whenMounted`/`whenLive` always settle,
 * failures route to `renderError` (NOT `lifecycleError`), module-global
 * dep tracking is cleared, and the component heals on the next pass because
 * `firstRenderDone`/`templateBuilt` stay false and the previous render's dep
 * subscriptions survive a skipped or failed pass. A hang here (wedged
 * lifecycle promise) fails as a suite timeout. Same happy-dom harness as
 * state/onFlushGate.test.js.
 */
GlobalRegistrator.register();
async function emptyStylesheetText() {
	return '';
}
function stubbedFetch() {
	return Promise.resolve({
		ok: true,
		status: 200,
		text: emptyStylesheetText,
	});
}
globalThis.fetch = stubbedFetch;
const unhandledRejections = [];
function trackRejection(reason) {
	unhandledRejections.push(reason);
}
process.on('unhandledRejection', trackRejection);
const { WebComponent } = await import('../../base.js');
const { Perf } = await import('../../debug/perf.js');
let probeSeq = 0;
function root(element) {
	return element.shadowRoot ?? element;
}
async function mount(tag) {
	const element = document.createElement(tag);
	document.body.appendChild(element);
	await element.pendingConnect;
	return element;
}
afterEach(() => {
	document.body.replaceChildren();
});
/*
 * Base probe: captures the error-channel EVENTS so tests can assert routing —
 * render failures must land in 'renderError' and stay out of 'lifecycleError'.
 * The instance is its own listener (handleEvent tier); every captured event is
 * preventDefault()-ed = HANDLED, so the unprevented loud rethrow stays out of
 * these routing tests (the loud default gets its own test).
 */
class FailureProbe extends WebComponent {
	renderErrors = [];
	lifecycleErrors = [];
	renderCount = 0;
	constructor() {
		super();
		this.addEventListener('renderError', this);
		this.addEventListener('lifecycleError', this);
	}
	handleEvent(domEvent) {
		domEvent.preventDefault();
		if (domEvent.type === 'renderError') {
			this.renderErrors.push(domEvent.detail.data);
			return;
		}
		this.lifecycleErrors.push(domEvent.detail.data);
	}
}
function defineSyncThrowProbe() {
	const tag = `rf-syncthrow-${probeSeq++}`;
	class Probe extends FailureProbe {
		static state = {
			value: 'a',
		};
		render() {
			this.renderCount++;
			if (!this.recovered) {
				throw new Error('sync render boom');
			}
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('sync render() throw: pendingConnect resolves, all lifecycle gates settle, error routes to renderError, next pass heals', async () => {
	const element = await mount(defineSyncThrowProbe());
	assert.equal(element.renderErrors.length, 1, 'renderError received the throw');
	assert.match(element.renderErrors[0].message, /sync render boom/);
	assert.equal(element.lifecycleErrors.length, 0, 'render failure must not leak into lifecycleError');
	assert.equal(element.firstRenderDone, false, 'failed first pass leaves firstRenderDone false');
	await element.lifecycle.whenRendered;
	await element.lifecycle.whenMounted;
	await element.lifecycle.whenLive;
	element.recovered = true;
	element.invalidateRender();
	await element.lifecycle.whenRendered;
	assert.equal(element.firstRenderDone, true, 'retry pass runs the full first-render lifecycle');
	assert.equal(root(element).querySelector('span').textContent, 'a', 'retry pass rendered the template');
	await Perf.settle(4);
	assert.equal(unhandledRejections.length, 0, 'renderView never rejects');
});
function defineAsyncRejectProbe() {
	const tag = `rf-asyncreject-${probeSeq++}`;
	class Probe extends FailureProbe {
		static state = {
			value: 'a',
		};
		async render() {
			this.renderCount++;
			this.html`<span>${this.state.value}</span>`;
			if (!this.recovered) {
				throw new Error('async render boom');
			}
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('async render() rejection: converted at the await site, gates settle, component heals', async () => {
	const element = await mount(defineAsyncRejectProbe());
	assert.equal(element.renderErrors.length, 1, 'renderError received the rejection');
	assert.match(element.renderErrors[0].message, /async render boom/);
	assert.equal(element.firstRenderDone, false);
	await element.lifecycle.whenMounted;
	await element.lifecycle.whenLive;
	element.recovered = true;
	element.invalidateRender();
	await element.lifecycle.whenRendered;
	assert.equal(element.firstRenderDone, true);
	await Perf.settle(4);
	assert.equal(unhandledRejections.length, 0, 'renderView never rejects');
});
function defineBeforeRenderRejectProbe() {
	const tag = `rf-beforereject-${probeSeq++}`;
	class Probe extends FailureProbe {
		static state = {
			value: 'a',
		};
		beforeRender() {
			if (!this.recovered) {
				return Promise.reject(new Error('before boom'));
			}
			return undefined;
		}
		render() {
			this.renderCount++;
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('beforeRender rejection: pass bails without rendering, gates settle, error routed', async () => {
	const element = await mount(defineBeforeRenderRejectProbe());
	assert.equal(element.renderErrors.length, 1, 'renderError received the beforeRender rejection');
	assert.equal(element.renderCount, 0, 'render() never ran on the failed pass');
	await element.lifecycle.whenMounted;
	await element.lifecycle.whenLive;
	element.recovered = true;
	element.invalidateRender();
	await element.lifecycle.whenRendered;
	assert.equal(root(element).querySelector('span').textContent, 'a');
	await Perf.settle(4);
	assert.equal(unhandledRejections.length, 0);
});
function defineSkipProbe() {
	const tag = `rf-skip-${probeSeq++}`;
	class Probe extends FailureProbe {
		static state = {
			value: 'a',
		};
		beforeRender() {
			return !this.skipNext;
		}
		render() {
			this.renderCount++;
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('skipped pass preserves renderDep subscriptions: a later state write still re-renders', async () => {
	const element = await mount(defineSkipProbe());
	assert.equal(element.renderCount, 1);
	assert.equal(root(element).querySelector('span').textContent, 'a');
	element.skipNext = true;
	element.state.value = 'b';
	await Perf.settle(8);
	assert.equal(element.renderCount, 1, 'skipped pass did not run render()');
	assert.equal(root(element).querySelector('span').textContent, 'a', 'DOM untouched by the skipped pass');
	element.skipNext = false;
	element.state.value = 'c';
	await Perf.settle(8);
	assert.equal(element.renderCount, 2, 'dep subscriptions survived the skip — the write re-rendered');
	assert.equal(root(element).querySelector('span').textContent, 'c');
	assert.equal(unhandledRejections.length, 0);
});
function defineMountThrowProbe() {
	const tag = `rf-mountthrow-${probeSeq++}`;
	class Probe extends FailureProbe {
		static state = {
			value: 'a',
		};
		render() {
			this.renderCount++;
			this.html`<span>${this.state.value}</span>`;
		}
		onMount() {
			throw new Error('mount boom');
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('onMount sync throw after whenRendered fired: boundary recovery settles mount/live gates', async () => {
	const element = await mount(defineMountThrowProbe());
	assert.equal(element.renderErrors.length, 1, 'renderError received the onMount throw');
	assert.match(element.renderErrors[0].message, /mount boom/);
	await element.lifecycle.whenRendered;
	await element.lifecycle.whenMounted;
	await element.lifecycle.whenLive;
	assert.equal(root(element).querySelector('span').textContent, 'a', 'template rendered before the mount failure');
	await Perf.settle(4);
	assert.equal(unhandledRejections.length, 0);
});
function defineStateChangeThrowProbe() {
	const tag = `rf-statechange-${probeSeq++}`;
	class Probe extends FailureProbe {
		static state = {
			value: 'a',
		};
		onStateChange() {
			throw new Error('stateChange boom');
		}
		render() {
			this.renderCount++;
			this.html`<span>${this.state.value}</span>`;
		}
	}
	customElements.define(tag, Probe);
	return tag;
}
test('onStateChange throw: contained by runHook, the same flush still renders', async () => {
	const element = await mount(defineStateChangeThrowProbe());
	assert.equal(root(element).querySelector('span').textContent, 'a');
	const lifecycleErrorsAfterMount = element.lifecycleErrors.length;
	element.state.value = 'b';
	await Perf.settle(8);
	assert.equal(root(element).querySelector('span').textContent, 'b', 'render survived the throwing onStateChange');
	assert.ok(element.lifecycleErrors.length > lifecycleErrorsAfterMount, 'onStateChange failure routed to lifecycleError');
	assert.equal(unhandledRejections.length, 0);
});
test('child render throw cannot wedge the parent: awaitChildren proceeds, parent completes its lifecycle', async () => {
	class BadChild extends FailureProbe {
		render() {
			this.renderCount++;
			throw new Error('child boom');
		}
	}
	customElements.define('rf-badchild', BadChild);
	class Parent extends FailureProbe {
		render() {
			this.renderCount++;
			this.html`<div><rf-badchild></rf-badchild></div>`;
		}
	}
	customElements.define('rf-parent', Parent);
	const parentElement = await mount('rf-parent');
	await parentElement.lifecycle.whenRendered;
	await parentElement.lifecycle.whenMounted;
	await parentElement.lifecycle.whenLive;
	assert.equal(parentElement.firstRenderDone, true, 'parent completed despite the broken child');
	const childElement = root(parentElement).querySelector('rf-badchild');
	assert.ok(childElement, 'child was instantiated');
	assert.equal(childElement.renderErrors.length, 1, 'child failure routed to its renderError');
	await childElement.lifecycle.whenRendered;
	await childElement.lifecycle.whenMounted;
	await childElement.lifecycle.whenLive;
	await Perf.settle(4);
	assert.equal(unhandledRejections.length, 0, 'no rejection escaped anywhere in the tree');
});
/*
 * The loud default: error events are cancelable, and preventDefault() is the
 * ONLY thing that marks them handled. A component with no listener (and no
 * ancestor listener) has its failure rethrown raw through queueAsyncError —
 * whose microtask throw the platform converts into a window ErrorEvent
 * (happy-dom emulates this faithfully: the throw lands on window 'error',
 * NOT Node's uncaughtException). Silence is impossible by construction.
 */
test('unhandled renderError is LOUD by default — the rethrow surfaces as a window ErrorEvent', async () => {
	const absorbed = [];
	function absorbWindowError(errorEvent) {
		absorbed.push(errorEvent.error ?? errorEvent.message);
		errorEvent.preventDefault();
	}
	globalThis.addEventListener('error', absorbWindowError);
	const tag = `rf-loud-${probeSeq++}`;
	class LoudProbe extends WebComponent {
		render() {
			throw new Error('unheard render boom');
		}
	}
	customElements.define(tag, LoudProbe);
	const element = document.createElement(tag);
	document.body.appendChild(element);
	await element.pendingConnect;
	await Perf.settle(4);
	globalThis.removeEventListener('error', absorbWindowError);
	assert.equal(absorbed.length, 1, 'the unprevented renderError fell through to the raw rethrow');
	assert.match(absorbed[0].message, /unheard render boom/);
	await element.lifecycle.whenRendered;
	assert.equal(unhandledRejections.length, 0, 'loudness rides the sanctioned rethrow, not a leaked rejection');
});
/*
 * The delegation payoff of error-as-EVENT: renderError bubbles (composed), so
 * one ancestor listener observes every descendant's failure — an app shell
 * can own error reporting without per-component wiring.
 */
test('renderError bubbles: an ancestor listener catches a descendant failure and can mark it handled', async () => {
	const captured = [];
	function shellListener(domEvent) {
		domEvent.preventDefault();
		captured.push(domEvent.detail.data);
	}
	document.body.addEventListener('renderError', shellListener);
	const tag = `rf-bubble-${probeSeq++}`;
	class BubbleProbe extends WebComponent {
		render() {
			throw new Error('bubbled render boom');
		}
	}
	customElements.define(tag, BubbleProbe);
	const element = document.createElement(tag);
	document.body.appendChild(element);
	await element.pendingConnect;
	await Perf.settle(4);
	document.body.removeEventListener('renderError', shellListener);
	assert.equal(captured.length, 1, 'the shell listener saw the descendant failure');
	assert.match(captured[0].message, /bubbled render boom/);
});
