/*
	DESCRIPTION: ui-animated-number — a standalone count-up display. Extracts the
	rAF-tween cadence that already lives inside metric/vote-tally (easeOutCubic,
	`nextFrame()` loop, `isDisconnected` guard, reduced-motion bail) so KPIs can roll
	without duplicating that logic a third time. Rolls on every `value` change.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-animated-number .state.value=${9410} .state.group=${true}></ui-animated-number>
	  <ui-animated-number .state.value=${1.84} .state.decimals=${2} .state.suffix=${'s'}></ui-animated-number>
	  <ui-animated-number .state.value=${128.4} .state.pre=${'$'} .state.decimals=${2}></ui-animated-number>
	NB: the prepend key is `pre`, NOT `prefix` — `Element.prototype.prefix` is a
	read-only native getter, so a `.prefix=` binding throws (same footgun as title/open).
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
const DEFAULT_MS = 900;
function prefersReducedMotion() {
	return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}
export class UIAnimatedNumber extends WebComponent {
	static url = import.meta.url;
	static styles = {
		animatedNumber: './animated-number.css',
	};
	static state = {
		value: 0,
		decimals: 0,
		pre: '',
		suffix: '',
		group: true,
		duration: DEFAULT_MS,
		// Internal — the currently displayed (mid-tween) value.
		shown: 0,
	};
	onConnect() {
		this.counting = false;
		this.observe('value', () => {
			this.countTo(Number(this.state.value) || 0);
		});
	}
	onMount() {
		this.countTo(Number(this.state.value) || 0);
	}
	countTo(target) {
		this.countTarget = target;
		if (prefersReducedMotion()) {
			this.state.shown = target;
			return;
		}
		this.countFrom = Number(this.state.shown) || 0;
		this.countStart = globalThis.performance.now();
		if (!this.counting) {
			this.counting = true;
			this.countStep();
		}
	}
	countStep() {
		if (this.isDisconnected) {
			this.counting = false;
			return;
		}
		const duration = Number(this.state.duration) || DEFAULT_MS;
		const elapsed = globalThis.performance.now() - this.countStart;
		const fraction = Math.min(1, elapsed / duration);
		const eased = 1 - ((1 - fraction) ** 3);
		this.state.shown = this.countFrom + ((this.countTarget - this.countFrom) * eased);
		if (fraction < 1) {
			this.nextFrame().then(() => {
				this.countStep();
			});
			return;
		}
		this.state.shown = this.countTarget;
		this.counting = false;
	}
	format(value) {
		const decimals = Number(this.state.decimals) || 0;
		const number = Number(value) || 0;
		const body = this.state.group ? number.toLocaleString(undefined, {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}) : number.toFixed(decimals);
		return `${this.state.pre || ''}${body}${this.state.suffix || ''}`;
	}
	render() {
		this.html`
			<span class="animated-number" role="status">${this.format(this.state.shown)}</span>
		`;
	}
}
customElements.define('ui-animated-number', UIAnimatedNumber);
