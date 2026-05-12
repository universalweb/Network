import './tooltip-service.js';
import { WebComponent } from '../base.js';
const EDGE_MARGIN = 12;
const GAP = 10;
const SLIDE_MS = 240;
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
export class UITooltip extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tooltip: './tooltip.css',
	};
	static state = {
		placement: 'top',
		sliding: false,
		text: '',
		x: 0,
		y: 0,
	};
	shell = null;
	shellW = 0;
	shellH = 0;
	isOpen = false;
	slideToken = 0;
	onMounted() {
		this.shell = this.shadowRoot.querySelector('.tooltip-shell');
		if (!this.shell) {
			return;
		}
		this.shell.addEventListener('beforetoggle', (toggleEvent) => {
			this.isOpen = toggleEvent.newState === 'open';
		});
		this.shell.addEventListener('toggle', (toggleEvent) => {
			this.emit(toggleEvent.newState === 'open' ? 'tooltip:show' : 'tooltip:hide', {
				text: this.state.text,
			});
		});
	}
	onDisconnect() {
		this.shell = null;
		this.isOpen = false;
	}
	calcPosition(targetRect, placement) {
		const w = this.shellW;
		const h = this.shellH;
		let x;
		let y;
		if (placement === 'top') {
			x = targetRect.left + ((targetRect.width - w) / 2);
			y = targetRect.top - h - GAP;
		} else if (placement === 'bottom') {
			x = targetRect.left + ((targetRect.width - w) / 2);
			y = targetRect.bottom + GAP;
		} else if (placement === 'left') {
			x = targetRect.left - w - GAP;
			y = targetRect.top + ((targetRect.height - h) / 2);
		} else {
			x = targetRect.right + GAP;
			y = targetRect.top + ((targetRect.height - h) / 2);
		}
		return {
			x: clamp(x, EDGE_MARGIN, window.innerWidth - w - EDGE_MARGIN),
			y: clamp(y, EDGE_MARGIN, window.innerHeight - h - EDGE_MARGIN),
		};
	}
	pickPlacement(targetRect) {
		const w = this.shellW;
		const h = this.shellH;
		const spaceTop = targetRect.top;
		const spaceBottom = window.innerHeight - targetRect.bottom;
		const spaceLeft = targetRect.left;
		const spaceRight = window.innerWidth - targetRect.right;
		if (spaceTop >= h + GAP + EDGE_MARGIN) {
			return 'top';
		}
		if (spaceBottom >= h + GAP + EDGE_MARGIN) {
			return 'bottom';
		}
		if (spaceRight >= w + GAP + EDGE_MARGIN) {
			return 'right';
		}
		if (spaceLeft >= w + GAP + EDGE_MARGIN) {
			return 'left';
		}
		return spaceBottom >= spaceTop ? 'bottom' : 'top';
	}
	measure() {
		const rect = this.shell.getBoundingClientRect();
		this.shellW = rect.width;
		this.shellH = rect.height;
	}
	show({
		text,
		targetRect,
	} = {}) {
		if (!text || !targetRect || !this.shell) {
			return;
		}
		const wasOpen = this.isOpen;
		const textChanged = wasOpen && this.state.text !== text;
		this.state.sliding = textChanged;
		this.state.text = text;
		if (!wasOpen) {
			this.shell.showPopover();
		}
		this.measure();
		const placement = this.pickPlacement(targetRect);
		const {
			x, y,
		} = this.calcPosition(targetRect, placement);
		this.state.placement = placement;
		this.state.x = x;
		this.state.y = y;
		if (textChanged) {
			const token = ++this.slideToken;
			this.setTimeout(() => {
				if (this.slideToken === token) {
					this.state.sliding = false;
				}
			}, SLIDE_MS);
		}
	}
	hide() {
		if (!this.isOpen || !this.shell) {
			return;
		}
		this.slideToken++;
		this.state.sliding = false;
		this.shell.hidePopover();
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return `tooltip-shell${this.state.sliding ? ' is-sliding' : ''}`;
			}}" popover="manual" data-placement="${() => {
				return this.state.placement;
			}}" style="${() => {
				return `left:${this.state.x}px;top:${this.state.y}px;`;
			}}">
				<span class="tooltip-text">${() => {
					return this.state.text;
				}}</span>
			</div>
		`;
	}
}
customElements.define('ui-tooltip', UITooltip);
