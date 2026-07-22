import '../../global/modal/modal.js';
import '../../global/whitebox-modal/whitebox-modal.js';
import { WebComponent } from 'webcomponent';
// `<welcome-back-modal>` — replaces the intro modal at boot when a saved
// profile auto-loaded from localStorage. Mirrors the intro modal's hero
// (animated VIAT triangle on a gradient chip, headline + tagline) so the
// two boot paths read as the same family, then shows profile / address /
// status, a tappable HD-seed thumbnail, and finally the action row.
function shortAddress(address) {
	const text = `${address ?? ''}`;
	if (!text) {
		return '';
	}
	if (text.length <= 24) {
		return text;
	}
	return `${text.slice(0, 14)}…${text.slice(-8)}`;
}
export class WelcomeBackModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		modalChrome: '../shared/modal-chrome.css',
		welcomeBack: './welcome-back-modal.css',
	};
	static state = {
		profileName: '',
		address: '',
		label: '',
		locked: false,
		modal: {
			modal: true,
			open: false,
			showClose: true,
		},
		thumbModal: {
			src: './HDSeed.png',
			alt: 'HD seed tree diagram',
			caption: 'HD seed tree — deterministic four-pool master entropy.',
		},
	};
	pendingOpen = null;
	openFor(options = {}) {
		this.assignState({
			profileName: options.profileName ?? '',
			address: options.address ?? '',
			label: options.label ?? '',
			locked: Boolean(options.locked),
		});
		// Don't pop over the boot splash — queue the open until bootComplete
		// flips true. Mirrors the wallet-onboarding gate so both flows feel
		// consistent ("modal arrives after the splash finishes").
		if (!this.global.bootComplete) {
			this.pendingOpen = true;
			return;
		}
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	handleContinue() {
		this.close();
	}
	handleUnlockNow() {
		this.close();
		// Ask AppView to surface the unlock modal with a meaningful reason
		// rather than reaching across the shadow tree ourselves.
		this.emit('wallet:request-unlock', {
			reason: 'Unlock now to enable signing and transactions.',
		});
	}
	handleThumbClick() {
		this.refs.thumb_modal?.open();
	}
	render() {
		this.html`
			<ui-modal #modal .state=${this.state.modal} style="--ui-modal-max-width: 620px">
				<div class="modal-shell">
					<div class="wb-hero">
						<span class="wb-glyph" aria-hidden="true">
							<svg class="wb-mark" viewBox="0 0 64 64" fill="none" stroke-width="5.5" stroke-linecap="square" stroke-linejoin="miter">
								<defs>
									<linearGradient id="wb-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
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
								<path class="wb-leg wb-leg-left" fill="url(#wb-grad)" d="M 11.54 15.23 L 16.46 12.77 L 32.8 43.85 L 32 56.14 Z"></path>
								<path class="wb-leg wb-leg-right" fill="url(#wb-grad)" d="M 52.46 15.23 L 47.54 12.77 L 31.2 43.85 L 32 56.14 Z"></path>
								<line class="wb-dash" stroke="url(#wb-grad)" x1="16" y1="32" x2="48" y2="32"></line>
							</svg>
						</span>
						<div class="wb-hero-text">
							<header class="modal-head">
								<span class="modal-head-id">⩝VIAT</span>
								<span class="modal-head-title">// WELCOME BACK</span>
							</header>
							<p class="wb-tagline">${() => {
								return (this.state.locked ? 'Your profile is loaded — unlock when you\'re ready.' : 'Your profile is loaded and unlocked.');
							}}</p>
						</div>
					</div>
					<p class="modal-copy">${() => {
						return this.state.locked ? 'Public data (address, balance, transactions) is live. Private keys stay encrypted until you enter your password — needed only for signing or transmitting.' : 'Sign and transmit are ready. Your private keys are decrypted for this session and never leave the browser.';
					}}</p>
					<div class="modal-meta">
						<div class="modal-meta-row">
							<span class="modal-meta-key">PROFILE</span>
							<span class="modal-meta-val">${() => {
								return this.state.label || this.state.profileName || '—';
							}}</span>
						</div>
						<div class="modal-meta-row">
							<span class="modal-meta-key">ADDRESS</span>
							<span class="modal-meta-val" tooltip=${this.state.address}>${() => {
								return shortAddress(this.state.address);
							}}</span>
						</div>
						<div class="modal-meta-row">
							<span class="modal-meta-key">STATUS</span>
							<span class="modal-meta-val" data-lock=${this.state.locked ? 'locked' : 'unlocked'}>${this.state.locked ? '🔒 LOCKED — public data only' : '🔓 UNLOCKED — ready'}</span>
						</div>
					</div>
					<div class="wb-thumb-card">
						<button type="button" class="wb-thumb" @click=${this.handleThumbClick} aria-label="Open HD seed diagram">
							<img src="./HDSeed.png" alt="HD seed tree diagram" draggable="false">
						</button>
						<div class="wb-thumb-text">
							<strong>HOW WALLETS WORK</strong>
							<span>Tap the diagram for a closer look at the four-pool master entropy + post-quantum trapdoor that backs every VIAT wallet.</span>
						</div>
					</div>
					<div class="modal-actions">
						<button type="button" class="primary" ?hidden=${() => {
							return !this.state.locked;
						}} @click=${this.handleUnlockNow}>UNLOCK NOW</button>
						<button type="button" @click=${this.handleContinue}>CONTINUE</button>
					</div>
					<ui-whitebox-modal #thumb_modal .state=${this.state.thumbModal}></ui-whitebox-modal>
				</div>
			</ui-modal>
		`;
	}
	onConnect() {
		this.observeGlobal('bootComplete', () => {
			if (this.pendingOpen && this.global.bootComplete) {
				this.pendingOpen = null;
				this.refs.modal?.open();
			}
		});
	}
}
customElements.define('welcome-back-modal', WelcomeBackModal);
