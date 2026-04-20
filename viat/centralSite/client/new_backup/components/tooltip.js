import {
	hostSheet,
	loadSheet,
	resetSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const tooltipStyles = await loadSheet(new URL('../styles/tooltip.css', import.meta.url));
const host = hostSheet(`
:host {
	display: block;
}
`);
const EDGE_MARGIN = 12;
const GAP = 10;
const HIDE_DELAY = 180;
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
export class ViatTooltip extends WebComponent {
	content = null;
	hideTimeoutId = null;
	sequence = 0;
	shell = null;
	showFrame = 0;
	constructor() {
		super([
			resetSheet,
			host,
			tooltipStyles,
		]);
		this.state = {
			mounted: false,
			placement: 'top',
			text: '',
			visible: false,
			x: 0,
			y: 0,
		};
	}
	get mounted() {
		return this.state.mounted;
	}
	set mounted(value) {
		this.updateState({
			mounted: value === true,
		});
	}
	get placement() {
		return this.state.placement;
	}
	set placement(value) {
		this.updateState({
			placement: value ?? 'top',
		});
	}
	get text() {
		return this.state.text;
	}
	set text(value) {
		this.updateState({
			text: value ?? '',
		});
	}
	get visible() {
		return this.state.visible;
	}
	set visible(value) {
		this.updateState({
			visible: value === true,
		});
	}
	get x() {
		return this.state.x;
	}
	set x(value) {
		this.updateState({
			x: value ?? 0,
		});
	}
	get y() {
		return this.state.y;
	}
	set y(value) {
		this.updateState({
			y: value ?? 0,
		});
	}
	show({
		text,
		targetRect,
	} = {}) {
		if (!text || !targetRect) {
			return;
		}
		this.sequence += 1;
		const token = this.sequence;
		if (this.hideTimeoutId) {
			clearTimeout(this.hideTimeoutId);
			this.hideTimeoutId = null;
		}
		if (this.showFrame) {
			cancelAnimationFrame(this.showFrame);
			this.showFrame = 0;
		}
		this.updateState({
			mounted: true,
			text,
			visible: false,
		});
		this.showFrame = requestAnimationFrame(() => {
			if (this.sequence !== token || !this.mounted) {
				return;
			}
			const shell = this.shadowRoot.querySelector('.tooltip-shell');
			if (!shell) {
				return;
			}
			const tooltipRect = shell.getBoundingClientRect();
			const spaces = {
				bottom: window.innerHeight - targetRect.bottom,
				left: targetRect.left,
				right: window.innerWidth - targetRect.right,
				top: targetRect.top,
			};
			const canTop = spaces.top >= tooltipRect.height + GAP + EDGE_MARGIN;
			const canBottom = spaces.bottom >= tooltipRect.height + GAP + EDGE_MARGIN;
			const canRight = spaces.right >= tooltipRect.width + GAP + EDGE_MARGIN;
			const canLeft = spaces.left >= tooltipRect.width + GAP + EDGE_MARGIN;
			if (canTop) {
				this.placement = 'top';
			} else if (canBottom) {
				this.placement = 'bottom';
			} else if (canRight) {
				this.placement = 'right';
			} else if (canLeft) {
				this.placement = 'left';
			} else {
				this.placement = spaces.bottom >= spaces.top ? 'bottom' : 'top';
			}
			let x = targetRect.left + ((targetRect.width - tooltipRect.width) / 2);
			let y = targetRect.top - tooltipRect.height - GAP;
			if (this.placement === 'bottom') {
				y = targetRect.bottom + GAP;
			}
			if (this.placement === 'left') {
				x = targetRect.left - tooltipRect.width - GAP;
				y = targetRect.top + ((targetRect.height - tooltipRect.height) / 2);
			}
			if (this.placement === 'right') {
				x = targetRect.right + GAP;
				y = targetRect.top + ((targetRect.height - tooltipRect.height) / 2);
			}
			this.updateState({
				x: clamp(x, EDGE_MARGIN, window.innerWidth - tooltipRect.width - EDGE_MARGIN),
				y: clamp(y, EDGE_MARGIN, window.innerHeight - tooltipRect.height - EDGE_MARGIN),
			});
			requestAnimationFrame(() => {
				if (this.sequence !== token || !this.mounted) {
					return;
				}
				this.visible = true;
			});
		});
	}
	hide() {
		if (!this.mounted) {
			return;
		}
		this.sequence += 1;
		this.visible = false;
		if (this.hideTimeoutId) {
			clearTimeout(this.hideTimeoutId);
		}
		const token = this.sequence;
		this.hideTimeoutId = setTimeout(() => {
			if (this.sequence !== token) {
				return;
			}
			if (this.visible) {
				return;
			}
			this.mounted = false;
			this.hideTimeoutId = null;
		}, HIDE_DELAY);
	}
	render() {
		if (!this.mounted) {
			this.shell = null;
			this.content = null;
			this.shadowRoot.innerHTML = '';
			return;
		}
		if (this.shell) {
			this.shell.className = `tooltip-shell${this.visible ? ' is-visible' : ''}`;
			this.shell.dataset.placement = this.placement;
			this.shell.style.left = `${this.x}px`;
			this.shell.style.top = `${this.y}px`;
		} else {
			this.shadowRoot.innerHTML = `
				<div class="tooltip-shell${this.visible ? ' is-visible' : ''}" data-placement="${this.placement}" style="left:${this.x}px;top:${this.y}px;">
					<span class="tooltip-text"></span>
				</div>
			`;
			this.shell = this.shadowRoot.querySelector('.tooltip-shell');
			this.content = this.shadowRoot.querySelector('.tooltip-text');
		}
		if (this.content) {
			this.content.textContent = this.text;
		}
	}
}
customElements.define('viat-tooltip', ViatTooltip);
