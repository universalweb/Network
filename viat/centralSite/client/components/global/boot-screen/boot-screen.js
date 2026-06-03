import '../loading-bar/loading-bar.js';
import { WebComponent, classList } from '../../core/index.js';
import { globalState } from '../../core/state/globalState.js';
const FADE_MS = 420;
// Minimum time the boot screen stays on screen so the V slide-in (≈1.1s)
// has time to play out even when the app boots faster than that. Anything
// less and the user sees the legs mid-flight before the screen vanishes.
const MIN_VISIBLE_MS = 1800;
export class BootScreen extends WebComponent {
	static url = import.meta.url;
	static styles = {
		bootScreen: './boot-screen.css',
	};
	static state = {
		title: '',
		subtitle: '',
		extraSubtitle: '',
		logo: '',
		barState: {
			indeterminate: true,
			label: '',
		},
		closing: false,
	};
	// `logo` is a caller-supplied SVG markup string — declare it html-kind so
	// the spot injects it as markup, not escaped text.
	static properties = {
		logo: {
			kind: 'html',
		},
	};
	shownAt = 0;
	onMount() {
		this.shownAt = performance.now();
	}
	dismiss() {
		if (this.state.closing) {
			return;
		}
		const elapsed = performance.now() - this.shownAt;
		const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
		this.setTimeout(() => {
			this.state.closing = true;
			this.setTimeout(() => {
				this.remove();
				// Signal to gated UI (e.g. the wallet-onboarding modal) that
				// it's safe to surface itself — anything that watches this
				// flag stays quiet until the splash is fully torn down.
				globalState.set({
					bootComplete: true,
				});
			}, FADE_MS);
		}, wait);
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${classList('boot-screen', () => {
				return this.state.closing && 'is-closing';
			})} role="status" aria-live="polite">
				<div class="bs-stage">
					<div class="bs-glow"></div>
					${this.bind('logo')}
					<div class="bs-titles">
						<div class="bs-title">${this.state.title}</div>
						<div class="bs-subtitle">${this.state.subtitle}</div>
					</div>
					<ui-loading-bar .state=${this.state.barState}></ui-loading-bar>
					<div class="bs-subtitle">${this.state.extraSubtitle}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('boot-screen', BootScreen);
