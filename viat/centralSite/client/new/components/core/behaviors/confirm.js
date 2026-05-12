import { delegate } from '../dom/delegate.js';
function handleConfirm(domEvent, target, message) {
	if (!message) {
		return;
	}
	if (target.dataset.confirmAccepted === '1') {
		delete target.dataset.confirmAccepted;
		return;
	}
	domEvent.preventDefault();
	domEvent.stopImmediatePropagation();
	const accepted = window.confirm(String(message));
	if (!accepted) {
		return;
	}
	target.dataset.confirmAccepted = '1';
	target.click();
}
export const confirm = {
	name: 'confirm',
	init() {
		delegate('click.confirm', handleConfirm);
	},
};
