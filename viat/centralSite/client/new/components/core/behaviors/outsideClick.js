// Emits a custom event (defaults to "outside-click") when a pointerdown
// lands outside the element. Powers popovers, menus, dismissible drawers.
const tracked = new Set();
function handlePointerDown(event) {
	if (tracked.size === 0) {
		return;
	}
	const path = event.composedPath();
	tracked.forEach((entry) => {
		if (!entry.element.isConnected) {
			tracked.delete(entry);
			return;
		}
		if (path.includes(entry.element)) {
			return;
		}
		entry.element.dispatchEvent(new CustomEvent(entry.eventName, {
			bubbles: true,
			composed: true,
			detail: {
				originalEvent: event,
			},
		}));
	});
}
export const outsideClick = {
	name: 'outside-click',
	init() {
		document.addEventListener('pointerdown', handlePointerDown, true);
	},
	install(element, value) {
		const entry = {
			element,
			eventName: value || 'outside-click',
		};
		tracked.add(entry);
		return function uninstall() {
			tracked.delete(entry);
		};
	},
};
