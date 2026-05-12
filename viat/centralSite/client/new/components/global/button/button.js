import { UIIcon } from '../icon/icon.js';
import { WebComponent } from '../../core/index.js';
export class UIButton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		button: './button.css',
	};
	static state = {
		tone: 'neutral',
		variant: 'solid',
		size: 'md',
		label: '',
		leadicon: '',
		trailicon: '',
		disabled: false,
		loading: false,
		fullwidth: false,
		title: '',
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? Boolean((state ?? {}).title),
		});
	}
	get hostClass() {
		const parts = [
			'btn',
			`tone-${this.state.tone || 'neutral'}`,
			`var-${this.state.variant || 'solid'}`,
			`size-${this.state.size || 'md'}`,
		];
		if (this.state.disabled) {
			parts.push('is-disabled');
		}
		if (this.state.loading) {
			parts.push('is-loading');
		}
		if (this.state.fullwidth) {
			parts.push('is-full');
		}
		if (!this.state.label) {
			parts.push('is-icon-only');
		}
		return parts.join(' ');
	}
	renderLead() {
		if (this.state.loading) {
			return '<span class="btn-spinner" aria-hidden="true"></span>';
		}
		if (this.state.leadicon) {
			return `<ui-icon class="btn-icon lead" name="${this.state.leadicon}" size="sm"></ui-icon>`;
		}
		return '';
	}
	renderTrail() {
		if (this.state.trailicon) {
			return `<ui-icon class="btn-icon trail" name="${this.state.trailicon}" size="sm"></ui-icon>`;
		}
		return '';
	}
	renderLabel() {
		return this.state.label ? `<span class="btn-label">${this.state.label}</span>` : '';
	}
	handleClick(domEvent) {
		if (this.state.disabled || this.state.loading) {
			domEvent.preventDefault();
			domEvent.stopImmediatePropagation();
			return;
		}
		this.emit('buttonClick', {
			source: this,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<button class="${this.hostClass}"
				?disabled="${this.state.disabled || this.state.loading}"
				aria-label="${this.state.title || this.state.label}"
				tooltip="${this.state.title}"
				@click=${this.handleClick}>
				${this.renderLead}
				<slot name="lead"></slot>
				${this.renderLabel}
				<slot></slot>
				${this.renderTrail}
				<slot name="trail"></slot>
			</button>
		`;
	}
}
customElements.define('ui-button', UIButton);
// Keep UIIcon available so consumers reaching for an icon glyph next to UIButton don't have to add a separate import.
export { UIIcon };
