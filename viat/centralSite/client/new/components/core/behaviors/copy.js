import { delegate } from '../dom/delegate.js';
function emit(target, type, detail) {
	target.dispatchEvent(new CustomEvent(type, {
		bubbles: true,
		composed: true,
		detail,
	}));
}
async function handleCopy(domEvent, target, value) {
	if (!value) {
		return;
	}
	domEvent.preventDefault();
	const text = String(value);
	try {
		await navigator.clipboard.writeText(text);
		emit(target, 'copy:done', {
			value: text,
		});
	} catch (error) {
		emit(target, 'copy:error', {
			value: text,
			error,
		});
	}
}
export const copy = {
	name: 'copy',
	init() {
		delegate('click.copy', handleCopy);
	},
};
