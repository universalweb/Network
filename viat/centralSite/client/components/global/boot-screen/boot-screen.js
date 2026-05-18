import '../loading-bar/loading-bar.js';
import { WebComponent, classList } from '../../core/index.js';
import { setGlobal } from '../../core/state/globalState.js';
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
		title: 'Welcome to Viat',
		subtitle: 'Command and Control Terminal',
		closing: false,
	};
	shownAt = 0;
	barState() {
		return {
			indeterminate: true,
			label: 'Loading Viat',
		};
	}
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
				setGlobal({
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
					<svg class="bs-mark" viewBox="0 0 64 64" fill="none" stroke-width="5.5" stroke-linecap="square" stroke-linejoin="miter">
						<defs>
							<linearGradient id="bs-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
								<stop offset="0%" stop-color="#c4b5fd">
									<animate attributeName="stop-color" values="#c4b5fd;#5eead4;#60a5fa;#f0abfc;#c4b5fd" dur="8s" repeatCount="indefinite"></animate>
								</stop>
								<stop offset="50%" stop-color="#5eead4">
									<animate attributeName="stop-color" values="#5eead4;#f0abfc;#c4b5fd;#60a5fa;#5eead4" dur="8s" repeatCount="indefinite"></animate>
								</stop>
								<stop offset="100%" stop-color="#60a5fa">
									<animate attributeName="stop-color" values="#60a5fa;#c4b5fd;#f0abfc;#5eead4;#60a5fa" dur="8s" repeatCount="indefinite"></animate>
								</stop>
								<animateTransform attributeName="gradientTransform" type="rotate" from="0 32 32" to="360 32 32" dur="14s" repeatCount="indefinite"></animateTransform>
							</linearGradient>
						</defs>
						<path class="bs-leg bs-leg-left" fill="url(#bs-grad)" d="M 11.54 15.23 L 16.46 12.77 L 32 43.85 L 32 56.14 Z"></path>
						<path class="bs-leg bs-leg-right" fill="url(#bs-grad)" d="M 52.46 15.23 L 47.54 12.77 L 32 43.85 L 32 56.14 Z"></path>
						<line class="bs-dash" stroke="url(#bs-grad)" x1="16" y1="32" x2="48" y2="32"></line>
					</svg>
					<div class="bs-titles">
						<div class="bs-title">${this.state.title}</div>
						<div class="bs-subtitle">${this.state.subtitle}</div>
					</div>
					<ui-loading-bar .state=${this.barState}></ui-loading-bar>
					<div class="bs-subtitle">LOCAL AI ENABLED</div>
				</div>
			</div>
		`;
	}
}
customElements.define('boot-screen', BootScreen);
