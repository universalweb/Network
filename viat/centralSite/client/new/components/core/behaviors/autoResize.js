// Auto-resize a <textarea> to fit its content as the user types.
function resize(element) {
	element.style.height = 'auto';
	element.style.height = `${element.scrollHeight}px`;
}
export const autoResize = {
	name: 'auto-resize',
	install(element) {
		const handler = () => {
			return resize(element);
		};
		element.addEventListener('input', handler);
		// Initial sizing once the element is in the DOM
		requestAnimationFrame(() => {
			return resize(element);
		});
		return function uninstall() {
			element.removeEventListener('input', handler);
		};
	},
};
