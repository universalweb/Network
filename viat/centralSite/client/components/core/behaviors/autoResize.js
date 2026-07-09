// Auto-resize a <textarea> to fit its content as the user types.
function resize(element) {
	element.style.height = 'auto';
	element.style.height = `${element.scrollHeight}px`;
}
/*
 * One shared `EventListener`-object singleton — `currentTarget` identifies the
 * element, so no per-element listener instance is ever allocated.
 */
const resizeOnInput = {
	handleEvent(inputEvent) {
		resize(inputEvent.currentTarget);
	},
};
/*
 * Initial sizing must wait a frame (the element needs layout). Installs within
 * the same frame share ONE rAF via this queue instead of allocating a callback
 * arrow per install; elements uninstalled before the frame are skipped by the
 * `isConnected` check.
 */
const pendingInitialResize = [];
function flushInitialResize() {
	const pendingLength = pendingInitialResize.length;
	for (let index = 0; index < pendingLength; index++) {
		const element = pendingInitialResize[index];
		if (element.isConnected) {
			resize(element);
		}
	}
	pendingInitialResize.length = 0;
}
class AutoResizeBehavior {
	name = 'auto-resize';
	install(element) {
		element.addEventListener('input', resizeOnInput);
		if (pendingInitialResize.push(element) === 1) {
			requestAnimationFrame(flushInitialResize);
		}
	}
	uninstall(element) {
		element.removeEventListener('input', resizeOnInput);
	}
}
export const autoResize = new AutoResizeBehavior();
