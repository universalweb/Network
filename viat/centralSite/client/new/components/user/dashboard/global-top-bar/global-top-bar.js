import '../../../global/theme-select/theme-select.js';
import { WebComponent, list } from '../../../core/index.js';
import { TopBarIconButton } from './top-bar-icon-button.js';
const SNAP_MS = 320;
const SNAP_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const DRAG_THRESHOLD_PX = 6;
const SNAP_THRESHOLD = 0.3;
const SNAP_VELOCITY = 0.5;
const FLOAT_GAP_PX = 16;
export class GlobalTopBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalTopBar: './global-top-bar.css',
	};
	static state = {
		items: [],
		subtitle: '',
	};
	open = false;
	pointerId = null;
	startY = 0;
	startTime = 0;
	delta = 0;
	dragMoved = false;
	suppressNextClick = false;
	naturalTop = 0;
	naturalBottom = 0;
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	onMount() {
		this.style.touchAction = 'none';
		this.style.cursor = 'grab';
		this.addEventListener('pointerdown', this.handlePointerDown);
		this.delegate('click', this.handleClickCapture);
		this.delegate('pulldown:state', this.handlePulldownState);
		window.addEventListener('resize', this.handleResize);
	}
	handlePulldownState = (domEvent) => {
		if (domEvent.target === this) {
			return;
		}
		const targetOpen = domEvent.detail?.data?.open === true;
		if (targetOpen === this.open) {
			return;
		}
		this.snapTo(targetOpen);
	};
	onUnmount() {
		this.removeEventListener('pointerdown', this.handlePointerDown);
		this.removeDragListeners();
		window.removeEventListener('resize', this.handleResize);
	}
	maxOffset() {
		return Math.max(0, window.innerHeight - this.naturalBottom - FLOAT_GAP_PX);
	}
	measureNatural() {
		const previousTransform = this.style.transform;
		this.style.transform = 'none';
		const rect = this.getBoundingClientRect();
		this.style.transform = previousTransform;
		this.naturalTop = rect.top;
		this.naturalBottom = rect.bottom;
	}
	addDragListeners() {
		this.dragUnsubs = [
			this.delegate('pointermove', this.handlePointerMove),
			this.delegate('pointerup', this.handlePointerEnd),
			this.delegate('pointercancel', this.handlePointerEnd),
		];
		window.addEventListener('blur', this.handleWindowBlur);
	}
	removeDragListeners() {
		if (this.dragUnsubs) {
			for (let i = 0; i < this.dragUnsubs.length; i++) {
				this.dragUnsubs[i]();
			}
			this.dragUnsubs = null;
		}
		window.removeEventListener('blur', this.handleWindowBlur);
	}
	handleResize = () => {
		if (this.naturalBottom === 0) {
			return;
		}
		this.measureNatural();
		if (this.open) {
			this.style.transition = 'none';
			this.style.transform = `translateY(${this.maxOffset()}px)`;
			this.emit('pulldown:drag', {
				progress: 1,
				barTop: this.naturalTop + this.maxOffset(),
			});
		}
	};
	handleWindowBlur = () => {
		if (this.pointerId === null) {
			return;
		}
		this.handlePointerEnd({
			pointerId: this.pointerId,
		});
	};
	handlePointerDown = (domEvent) => {
		if (this.pointerId !== null || (domEvent.button !== undefined && domEvent.button !== 0)) {
			return;
		}
		this.pointerId = domEvent.pointerId;
		this.startY = domEvent.clientY;
		this.startTime = performance.now();
		this.delta = 0;
		this.dragMoved = false;
		if (!this.open) {
			this.measureNatural();
		}
		this.style.transition = 'none';
		this.style.cursor = 'grabbing';
		this.addDragListeners();
	};
	handlePointerMove = (domEvent) => {
		if (domEvent.pointerId !== this.pointerId) {
			return;
		}
		const raw = domEvent.clientY - this.startY;
		this.delta = this.open ? Math.min(0, raw) : Math.max(0, raw);
		if (!this.dragMoved && Math.abs(raw) > DRAG_THRESHOLD_PX) {
			this.dragMoved = true;
			this.style.zIndex = '100';
			this.emit('pulldown:dragstart', {
				open: this.open,
			});
		}
		if (!this.dragMoved) {
			return;
		}
		const max = this.maxOffset();
		const baseY = this.open ? max : 0;
		const targetY = Math.max(0, Math.min(max, baseY + this.delta));
		this.style.transform = `translateY(${targetY}px)`;
		this.emit('pulldown:drag', {
			progress: max ? targetY / max : 0,
			barTop: this.naturalTop + targetY,
		});
	};
	handlePointerEnd = (domEvent) => {
		if (domEvent.pointerId !== this.pointerId) {
			return;
		}
		this.pointerId = null;
		this.removeDragListeners();
		this.style.cursor = 'grab';
		if (!this.dragMoved) {
			this.style.zIndex = this.open ? '100' : '';
			this.emit('pulldown:dragend', {
				open: this.open,
				snapped: false,
			});
			return;
		}
		this.suppressNextClick = true;
		const elapsed = Math.max(performance.now() - this.startTime, 1);
		const distance = Math.abs(this.delta);
		const speed = distance / elapsed;
		const ratio = distance / window.innerHeight;
		const shouldFlip = ratio >= SNAP_THRESHOLD || speed >= SNAP_VELOCITY;
		const goingOpen = this.open ? !shouldFlip : shouldFlip;
		this.snapTo(goingOpen);
	};
	snapTo(open) {
		const max = this.maxOffset();
		const targetY = open ? max : 0;
		this.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		this.style.transform = `translateY(${targetY}px)`;
		const wasOpen = this.open;
		this.open = open;
		this.style.zIndex = open ? '100' : '';
		this.emit('pulldown:state', {
			open,
		});
		this.emit('pulldown:dragend', {
			open,
			snapped: true,
		});
		if (!open) {
			this.setTimeout(() => {
				if (!this.open) {
					this.style.transform = '';
					this.style.transition = '';
					this.style.zIndex = '';
				}
			}, SNAP_MS);
		}
		if (open !== wasOpen) {
			this.emit(open ? 'pulldown:open' : 'pulldown:close', {});
		}
	}
	handleClickCapture = (domEvent) => {
		if (!this.suppressNextClick) {
			return;
		}
		this.suppressNextClick = false;
		if (domEvent.composedPath().includes(this)) {
			domEvent.stopPropagation();
			domEvent.preventDefault();
		}
	};
	sepIconState() {
		return {
			name: 'chevron-right',
			size: 'xs',
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<header class="global-top-bar">
				<div class="tb-logo">
					<span class="tb-logo-mark">⩝</span> VIAT <ui-icon class="tb-logo-sep" .state=${this.sepIconState}></ui-icon>
					<span class="tb-subtitle">${this.state.subtitle}</span>
				</div>
				<div class="tb-status">
					<ui-theme-select></ui-theme-select>
					${list('items', TopBarIconButton)}
				</div>
			</header>
		`;
	}
}
customElements.define('global-top-bar', GlobalTopBar);
