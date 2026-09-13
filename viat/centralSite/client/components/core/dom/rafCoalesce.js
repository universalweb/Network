/*
	rafCoalesce — one rAF per host so scroll handlers can defer layout-forcing
	geometry reads. Scroll can fire many times per frame; reading scrollHeight
	/ clientHeight each time is a forced layout. The tick is minted once per
	host (WeakMap) so a repeated schedule allocates nothing.
*/
const slots = new WeakMap();
function createSlot(host) {
	const slot = {
		id: 0,
		run: null,
		tick: null,
	};
	slot.tick = () => {
		slot.id = 0;
		slot.run.call(host);
	};
	return slot;
}
/**
 * Schedule `run` on the next animation frame for `host`. Repeat calls in the
 * same frame collapse into one. `run` is invoked as a method on `host`.
 * @param {object} host - Stable identity (the component).
 * @param {Function} run - Work to run once per frame.
 */
export function rafCoalesce(host, run) {
	let slot = slots.get(host);
	if (!slot) {
		slot = createSlot(host);
		slots.set(host, slot);
	}
	slot.run = run;
	if (slot.id) {
		return;
	}
	slot.id = globalThis.requestAnimationFrame(slot.tick);
}
/**
 * Drop a pending frame for `host`. Call from onDisconnect.
 * @param {object} host - Same identity passed to rafCoalesce.
 */
export function rafCoalesceCancel(host) {
	const slot = slots.get(host);
	if (!slot?.id) {
		return;
	}
	globalThis.cancelAnimationFrame(slot.id);
	slot.id = 0;
}
