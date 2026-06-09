import { WebComponent, classList } from '../../core/index.js';
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
		void badge.offsetWidth;
		badge.classList.add('is-pulsing');
	}
	handleAnimationEnd(domEvent) {
		if (domEvent.animationName === 'badge-pulse') {
			domEvent.currentTarget.classList.remove('is-pulsing');
		}
	}
	render() {
		
		this.html `
			<span #badge class=${classList('badge', () => {
				return `tone-${this.state.tone}`;
			}, () => {
				return `size-${this.state.size}`;
			}, () => {
				return this.state.dot && 'has-dot';
			})} role="status" @animationend=${this.handleAnimationEnd}>
				<span class="badge-dot" aria-hidden="true"></span>
				<span class="badge-label">${this.state.label}</span>
			</span>
		`;
	}
}
customElements.define('ui-badge', UIBadge);
