import { isFunction } from '../utilities.js';
/*
 * On focus, select all text in the input/textarea. One shared
 * `EventListener`-object singleton for every installed element — the browser
 * calls `handleEvent` with the event, and `currentTarget` identifies the
 * element, so no per-install state exists anywhere.
 */
const selectOnFocus = {
	handleEvent(focusEvent) {
		const element = focusEvent.currentTarget;
		if (isFunction(element.select)) {
			element.select();
		}
	},
};
class AutoselectBehavior {
	name = 'autoselect';
	install(element) {
		element.addEventListener('focus', selectOnFocus);
	}
	uninstall(element) {
		element.removeEventListener('focus', selectOnFocus);
	}
}
export const autoselect = new AutoselectBehavior();
