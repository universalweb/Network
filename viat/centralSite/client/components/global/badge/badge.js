import { classList, WebComponent } from '../../core/index.js';
export class UIBadge extends WebComponent {
	static url = import.meta.url;
	static styles = {
		badge: './badge.css',
	};
	static state = {
		dot: false,
		label: '',
		size: 'md',
		tone: 'neutral',
	};
	/* One-shot guard: the entrance animation plays on first paint only. Removed on
	   its animationend so the resting badge carries no animation (see badge.css). */
	hasEntered = false;
	onMount() {
		this.observeAsync('label', (newValue, oldValue) => {
			if (oldValue !== undefined && oldValue !== '' && newValue !== oldValue) {
				this.pulse();
			}
		});
	}
	pulse() {
		const badge = this.refs.badge;
		if (!badge) {
			return;
		}
		badge.classList.remove('is-pulsing');
		/* Force a synchronous reflow so re-adding the class restarts the animation
		   from frame 0 (a layout read flushes the pending style/layout). */
		badge.getBoundingClientRect();
		badge.classList.add('is-pulsing');
	}
	handleAnimationEnd(domEvent) {
		if (domEvent.animationName === 'badge-in') {
			this.hasEntered = true;
			domEvent.currentTarget.classList.remove('is-entering');
		} else if (domEvent.animationName === 'badge-pulse') {
			domEvent.currentTarget.classList.remove('is-pulsing');
		}
	}
	render() {
		/* tone/size are enumerated → data-* attributes (badge.css decorates
		   `[data-tone]`/`[data-size]`). Keeping them as `tone-*`/`size-*` classes let
		   the uwc.util `.tone-*` text utilities override badge's intended full-tone
		   `color` (forcing near-white for danger/warning). classList stays for the
		   imperatively-toggled animation classes (is-entering/is-pulsing) + has-dot. */
		this.html`
			<span #badge
				class=${classList('badge', () => {
					return this.state.dot && 'has-dot';
				}, () => {
					/* In the initial markup (no paint flash); dropped once entrance ends. */
					return !this.hasEntered && 'is-entering';
				})}
				data-tone=${this.state.tone}
				data-size=${this.state.size}
				role="status" @animationend=${this.handleAnimationEnd}>
				<span class="badge-dot" aria-hidden="true"></span>
				<span class="badge-label">${this.state.label}</span>
			</span>
		`;
	}
}
customElements.define('ui-badge', UIBadge);
