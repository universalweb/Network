// On focus, select all text in the input/textarea.
function handleFocus(event) {
	const el = event.currentTarget;
	if (typeof el.select === 'function') {
		el.select();
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
