// Auto-resize a <textarea> to fit its content as the user types.
function resize(element) {
	element.style.height = 'auto';
	element.style.height = `${element.scrollHeight}px`;
}
/*
 * Per-element listener as a `handleEvent` object (house rule) — one prototype
 * method shared across every installed element, no per-install closure for the
 * handler itself; add/remove use the same instance.
 */
class ResizeOnInput {
	constructor(element) {
		this.element = element;
	}
	handleEvent() {
		resize(this.element);
	}
}
export const autoResize = {
	name: 'auto-resize',
	install(element) {
		const listener = new ResizeOnInput(element);
		element.addEventListener('input', listener);
		// Initial sizing once the element is in the DOM
		requestAnimationFrame(() => {
			return resize(element);
		});
		return function uninstall() {
			element.removeEventListener('input', listener);
		};
	},
};
