import '../../global/modal/modal.js';
import { WebComponent, classList } from '../../core/index.js';
/**
 * `<wallet-info-modal>` — long-form explainer modal. Body styling
 * (head / copy / inline code) comes from the shared `modal-chrome.css`;
 * the section heading and click-to-expand figure styling are component-local.
 */
export class WalletInfoModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		modalChrome: '../shared/modal-chrome.css',
		walletInfoModal: './wallet-info-modal.css',
	};
	static state = {
		expanded: false,
	};
	open() {
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	toggleExpanded() {
		this.state.expanded = !this.state.expanded;
	}
	modalStyle() {
		const max = this.state.expanded ? 'min(1400px, calc(100vw - 32px))' : 'min(720px, calc(100vw - 32px))';
		return `--ui-modal-max-width: ${max}; --ui-modal-max-height: calc(100dvh - 32px)`;
	}
	render() {
		
		this.html `
			<ui-modal #modal .state=${{
				modal: true,
				open: false,
				showClose: true,
				showMaximize: true,
			}} style=${this.modalStyle}>
				<div class=${classList('modal-shell', () => (this.state.expanded ? 'is-expanded' : ''))}>
					<header class="modal-head">
						<span class="modal-head-id">VIAT</span>
						<span class="modal-head-title">// HOW WALLETS ARE BUILT</span>
					</header>
					<figure class="wi-figure">
						<img class="wi-img"
							src="./HDSeed.png"
							alt="VIAT HD wallet seed derivation diagram"
							title="Click to expand"
							@click=${this.toggleExpanded}>
						<figcaption class="wi-caption">${() => {
							return (this.state.expanded ? 'Click image to collapse' : 'Click image to expand');
						}}</figcaption>
					</figure>
					<p class="modal-copy">A VIAT site wallet is a <strong>post-quantum hierarchical deterministic</strong> identity. Instead of treating a private key as the root, the system builds wallets from four independent high-entropy <em>master pools</em>. Three of them are bound to scheme-specific metadata and combined into one final fixed-size seed; the fourth supplies random data for operations that need it.</p>
					<h3 class="info-section">Master entropy pools</h3>
					<p class="modal-copy">Each wallet is anchored by four secret pools — <strong>Master Seed</strong>, <strong>Master Key</strong>, <strong>Master Nonce</strong>, and <strong>Master Salt</strong>. Every pool is generated independently from multiple <em>sources</em> of entropy. The first three drive the deterministic derivation; the salt is optional and can be introduced at different points to supply random data for encryption and hashing operations that need it (Argon2id KDF, on-disk encryption nonces, etc.). Compromise of one pool doesn't unblock derivations that depend on another.</p>
					<h3 class="info-section">Vertical &amp; horizontal derivation</h3>
					<p class="modal-copy">Each derived object (pre-seed, pre-key, pre-nonce) shares a canonical base identity — id, scheme, network, version — then mixes in role-specific metadata and pulls from its own dedicated entropy pool. The transcripts are serialised with strict CBOR so the binding is canonical and reproducible.</p>
					<h3 class="info-section">KMAC combination</h3>
					<p class="modal-copy">Seed, key, and nonce derivations fold together through <code>KMAC(K, M, S)</code>: <strong>K</strong> carries secret material from the master key, <strong>M</strong> carries secret material from the master seed plus the pre-seed message, and <strong>S</strong> carries structural context plus a derived nonce. The salt is not part of this combination — it stays available as random material for downstream encryption and hashing steps that can mix it in later. The KMAC output is the final fixed-size seed used to generate the scheme's keypair (ed25519 for the primary, ML-DSA for the trapdoor).</p>
					<h3 class="info-section">Optional Argon2id guard</h3>
					<p class="modal-copy">For terminal seeds that need an extra security layer, a user-supplied secret is mixed in through <strong>Argon2id</strong> as the final step. Without that secret the derivation can't be completed — even an attacker who exfiltrates intermediate state can't produce the final keypair. This is what defends against one-shot scrape attacks in the browser.</p>
					<h3 class="info-section">Primitives</h3>
					<p class="modal-copy"><code>SHAKE-256</code> for hashing, <code>KMAC256_XOF</code> for keyed hashing, <code>Argon2id</code> for password-based hashing, <code>ed25519</code> for the primary signing key, and <code>ML-DSA</code> for the built-in post-quantum trapdoor.</p>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('wallet-info-modal', WalletInfoModal);
