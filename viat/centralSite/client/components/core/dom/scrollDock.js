/*
	DESCRIPTION: ScrollDock — toggle data-scrolled on a chrome host when a
	scroller crosses a threshold. ui-app-bar uses this to float at rest and
	dock once the page has moved.
	options.scroller:
	  Element     — listen to that node
	  'nearest'   — findScrollableAncestor(host) through shadow
	  'global'    — observe globalState.environment.scrolled (wallet path)
	options.threshold     default 8 (same as scroll-report)
	options.scrolledAttr  default 'scrolled' → data-scrolled
	── USAGE ────────────────────────────────────────────────────────────
	  const dock = ScrollDock.attach(host, { scroller: stage });
	  dock.detach();
	─────────────────────────────────────────────────────────────────────
*/
import { globalState } from '../state/globalState.js';
import { isElement, isFunction } from '../utilities.js';
import { findScrollableAncestor } from './scrollRoot.js';
const DEFAULT_THRESHOLD = 8;
const DEFAULT_ATTR = 'scrolled';
function resolveScroller(host, scroller) {
	if (scroller === 'nearest') {
		return findScrollableAncestor(host, {
			requireOverflow: false,
		});
	}
	if (isElement(scroller)) {
		return scroller;
	}
	return null;
}
export class ScrollDock {
	constructor(host, options = {}) {
		this.host = host;
		this.scrollerOption = options.scroller;
		const rawThreshold = Number(options.threshold);
		this.threshold = rawThreshold > 0 ? rawThreshold : DEFAULT_THRESHOLD;
		this.scrolledAttr = options.scrolledAttr || DEFAULT_ATTR;
		this.scroller = null;
		this.storeSub = null;
		this.attached = false;
	}
	static attach(host, options) {
		const dock = new ScrollDock(host, options);
		dock.attach();
		return dock;
	}
	static is(value) {
		return value instanceof ScrollDock;
	}
	attrName() {
		return `data-${this.scrolledAttr}`;
	}
	applyScrolled(scrolled) {
		const host = this.host;
		if (!isFunction(host?.toggleAttribute)) {
			return;
		}
		host.toggleAttribute(this.attrName(), scrolled === true);
	}
	onScroll() {
		const scroller = this.scroller;
		if (!scroller) {
			return;
		}
		this.applyScrolled(scroller.scrollTop > this.threshold);
	}
	onGlobalScrolled(value) {
		this.applyScrolled(value === true);
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'scroll') {
			this.onScroll();
		}
	}
	attach() {
		if (this.attached) {
			this.detach();
		}
		this.attached = true;
		if (this.scrollerOption === 'global') {
			this.storeSub = globalState.bus.subscribe(
				'environment.scrolled',
				ScrollDock.prototype.onGlobalScrolled,
				this
			);
			this.applyScrolled(globalState.get('environment.scrolled') === true);
			return;
		}
		this.scroller = resolveScroller(this.host, this.scrollerOption);
		if (!this.scroller) {
			this.applyScrolled(false);
			return;
		}
		this.scroller.addEventListener('scroll', this, {
			passive: true,
		});
		this.onScroll();
	}
	detach() {
		if (!this.attached) {
			return;
		}
		this.attached = false;
		if (this.storeSub) {
			this.storeSub.unsubscribe();
			this.storeSub = null;
		}
		if (this.scroller) {
			this.scroller.removeEventListener('scroll', this);
			this.scroller = null;
		}
	}
}
