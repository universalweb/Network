import {
	hostSheet,
	loadSheet,
	resetSheet,
	scrollbarSheet,
} from '../componentLibrary/shared-styles.js';
import { WebComponent } from '../componentLibrary/base.js';
const navStyles = await loadSheet(new URL('../../styles/global-dock.css', import.meta.url));
const host = hostSheet(`
	:host {
		display: block;
		flex: 0 0 auto;
		width: 100%;
		position: relative;
		overflow: visible;
	}
	.nav-flyout {
		top: 6px;
		left: calc(var(--rail-width, 52px) + 6px);
	}
`);
export class AccountPanel extends WebComponent {
	static attrBindings = {
		'profile-name': 'profileName',
		'profile-label': 'profileLabel',
	};
	constructor() {
		super([resetSheet, host, navStyles, scrollbarSheet], { tooltips: true });
		this.state = {
			actionLabel: '',
			flyoutOpen: false,
			profileLabel: '',
			profileName: '',
		};
		this.addEvent('toggleFlyout', 'click', this.handleToggleFlyout);
	}
	get actionLabel() {
		return this.STATE?.actionLabel;
	}
	set actionLabel(value) {
		this.state.actionLabel = value ?? '';
	}
	get profileLabel() {
		return this.STATE?.profileLabel;
	}
	set profileLabel(value) {
		this.state.profileLabel = value ?? '';
	}
	get profileName() {
		return this.STATE?.profileName;
	}
	set profileName(value) {
		this.state.profileName = value ?? '';
	}
	onConnect() {
		const docClick = (e) => {
			if (this.STATE?.flyoutOpen && !e.composedPath().includes(this)) {
				this.closeFlyout();
			}
		};
		document.addEventListener('click', docClick);
		this.effectUnsubs.add(() => {
			document.removeEventListener('click', docClick);
		});
	}
	handleToggleFlyout() {
		if (this.STATE?.flyoutOpen) {
			this.closeFlyout();
		} else {
			this.openFlyout();
		}
	}
	openFlyout() {
		const flyout = this.shadowRoot?.querySelector('.nav-flyout');
		if (!flyout) {
			return;
		}
		flyout.classList.remove('closing');
		this.state.flyoutOpen = true;
		requestAnimationFrame(() => flyout.classList.add('open'));
	}
	closeFlyout() {
		const flyout = this.shadowRoot?.querySelector('.nav-flyout');
		if (!flyout) {
			return;
		}
		flyout.classList.remove('open');
		flyout.classList.add('closing');
		flyout.addEventListener('animationend', () => {
			flyout.classList.remove('closing');
			this.state.flyoutOpen = false;
		}, { once: true });
	}
	render() {
		this.html`
			<div class="ac-rail">
				<div class="ac-avatar"
					data-onclick="toggleFlyout"
					data-tooltip="${this.state.profileName}"
					title="${this.state.profileName}">
					${() => this.state.profileName ? this.state.profileName.charAt(0).toUpperCase() : '?'}
				</div>
			</div>
			<div class="nav-flyout">
				<div class="account-display">
					<div class="account-top">
						<div class="profile-meta">
							<div class="profile-label">${this.state.profileLabel}</div>
							<div class="profile-name">${this.state.profileName}</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('account-panel', AccountPanel);
