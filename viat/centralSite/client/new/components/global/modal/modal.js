import { WebComponent } from '../../core/index.js';
export class UIModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		modal: './modal.css',
	};
	static state = {
		modal: true,
		open: false,
		closeOnBackdrop: true,
	};
	handleDialogClick(domEvent) {
		if (!this.state.closeOnBackdrop) {
			return;
		}
		if (domEvent.target === this.refs.dialog) {
			this.close();
		}
	}
	open() {
		const dialog = this.refs.dialog;
		if (!dialog || dialog.open) {
			return;
		}
		if (this.state.modal) {
			dialog.showModal();
		} else {
			dialog.show();
		}
		this.state.open = true;
		this.emit('modal-open');
	}
	close(returnValue) {
		const dialog = this.refs.dialog;
		if (!dialog?.open) {
			return;
		}
		dialog.close(returnValue);
	}
	handleCancel(domEvent) {
		const cancelEvent = new CustomEvent('modal-cancel', {
			bubbles: true,
			cancelable: true,
			composed: true,
			detail: {
				source: this,
			},
		});
		if (this.dispatchEvent(cancelEvent) === false) {
			domEvent.preventDefault();
		}
	}
	handleClose(domEvent) {
		this.state.open = false;
		this.emit('modal-close', {
			returnValue: domEvent.target?.returnValue ?? '',
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<dialog #dialog class="modal" @click=${this.handleDialogClick} @cancel=${this.handleCancel} @close=${this.handleClose}>
				<slot></slot>
			</dialog>
		`;
	}
}
customElements.define('ui-modal', UIModal);
