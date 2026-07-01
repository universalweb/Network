// On focus, select all text in the input/textarea.
function handleFocus(focusEvent) {
	const element = focusEvent.currentTarget;
	if (typeof element.select === 'function') {
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
