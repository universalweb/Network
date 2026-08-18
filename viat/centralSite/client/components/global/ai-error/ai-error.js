/*
 * `<ui-ai-error>` — chat error banner for stream failures, rate limits, quota,
 * and offline. Pure UI: paints from `.message` + `.kind`, optional Retry.
 * Emits `ai-error:retry` {} and `ai-error:dismiss` {}. Drive with `.message`,
 * `.kind` (error | rate-limit | quota | offline), `.retryable`, `.dismissible`.
 * Empty `.message` hides the banner.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
const KIND_VIEW = {
	error: {
		icon: 'circle-alert',
		heading: 'Error',
	},
	'rate-limit': {
		icon: 'timer',
		heading: 'Rate limited',
	},
	quota: {
		icon: 'gauge',
		heading: 'Quota exceeded',
	},
	offline: {
		icon: 'wifi-off',
		heading: 'Offline',
	},
};
export class UIAiError extends WebComponent {
	static url = import.meta.url;
	static styles = {
		error: './ai-error.css',
	};
	static state = {
		message: '',
		// error | rate-limit | quota | offline
		kind: 'error',
		retryable: true,
		dismissible: true,
	};
	get kindView() {
		return KIND_VIEW[this.state.kind] || KIND_VIEW.error;
	}
	/* Never name this isVisible — base WebComponent owns isVisible as a lifecycle boolean. */
	get showError() {
		return Boolean(this.state.message);
	}
	handleRetry() {
		this.emit('ai-error:retry', {
			kind: this.state.kind,
			message: this.state.message,
		});
	}
	handleDismiss() {
		this.state.message = '';
		this.emit('ai-error:dismiss', {
			kind: this.state.kind,
		});
	}
	render() {
		const view = this.kindView;
		this.html`
			<section class="aier" data-kind=${this.state.kind} ?hidden=${!this.showError} role="alert">
				<header class="aier-head">
					<ui-icon class="aier-icon" .state.name=${view.icon} .state.size=${'sm'}></ui-icon>
					<span class="aier-title">${view.heading}</span>
					<button type="button"
						class="aier-dismiss"
						?hidden=${!this.state.dismissible}
						tooltip="Dismiss"
						@click=${this.handleDismiss}>
						<ui-icon .state.name=${'x'} .state.size=${'xs'}></ui-icon>
					</button>
				</header>
				<p class="aier-message">${this.state.message}</p>
				<footer class="aier-actions" ?hidden=${!this.state.retryable}>
					<button type="button" data-variant="outline" data-tone="danger" data-size="sm" @click=${this.handleRetry}>Retry</button>
				</footer>
			</section>
		`;
	}
}
customElements.define('ui-ai-error', UIAiError);
