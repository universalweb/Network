import { WebComponent } from './base.js';
const EDGE_MARGIN = 12;
const GAP = 10;
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
	mousePos = [0, 0];
	sequence = 0;
	get shell() {
		return this.shadowRoot.querySelector('.tooltip-shell');
	}
	calcPosition(mouseX, mouseY, tooltipRect, placement) {
		let x = mouseX - (tooltipRect.width / 2);
		let y = (mouseY - tooltipRect.height - GAP);
		if (placement === 'bottom') {
			y = mouseY + GAP;
		} else if (placement === 'left') {
			x = mouseX - tooltipRect.width - GAP;
			y = mouseY - (tooltipRect.height / 2);
		} else if (placement === 'right') {
			x = mouseX + GAP;
			y = mouseY - (tooltipRect.height / 2);
		}
		return {
			x: clamp(x, EDGE_MARGIN, window.innerWidth - tooltipRect.width - EDGE_MARGIN),
			y: clamp(y, EDGE_MARGIN, window.innerHeight - tooltipRect.height - EDGE_MARGIN),
		};
	}
	track(mouseX, mouseY) {
		this.mousePos[0] = mouseX;
		this.mousePos[1] = mouseY;
		const shell = this.shell;
		if (!shell?.matches(':popover-open')) {
			return;
		}
		const {
			x, y,
		} = this.calcPosition(mouseX, mouseY, shell.getBoundingClientRect(), this.state.placement);
		this.state.x = x;
		this.state.y = y;
	}
	pickPlacement(targetRect, tooltipRect) {
		const spaces = {
			bottom: window.innerHeight - targetRect.bottom,
			left: targetRect.left,
			right: window.innerWidth - targetRect.right,
			top: targetRect.top,
		};
		if (spaces.top >= tooltipRect.height + GAP + EDGE_MARGIN) {
			return 'top';
		}
		if (spaces.bottom >= tooltipRect.height + GAP + EDGE_MARGIN) {
			return 'bottom';
		}
		if (spaces.right >= tooltipRect.width + GAP + EDGE_MARGIN) {
			return 'right';
		}
		if (spaces.left >= tooltipRect.width + GAP + EDGE_MARGIN) {
			return 'left';
		}
		return spaces.bottom >= spaces.top ? 'bottom' : 'top';
	}
	show({
		text,
		targetRect,
		mouseX,
		mouseY,
	} = {}) {
		if (!text || !targetRect) {
			return;
		}
		if (mouseX != null) {
			this.mousePos[0] = mouseX;
		}
		if (mouseY != null) {
			this.mousePos[1] = mouseY;
		}
		this.sequence += 1;
		const shell = this.shell;
		if (!shell) {
			return;
		}
		const wasOpen = shell.matches(':popover-open');
		this.state.sliding = wasOpen;
		this.state.text = text;
		if (!wasOpen) {
			shell.showPopover();
		}
		const tooltipRect = shell.getBoundingClientRect();
		const placement = this.pickPlacement(targetRect, tooltipRect);
		const {
			x, y,
		} = this.calcPosition(this.mousePos[0], this.mousePos[1], tooltipRect, placement);
		this.state.placement = placement;
		this.state.x = x;
		this.state.y = y;
		if (wasOpen) {
			const token = this.sequence;
			this.setTimeout(() => {
				if (this.sequence === token) {
					this.state.sliding = false;
				}
			}, 240);
		}
	}
	hide() {
		const shell = this.shell;
		if (!shell?.matches(':popover-open')) {
			return;
		}
		this.sequence += 1;
		this.state.sliding = false;
		shell.hidePopover();
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
