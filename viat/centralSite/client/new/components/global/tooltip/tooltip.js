import { WebComponent } from '../../base/base.js';
const tooltipStyles = await WebComponent.styleSheet('./tooltip.css', import.meta.url);
const EDGE_MARGIN = 12;
const GAP = 10;
const HIDE_DELAY = 180;
const SLIDE_DURATION = 220;
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
export class UITooltip extends WebComponent {
	hideTimeoutId = null;
	mousePos = [0, 0];
	sequence = 0;
	showFrame = 0;
	constructor() {
		super([tooltipStyles]);
		this.state = {
			mounted: false,
			placement: 'top',
			sliding: false,
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
		this.state.mounted = value === true;
	}
	get placement() {
		return this.state.placement;
	}
	set placement(value) {
		this.state.placement = value ?? 'top';
	}
	get text() {
		return this.state.text;
	}
	set text(value) {
		this.state.text = value ?? '';
	}
	get visible() {
		return this.state.visible;
	}
	set visible(value) {
		this.state.visible = value === true;
	}
	get x() {
		return this.state.x;
	}
	set x(value) {
		this.state.x = value ?? 0;
	}
	get y() {
		return this.state.y;
	}
	set y(value) {
		this.state.y = value ?? 0;
	}
	get shell() {
		return this.shadowRoot.querySelector('.tooltip-shell');
	}
	calcPosition(mouseX, mouseY, tooltipRect, targetRect, placement) {
		let x = mouseX - tooltipRect.width / 2;
		let y = mouseY - tooltipRect.height - GAP;
		if (placement === 'bottom') {
			y = mouseY + GAP;
		} else if (placement === 'left') {
			x = mouseX - tooltipRect.width - GAP;
			y = mouseY - tooltipRect.height / 2;
		} else if (placement === 'right') {
			x = mouseX + GAP;
			y = mouseY - tooltipRect.height / 2;
		}
		return {
			x: clamp(x, EDGE_MARGIN, window.innerWidth - tooltipRect.width - EDGE_MARGIN),
			y: clamp(y, EDGE_MARGIN, window.innerHeight - tooltipRect.height - EDGE_MARGIN),
		};
	}
	track(mouseX, mouseY) {
		this.mousePos[0] = mouseX;
		this.mousePos[1] = mouseY;
		if (!this.state?.mounted || !this.state?.visible) {
			return;
		}
		const shell = this.shell;
		if (!shell) {
			return;
		}
		const {
			x, y,
		} = this.calcPosition(mouseX, mouseY, shell.getBoundingClientRect(), null, this.state.placement);
		this.state.x = x;
		this.state.y = y;
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
		const token = this.sequence;
		if (this.hideTimeoutId) {
			this.clearTimeout(this.hideTimeoutId);
			this.hideTimeoutId = null;
		}
		if (this.showFrame) {
			cancelAnimationFrame(this.showFrame);
			this.showFrame = 0;
		}
		const sliding = this.state?.visible === true;
		if (sliding) {
			this.state.text = text;
			this.state.sliding = true;
		} else {
			this.state.mounted = true;
			this.state.text = text;
			this.state.visible = false;
			this.state.sliding = false;
		}
		this.showFrame = requestAnimationFrame(() => {
			if (this.sequence !== token || !this.state?.mounted) {
				return;
			}
			const shell = this.shell;
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
			let placement;
			if (canTop) {
				placement = 'top';
			} else if (canBottom) {
				placement = 'bottom';
			} else if (canRight) {
				placement = 'right';
			} else if (canLeft) {
				placement = 'left';
			} else {
				placement = spaces.bottom >= spaces.top ? 'bottom' : 'top';
			}
			const {
				x, y,
			} = this.calcPosition(this.mousePos[0], this.mousePos[1], tooltipRect, targetRect, placement);
			this.state.placement = placement;
			this.state.x = x;
			this.state.y = y;
			if (sliding) {
				this.setTimeout(() => {
					if (this.sequence === token) {
						this.state.sliding = false;
					}
				}, SLIDE_DURATION);
			} else {
				requestAnimationFrame(() => {
					if (this.sequence !== token || !this.state?.mounted) {
						return;
					}
					this.visible = true;
				});
			}
		});
	}
	hide() {
		if (!this.state?.mounted) {
			return;
		}
		this.sequence += 1;
		this.visible = false;
		if (this.hideTimeoutId) {
			this.clearTimeout(this.hideTimeoutId);
		}
		const token = this.sequence;
		this.hideTimeoutId = this.setTimeout(() => {
			if (this.sequence !== token || this.state?.visible) {
				return;
			}
			this.mounted = false;
			this.hideTimeoutId = null;
		}, HIDE_DELAY);
	}
	render() {
		return this.html `
			<div class="${() => {
				const {
					visible, sliding,
				} = this.state;
				return `tooltip-shell${visible ? ' is-visible' : ''}${sliding ? ' is-sliding' : ''}`;
			}}" data-placement="${() => {
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
