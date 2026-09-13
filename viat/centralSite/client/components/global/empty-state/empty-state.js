import { WebComponent } from '../../core/index.js';
export class UIEmptyState extends WebComponent {
	static url = import.meta.url;
	static styles = {
		emptyState: './empty-state.css',
	};
	static state = {
		actionLabel: '',
		hint: '',
		icon: '',
		heading: 'Nothing here yet',
	};
	handleAction() {
		this.emit('empty-state:action', {
			label: this.state.actionLabel,
		});
	}
	/*
	 * Optional parts are METHOD spots, not inline ternaries in the template.
	 * An inline `${cond ? this.htmlElement`…` : ''}` is evaluated once while the
	 * template is being built, which is before the spot exists to own it — so a
	 * branch that is already true on the FIRST render mounts its element with
	 * its @click never wired. The button appeared, looked right, and did
	 * nothing; only a branch that flipped on LATER got a working listener.
	 * `${this.renderAction}` hands the framework a function it can call per
	 * render instead, which is the same contract ui-panel documents for
	 * renderBody.
	 */
	renderIcon() {
		if (!this.state.icon) {
			return '';
		}
		return this.htmlElement`<div class="empty-icon" aria-hidden="true">${this.state.icon}</div>`;
	}
	renderHint() {
		if (!this.state.hint) {
			return '';
		}
		return this.htmlElement`<div class="empty-hint">${this.state.hint}</div>`;
	}
	renderAction() {
		if (!this.state.actionLabel) {
			return '';
		}
		return this.htmlElement`<button class="empty-action" type="button" @click=${this.handleAction}>${this.state.actionLabel}</button>`;
	}
	render() {
		this.html`
			<div class="empty">
				${this.renderIcon}
				<div class="empty-title">${this.state.heading}</div>
				${this.renderHint}
				${this.renderAction}
			</div>
		`;
	}
}
customElements.define('ui-empty-state', UIEmptyState);
