import { classList, isTrue } from '../../core/index.js';
import { UIButton } from '../button/button.js';
/*
 * One tab in a <ui-tabs> strip. Extends UIButton so variant/tone/size,
 * uppercase, and MD3 press come from the button system. The parent passes
 * the raw tab item as-is (`list('items', UITabButton)`) and writes the
 * shared `active` flag onto the bound item at event-time.
 * `display`: '' (infer) | 'icon' | 'label' | 'icon-label'.
 * `empty`: unfilled/null — not selectable.
 */
export class UITabButton extends UIButton {
	static url = import.meta.url;
	static styles = {
		tabButton: './tab-button.css',
	};
	static state = {
		id: '',
		icon: '',
		active: false,
		display: '',
		empty: false,
		tabStop: false,
		color: '',
		weight: 0,
		variant: 'ghost',
		size: 'sm',
		tone: 'neutral',
		tickStart: '',
		tickEnd: '',
		labelPlace: 'in',
	};
	onConnect() {
		this.observe('active', this.syncActiveHost);
		this.observe('color', this.syncHostVars);
		this.observe('weight', this.syncHostVars);
		this.observe('labelPlace', this.syncHostVars);
		this.syncActiveHost();
		this.syncHostVars();
	}
	syncHostVars() {
		if (this.state.color) {
			this.style.setProperty('--tab-label-color', this.state.color);
		} else {
			this.style.removeProperty('--tab-label-color');
		}
		const weight = Number(this.state.weight);
		if (Number.isFinite(weight) && weight > 0) {
			this.style.setProperty('--trk-flex', String(weight));
		} else {
			this.style.removeProperty('--trk-flex');
		}
		this.dataset.labelPlace = this.state.labelPlace === 'over' ? 'over' : 'in';
	}
	showIcon() {
		if (this.state.display === 'label') {
			return false;
		}
		return Boolean(this.state.icon);
	}
	showLabel() {
		if (this.state.display === 'icon') {
			return false;
		}
		return Boolean(this.state.label);
	}
	displayMode() {
		const display = this.state.display;
		if (display === 'icon' || display === 'label' || display === 'icon-label') {
			return display;
		}
		if (this.state.icon && this.state.label) {
			return 'icon-label';
		}
		if (this.state.icon) {
			return 'icon';
		}
		return 'label';
	}
	controlClass() {
		return classList('tab-btn', super.controlClass());
	}
	renderLead() {
		if (this.state.loading) {
			return super.renderLead();
		}
		if (!this.showIcon()) {
			return '';
		}
		return this.htmlElement`<ui-icon class="tab-btn-icon btn-icon" .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>`;
	}
	labelIsOver() {
		return this.state.labelPlace === 'over';
	}
	hideOverLabel() {
		return !this.labelIsOver() || !this.showLabel();
	}
	renderLabel() {
		if (!this.showLabel() || this.labelIsOver()) {
			return '';
		}
		return this.htmlElement`<span class="tab-btn-label btn-label">${this.state.label}</span>`;
	}
	hideTicks() {
		return !this.state.tickStart && !this.state.tickEnd;
	}
	hideTickEnd() {
		return !this.state.tickEnd;
	}
	handleClick(domEvent) {
		if (isTrue(this.state.empty) || this.state.disabled || this.state.loading) {
			domEvent.preventDefault();
			return;
		}
		this.emit('tab-button:select', {
			id: this.state.id,
		});
	}
	handlePointerEnter() {
		if (isTrue(this.state.empty)) {
			return;
		}
		this.emit('tab-button:hover', {
			id: this.state.id,
		});
	}
	syncActiveHost() {
		this.toggleAttribute('data-active', isTrue(this.state.active));
	}
	tabIndexValue() {
		if (isTrue(this.state.active) || isTrue(this.state.tabStop)) {
			return '0';
		}
		return '-1';
	}
	focus() {
		this.refs.button?.focus();
	}
	render() {
		this.html`
			<span class="tab-caption tab-btn-label btn-label" ?hidden=${this.hideOverLabel}>${this.state.label}</span>
			<button #button
				data-variant=${this.state.variant || 'ghost'}
				data-tone=${this.state.tone || 'neutral'}
				data-size=${this.state.size || 'sm'}
				class=${this.controlClass}
				type="button"
				role="tab"
				data-hover=${'ink'}
				data-display=${this.displayMode}
				?data-empty=${this.state.empty}
				aria-selected=${this.state.active ? 'true' : 'false'}
				aria-disabled=${this.state.empty ? 'true' : 'false'}
				tabindex=${this.tabIndexValue}
				data-tab-id=${this.state.id}
				aria-label=${this.state.tooltip || this.state.label}
				tooltip=${this.state.label}
				?disabled=${this.state.disabled || this.state.loading}
				@click=${this.handleClick}
				@pointerenter=${this.handlePointerEnter}>
				${this.renderLead}
				<slot name="lead"></slot>
				${this.renderLabel}
				<slot></slot>
				${this.renderTrail}
				<slot name="trail"></slot>
			</button>
			<span class="tab-block-ticks" ?hidden=${this.hideTicks} aria-hidden="true">
				<span class="tab-tick" data-edge="start">${this.state.tickStart}</span>
				<span class="tab-tick" data-edge="end" ?hidden=${this.hideTickEnd}>${this.state.tickEnd}</span>
			</span>
		`;
	}
}
customElements.define('ui-tab-button', UITabButton);
