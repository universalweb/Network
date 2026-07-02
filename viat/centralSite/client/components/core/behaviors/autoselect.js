import { isFunction } from '../utilities.js';
// On focus, select all text in the input/textarea.
function handleFocus(focusEvent) {
	const element = focusEvent.currentTarget;
	if (isFunction(element.select)) {
		element.select();
	}
}
export const autoselect = {
	name: 'autoselect',
	install(element) {
		element.addEventListener('focus', handleFocus);
		return function uninstall() {
			element.removeEventListener('focus', handleFocus);
		};
	},
};
