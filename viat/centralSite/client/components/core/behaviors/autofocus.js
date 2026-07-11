// Focus the element after mount. Optional value is a numeric delay (ms).
function focusElement(element) {
	if (typeof element.focus === 'function') {
		element.focus();
		return;
	}
	const root = element.shadowRoot ?? element;
	const focusable = root.querySelector('input, textarea, select, button, [tabindex]');
	focusable?.focus?.();
}
// element → pending timer id, cleared on uninstall. No per-install closures:
// setTimeout's extra-args form forwards the element to `focusElement` directly.
const timerByElement = new WeakMap();
class AutofocusBehavior {
	name = 'autofocus';
	install(element, value) {
		timerByElement.set(element, setTimeout(focusElement, Number(value) || 0, element));
	}
	uninstall(element) {
		clearTimeout(timerByElement.get(element));
		timerByElement.delete(element);
	}
}
export const autofocus = new AutofocusBehavior();
