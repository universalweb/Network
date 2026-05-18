import { WebComponent, list } from '../../core/index.js';
import { DockIconButton } from './dock-icon-button.js';
const SQUEEZE_MS = 140;
const MOVE_MS = 440;
export class GlobalDock extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalDock: './global-dock.css',
	};
	static state = {
		items: [],
	};
	barMoveToken = 0;
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	dockSelect(domEvent) {
		const { detail: { source } } = domEvent;
		const active = this.getComponents('dock-icon-button').find((btn) => {
			return btn.state.active;
		});
		if (active && active !== source) {
			active.state.active = false;
		}
		if (source) {
			source.state.active = true;
		}
		this.updateActiveBar(source);
	}
	activeSection = '';
	onConnect() {
		// Single source of truth — the router publishes routeSection on every
		// navigation; the dock owns its own lit/unlit logic by watching that.
		this.observeGlobal('routeSection', (sectionId) => {
			this.applyActiveSection(sectionId);
		});
		// `state.items` is supplied by the parent (app.js seeds from
		// appDefaults.DOCK). We don't import that here — we just react when
		// items first arrive and re-apply whatever section the router has
		// already published. The rAF wait lets the list-rendered
		// dock-icon-button children actually mount before we look for them.
		this.observe('items', () => {
			if (!this.state.items?.length) {
				return;
			}
			requestAnimationFrame(() => {
				this.applyActiveSection(this.activeSection || this.globalState?.routeSection || '');
			});
		});
	}
	onMount() {
		// Pick up whatever the router has already published (e.g. on a
		// deep-linked first paint where the router publishes before any of
		// our dock-icon-buttons exist).
		this.applyActiveSection(this.globalState?.routeSection ?? '');
		// Re-snap the active bar when layout shifts. `viewport:resize` is
		// rAF-coalesced so we just snap (no animation) and let the bar's CSS
		// transition smooth-track the new offset. On a bucket width change
		// (e.g. crossing the mobile breakpoint) we flip orientation so the
		// bar doesn't try to interpolate between translateX/translateY.
		this.delegate('viewport:resize', this.handleViewportResize);
		this.delegate('viewport:change', this.handleViewportChange);
	}
	handleViewportResize = () => {
		this.snapActiveBar();
	};
	handleViewportChange = (domEvent) => {
		const changed = domEvent?.detail?.data?.changed;
		if (!changed?.w) {
			return;
		}
		this.flipActiveBar();
	};
	applyActiveSection(sectionId) {
		const nextSection = sectionId ?? '';
		this.activeSection = nextSection;
		const buttons = this.getComponents('dock-icon-button');
		if (!buttons?.length) {
			// Buttons mount asynchronously after `state.items` is populated;
			// once at least one is in place we'll be re-invoked via the next
			// observeGlobal tick or syncFromActiveSection on items-change.
			return;
		}
		let target = null;
		for (let index = 0; index < buttons.length; index += 1) {
			const btn = buttons[index];
			const matches = Boolean(nextSection) && btn.state?.id === nextSection;
			if (btn.state && btn.state.active !== matches) {
				btn.state.active = matches;
			}
			if (matches) {
				target = btn;
			}
		}
		this.updateActiveBar(target);
	}
	syncActiveBar(activeBtn) {
		if (this.state.items.length === 0) {
			return;
		}
		const active = activeBtn || this.getComponents('dock-icon-button').find((btn) => {
			return btn.state.active;
		});
		this.updateActiveBar(active);
	}
	writeBarMetrics(bar, activeBtn) {
		// Both axes are written every time so the CSS can pick which one to
		// use via media query (vertical bar uses --bar-y/--bar-h, horizontal
		// uses --bar-x/--bar-w). Cheap to set; no layout cost beyond the
		// offset reads we already do.
		bar.style.setProperty('--bar-x', `${activeBtn.offsetLeft}px`);
		bar.style.setProperty('--bar-y', `${activeBtn.offsetTop}px`);
		bar.style.setProperty('--bar-w', `${activeBtn.offsetWidth}px`);
		bar.style.setProperty('--bar-h', `${activeBtn.offsetHeight}px`);
	}
	snapActiveBar() {
		const bar = this.refs.active_bar;
		if (!bar?.classList.contains('is-visible')) {
			return;
		}
		const active = this.getComponents('dock-icon-button').find((btn) => {
			return btn.state.active;
		});
		if (!active) {
			return;
		}
		this.writeBarMetrics(bar, active);
	}
	flipActiveBar() {
		// Orientation just changed (vertical ↔ horizontal across the mobile
		// breakpoint). Disable transitions for one frame so the bar snaps to
		// the new axis without trying to interpolate between translateX and
		// translateY (which the browser would otherwise drop into a hard
		// jump anyway).
		const bar = this.refs.active_bar;
		if (!bar?.classList.contains('is-visible')) {
			return;
		}
		const active = this.getComponents('dock-icon-button').find((btn) => {
			return btn.state.active;
		});
		if (!active) {
			return;
		}
		bar.classList.add('is-flipping');
		this.writeBarMetrics(bar, active);
		requestAnimationFrame(() => {
			bar.classList.remove('is-flipping');
		});
	}
	async updateActiveBar(activeBtn) {
		const bar = this.refs.active_bar;
		if (!bar) {
			return;
		}
		if (!activeBtn) {
			bar.classList.remove('is-visible');
			return;
		}
		const wasVisible = bar.classList.contains('is-visible');
		if (!wasVisible) {
			this.writeBarMetrics(bar, activeBtn);
			bar.style.setProperty('--bar-scale', '1');
			bar.classList.add('is-visible');
			return;
		}
		const token = ++this.barMoveToken;
		bar.classList.add('is-squeezing');
		bar.style.setProperty('--bar-scale', '0.25');
		bar.style.setProperty('--bar-w', `${activeBtn.offsetWidth}px`);
		bar.style.setProperty('--bar-h', `${activeBtn.offsetHeight}px`);
		await new Promise((resolve) => {
			this.setTimeout(resolve, SQUEEZE_MS);
		});
		if (token !== this.barMoveToken) {
			return;
		}
		bar.classList.remove('is-squeezing');
		bar.style.setProperty('--bar-x', `${activeBtn.offsetLeft}px`);
		bar.style.setProperty('--bar-y', `${activeBtn.offsetTop}px`);
		await new Promise((resolve) => {
			this.setTimeout(resolve, MOVE_MS);
		});
		if (token !== this.barMoveToken) {
			return;
		}
		bar.style.setProperty('--bar-scale', '1');
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="nav-rail" @${this.dockSelect}>
				<div class="active-bar" #active_bar></div>
				${list('items', DockIconButton)}
			</div>
		`;
	}
}
customElements.define('global-dock', GlobalDock);
