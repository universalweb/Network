/*
	DESCRIPTION: ui-alert-dialog — confirm pattern composed on ui-modal.
	Not a second dialog engine. Heading + description + cancel/action.
	── EVENTS ───────────────────────────────────────────────────────────
	  alert-dialog:action {} · alert-dialog:cancel {}
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-alert-dialog
	    .state.heading=${'Delete wallet?'}
	    .state.description=${'This cannot be undone.'}
	    .state.actionLabel=${'Delete'}
	    .state.tone=${'danger'}
	    @alert-dialog:action=${this.onDelete}></ui-alert-dialog>
	─────────────────────────────────────────────────────────────────────
*/
import '../button/button.js';
import '../modal/modal.js';
import { WebComponent } from 'webcomponent';
export class UIAlertDialog extends WebComponent {
	static url = import.meta.url;
	static styles = {
		alertDialog: './alert-dialog.css',
	};
	static state = {
		open: false,
		heading: '',
		description: '',
		actionLabel: 'Continue',
		cancelLabel: 'Cancel',
		tone: 'danger',
		closeOnBackdrop: false,
	};
	onConnect() {
		this.observe('open', this.syncOpen);
	}
	onRendered() {
		this.syncOpen();
	}
	syncOpen() {
		/* #ref — not getComponent (API is findComponent). */
		const modal = this.refs.modal;
		if (!modal) {
			return;
		}
		if (this.state.open) {
			if (!modal.state.open) {
				modal.open();
			}
			return;
		}
		if (modal.state.open) {
			modal.close();
		}
	}
	handleModalClose() {
		if (this.state.open) {
			this.state.open = false;
			this.emit('alert-dialog:cancel', {});
		}
	}
	handleCancel() {
		this.state.open = false;
		this.emit('alert-dialog:cancel', {});
	}
	handleAction() {
		this.state.open = false;
		this.emit('alert-dialog:action', {});
	}
	open() {
		this.state.open = true;
		this.syncOpen();
	}
	close() {
		this.state.open = false;
		this.syncOpen();
	}
	render() {
		this.html`
			<ui-modal
				#modal
				.state.heading=${this.state.heading}
				.state.closeOnBackdrop=${this.state.closeOnBackdrop}
				.state.showClose=${true}
				@modal:close=${this.handleModalClose}>
				<div class="ad">
					<p class="ad-desc" ?hidden=${!this.state.description}>${this.state.description}</p>
					<div class="ad-actions">
						<ui-button
							.state.label=${this.state.cancelLabel}
							.state.variant=${'outline'}
							.state.size=${'sm'}
							@button:click=${this.handleCancel}></ui-button>
						<ui-button
							.state.label=${this.state.actionLabel}
							.state.tone=${this.state.tone}
							.state.size=${'sm'}
							@button:click=${this.handleAction}></ui-button>
					</div>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('ui-alert-dialog', UIAlertDialog);
