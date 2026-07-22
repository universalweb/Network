import '../../global/modal/modal.js';
import '../../global/whitebox-modal/whitebox-modal.js';
import { WebComponent } from 'webcomponent';
// Routes where a wallet is required to actually use the page. On every other
// route (explorer, transaction detail, account detail, etc.) we leave the
// modal closed so people can read/browse without being interrupted.
const WALLET_REQUIRED_ROUTES = new Set(['wallet', 'swap']);
export class WalletOnboarding extends WebComponent {
	static url = import.meta.url;
	static styles = {
		walletOnboarding: './wallet-onboarding.css',
	};
	/*
	 * Per-theme RULE overrides live in `./themes/{id}.css` and are adopted into
	 * the shadow root by theme — the document-level theme sheet only carries
	 * tokens. Dark recasts the CTAs to x.ai pills with a white-fill primary.
	 */
	static themes = ['dark'];
	static state = {
		visible: false,
		hasSaved: false,
		forcedReason: '',
		modal: {
			modal: true,
			open: false,
			showClose: true,
			showMaximize: true,
			// Wired once in onConnect — ui-modal calls autoFocus() with no thisArg.
			autoFocus: null,
		},
		thumbModal: {
			src: './HDSeed.png',
			alt: 'HD seed tree diagram',
			caption: 'HD seed tree — deterministic four-pool master entropy.',
		},
	};
	forced = false;
	onConnect() {
		// Resolve #create_wallet_save at open-time (ref may not exist at construct).
		if (!this.createWalletFocus) {
			this.createWalletFocus = () => {
				return this.refs.create_wallet_save;
			};
		}
		this.state.modal.autoFocus = this.createWalletFocus;
		this.delegate('wallet:state', this.handleWalletState);
		this.observeGlobal('routeId', (next) => {
			this.handleRouteChange(next);
		});
		// Wait for the boot screen to fully tear itself down before we ever
		// auto-surface the create-wallet modal — otherwise the modal pops in
		// over the splash and the user sees both at once.
		this.observeGlobal('bootComplete', () => {
			this.evaluateVisibility();
		});
	}
	onMount() {
		this.evaluateVisibility();
	}
	currentRouteId() {
		return this.global.routeId || '';
	}
	requiredForRoute(routeId = this.currentRouteId()) {
		return WALLET_REQUIRED_ROUTES.has(routeId);
	}
	evaluateVisibility() {
		const info = this.global.wallet ?? {};
		const hasSaved = (info.savedProfiles?.length ?? 0) > 0;
		const hasActive = Boolean(info.hasWallet);
		this.assignState({
			hasSaved,
		});
		if (hasActive) {
			this.forced = false;
			this.assignState({
				forcedReason: '',
			});
			this.refs.modal?.close();
			return;
		}
		// Don't auto-open over the boot splash; the `bootComplete` observer
		// re-runs this once the splash is gone. `forced` (forceOpen) still
		// gets through because that's an explicit user/system request.
		if (!this.forced && !this.global.bootComplete) {
			return;
		}
		const shouldShow = this.forced || this.requiredForRoute();
		if (shouldShow) {
			this.refs.modal?.open();
		} else {
			this.refs.modal?.close();
		}
	}
	handleWalletState(domEvent) {
		// If a wallet just loaded or was created, drop any forced state.
		const phase = domEvent?.detail?.data?.phase;
		if (phase === 'loaded' || phase === 'created') {
			this.forced = false;
			this.assignState({
				forcedReason: '',
			});
		}
		this.evaluateVisibility();
	}
	handleRouteChange() {
		this.evaluateVisibility();
	}
	forceOpen(reason = '') {
		const info = this.global.wallet ?? {};
		if (info.hasWallet) {
			return;
		}
		this.forced = true;
		this.assignState({
			forcedReason: reason || '',
		});
		this.refs.modal?.open();
	}
	handleClose() {
		this.forced = false;
		this.assignState({
			forcedReason: '',
		});
		this.refs.modal?.close();
	}
	handleCreateSave() {
		this.refs.modal?.close();
		this.emit('wallet:create-save', {
			profileMeta: this.global.profile ?? {},
		});
	}
	handleCreate() {
		this.refs.modal?.close();
		this.emit('wallet:create', {
			profileMeta: this.global.profile ?? {},
		});
	}
	handleLoad() {
		this.refs.modal?.close();
		this.emit('open-settings', {
			section: 'wallet-load',
		});
	}
	handleThumbClick() {
		this.refs.thumb_modal?.open();
	}
	subtitleText() {
		if (this.state.forcedReason) {
			return this.state.forcedReason;
		}
		if (this.state.hasSaved) {
			return '// SAVED PROFILE REQUIRES PASSWORD OR LOAD';
		}
		return '// NO WALLET DETECTED';
	}
	statusCopy() {
		if (this.state.forcedReason) {
			return `${this.state.forcedReason} Create a fresh wallet or load a saved profile to continue.`;
		}
		if (this.state.hasSaved) {
			return 'A saved profile exists but isn\'t loaded yet. Load a profile or create a new wallet to continue.';
		}
		return 'No wallet has been saved locally yet. Create & save a wallet to auto-load it on every visit, mint an ephemeral one for this session, or load a saved profile.';
	}
	render() {
		this.html`
			<ui-modal #modal .state=${this.state.modal} style="--ui-modal-max-width: 720px">
				<div class="wo-shell">
					<div class="wo-hero">
						<span class="wo-glyph" aria-hidden="true">
						<svg class="wo-mark" viewBox="0 0 64 64" fill="none" stroke-width="5.5" stroke-linecap="square" stroke-linejoin="miter">
							<defs>
								<linearGradient id="wo-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
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
							<path class="wo-leg wo-leg-left" fill="url(#wo-grad)" d="M 11.54 15.23 L 16.46 12.77 L 32.8 43.85 L 32 56.14 Z"></path>
							<path class="wo-leg wo-leg-right" fill="url(#wo-grad)" d="M 52.46 15.23 L 47.54 12.77 L 31.2 43.85 L 32 56.14 Z"></path>
							<line class="wo-dash" stroke="url(#wo-grad)" x1="16" y1="32" x2="48" y2="32"></line>
						</svg>
					</span>
						<div class="wo-hero-text">
							<header class="wo-head">
								<span class="wo-id">⩝VIAT</span>
								<span class="wo-title">${this.subtitleText}</span>
							</header>
							<p class="wo-tagline">Transitory post-quantum cryptocurrency.</p>
						</div>
					</div>
					<p class="wo-intro">
						<button type="button" class="wo-thumb" @click=${this.handleThumbClick} aria-label="Open HD seed diagram">
							<img src="./HDSeed.png" alt="HD seed tree diagram" draggable="false">
						</button>
						<strong>VIAT</strong> is the first <em>transitory</em> post-quantum cryptocurrency — a chain that
						protects legacy <code>ed25519</code> wallets <strong>automatically</strong> through built-in
						post-quantum <code>Dilithium</code> trapdoors, without forcing the throughput cost of post-quantum signatures on every
						transaction. Your wallets stay fast today and quantum-safe tomorrow.
					</p>
					<ul class="wo-bullets">
						<li><span class="wo-bullet-key">Now</span>ed25519 keys with a built-in post-quantum trapdoor.</li>
						<li><span class="wo-bullet-key">Later</span>Activate trapdoor — no migration, no lost funds same wallet address.</li>
					</ul>
					<p class="wo-status">${this.statusCopy}</p>
					<div class="wo-actions">
						<button #create_wallet_save class="wo-btn wo-btn-primary" @click=${this.handleCreateSave}>CREATE &amp; SAVE WALLET</button>
						<button class="wo-btn" @click=${this.handleCreate}>CREATE WALLET</button>
						<button class="wo-btn" @click=${this.handleLoad}>LOAD PROFILE</button>
					</div>
					<a class="wo-readmore" href="https://viat.network" target="_blank" rel="noopener noreferrer external">Read more about VIAT →</a>
					<ui-whitebox-modal #thumb_modal .state=${this.state.thumbModal}></ui-whitebox-modal>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('wallet-onboarding', WalletOnboarding);
