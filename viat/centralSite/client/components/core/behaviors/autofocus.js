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
export const autofocus = {
	name: 'autofocus',
	install(element, value) {
		const delay = Number(value) || 0;
		const timer = setTimeout(() => {
			focusElement(element);
		}, delay);
		return function uninstall() {
			clearTimeout(timer);
		};
	},
};
