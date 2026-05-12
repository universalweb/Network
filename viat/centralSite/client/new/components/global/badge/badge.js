import { WebComponent } from '../../core/index.js';
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
	get hostClass() {
		return `badge tone-${this.state.tone} size-${this.state.size}${this.state.dot ? ' has-dot' : ''}`;
	}
	onMount() {
		this.observe('label', (newValue, oldValue) => {
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
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<span #badge class="${() => this.hostClass}" role="status" @animationend=${this.handleAnimationEnd}>
				${this.state.dot ? '<span class="badge-dot" aria-hidden="true"></span>' : ''}
				<span class="badge-label">${this.state.label}</span>
			</span>
		`;
	}
}
customElements.define('ui-badge', UIBadge);
