// Per-element tooltip wiring. Each tagged element gets two listener objects
// (`enterListener` / `leaveListener`) so the browser only fires when the
// pointer actually enters or exits that element — no document-level
// `pointermove` sweep, no subevent lookup, no JS `composedPath` traversal.
// The tooltip text lives in `el.dataset.tooltip` (written by the behavior
// on install and by `applySubeventAttr` on dynamic updates).
//
// Tooltips are a hover affordance — they make no sense on touch-only
// devices where the user can't preview without committing to a tap.
// `(hover: hover)` is the precise CSS media query for "has a hover-capable
// pointer": true on desktops, false on touch-only mobile. Devices that
// switch profiles at runtime (dock/undock) are re-checked on every fire.
const hoverCapableMQ = typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia('(hover: hover)') : null;
function isHoverCapable() {
	return hoverCapableMQ ? hoverCapableMQ.matches : true;
}
let tooltipReady = null;
// WeakRef so an element removed from DOM mid-hover doesn't pin. The deref
// check below also catches the gc'd case.
let activeTargetRef = null;
function currentActiveTarget() {
	return activeTargetRef?.deref() ?? null;
}
function ensureTooltip() {
	if (tooltipReady) {
		return tooltipReady;
	}
	tooltipReady = (async () => {
		await customElements.whenDefined('ui-tooltip');
		const tooltipEl = document.createElement('ui-tooltip');
		document.body.append(tooltipEl);
		await tooltipEl.lifecycle.whenMounted;
		return tooltipEl;
	})();
	return tooltipReady;
}
async function showFor(target, text) {
	if (!text) {
		return;
	}
	const tip = await ensureTooltip();
	if (!target.isConnected || currentActiveTarget() !== target) {
		return;
	}
	tip.show({
		text,
		targetRect: target.getBoundingClientRect(),
	});
}
function hide() {
	activeTargetRef = null;
	if (!tooltipReady) {
		return;
	}
	tooltipReady.then((tip) => {
		tip.hide();
	}).catch(() => {});
}
// EventListener-object pattern — each listener IS the listener (DOM spec:
// any object with a `handleEvent` method qualifies). Two shared singletons,
// not closures. The browser calls `enterListener.handleEvent(domEvent)`
// with `this = enterListener`, so the implementation just reads
// `domEvent.currentTarget` (the element the listener is attached to).
const enterListener = {
	handleEvent(pointerEvent) {
		if (!isHoverCapable()) {
			return;
		}
		const target = pointerEvent.currentTarget;
		const text = target.dataset.tooltip;
		if (!text) {
			return;
		}
		activeTargetRef = new WeakRef(target);
		showFor(target, text);
	},
};
const leaveListener = {
	handleEvent(pointerEvent) {
		if (currentActiveTarget() === pointerEvent.currentTarget) {
			hide();
		}
	},
};
// Public wiring — the `tooltip` behavior calls these on install / uninstall.
// Two listener registrations per tagged element (enter + leave), shared
// listener objects so the registry stays at O(elements) regardless of usage.
export function attachTooltip(element) {
	element.addEventListener('pointerenter', enterListener);
	element.addEventListener('pointerleave', leaveListener);
}
export function detachTooltip(element) {
	element.removeEventListener('pointerenter', enterListener);
	element.removeEventListener('pointerleave', leaveListener);
	if (currentActiveTarget() === element) {
		hide();
	}
}
// Hide on global scroll — keeps the popover anchored. The capture phase
// catches scrolls on any element (window, scrollable containers, shadow
// roots). Passive because we never preventDefault on scroll.
globalThis.addEventListener('scroll', hide, {
	capture: true,
	passive: true,
});
// Pre-warm the tooltip element on hover-capable devices so the first hover
// shows instantly. Touch-only devices never spin it up.
if (isHoverCapable()) {
	ensureTooltip().catch(() => {});
}
