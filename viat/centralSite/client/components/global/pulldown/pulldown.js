import { WebComponent } from '../../core/index.js';
const SNAP_MS = 320;
const SNAP_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
export class UIPullDown extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pulldown: './pulldown.css',
	};
	static state = {
		open: false,
	};
	settleTimer = null;
	onConnect() {
		this.delegate('pulldown:dragstart', this.handleDragStart);
		this.delegate('pulldown:drag', this.handleDrag);
		this.delegate('pulldown:state', this.handleState);
		this.delegate('pulldown:dragend', this.handleDragEnd);
	}
	handleDragEnd(domEvent) {
		const data = domEvent.detail.data;
		if (data.snapped) {
			return;
		}
		const drawer = this.refs.drawer;
		if (!drawer) {
			return;
		}
		if (this.state.open) {
			return;
		}
		drawer.classList.remove('is-active', 'is-fully-open', 'is-open');
		drawer.style.transform = '';
		drawer.style.transition = '';
	}
	handleDragStart() {
		const drawer = this.refs.drawer;
		drawer.style.transition = 'none';
		drawer.classList.add('is-active');
		drawer.classList.remove('is-fully-open');
	}
	handleDrag(domEvent) {
		const { barTop } = domEvent.detail.data;
		const drawer = this.refs.drawer;
		drawer.style.transform = `translateY(${barTop - globalThis.innerHeight}px)`;
	}
	handleState(domEvent) {
		const isOpen = domEvent.detail.data.open;
		const drawer = this.refs.drawer;
		const wasHidden = !drawer.classList.contains('is-active') && !drawer.classList.contains('is-open');
		if (isOpen && wasHidden) {
			drawer.classList.add('is-active');
			drawer.style.transition = 'none';
			drawer.style.transform = 'translateY(-100%)';
			drawer.getBoundingClientRect();
		}
		drawer.style.transition = `transform ${SNAP_MS}ms ${SNAP_CURVE}`;
		drawer.style.transform = isOpen ? 'translateY(0)' : 'translateY(-100%)';
		drawer.classList.toggle('is-open', isOpen);
		this.state.open = isOpen;
		// One settle timer at a time. A rapid open→close→open lands three
		// transitions inside SNAP_MS; a stale close-settle firing on the drawer
		// that has since reopened would strip `is-active`/transform off it,
		// leaving the panel invisible while the open flag stays true. Supersede
		// the prior timer, and resolve against the LIVE `this.state.open` at fire
		// time — never the value captured when the timer was scheduled.
		if (this.settleTimer) {
			this.removeTimeout(this.settleTimer);
		}
		this.settleTimer = this.setTimeout(() => {
			this.settleTimer = null;
			if (this.state.open) {
				drawer.classList.add('is-fully-open');
			} else {
				drawer.classList.remove('is-active', 'is-fully-open');
				drawer.style.transform = '';
				drawer.style.transition = '';
			}
		}, SNAP_MS);
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div #drawer class="pulldown-drawer">
				<div class="pulldown-content">
					<slot></slot>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-pulldown', UIPullDown);
