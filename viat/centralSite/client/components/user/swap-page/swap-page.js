import '../../global/icon/icon.js';
import { WebComponent } from '../../core/index.js';
const DEFAULT_RATE_VIAT_PER_BTC = 250000;
const ASSETS = {
	VIAT: {
		symbol: 'VIAT',
		glyph: '⩝',
	},
	BTC: {
		symbol: 'BTC',
		icon: 'bitcoin',
	},
};
function parseAmount(text) {
	if (!text) {
		return 0;
	}
	const cleaned = String(text).replace(/[^0-9.]/g, '');
	const value = Number(cleaned);
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}
	return value;
}
function formatAmount(value) {
	if (!value || value <= 0) {
		return '0';
	}
	const rounded = Math.round(value * 100000000) / 100000000;
	if (rounded < 0.0001) {
		return rounded.toExponential(2);
	}
	if (rounded < 1) {
		return rounded.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
	}
	return rounded.toLocaleString('en-US', {
		maximumFractionDigits: 6,
	});
}
export class SwapPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		swapPage: './swap-page.css',
	};
	static state = {
		fromSymbol: 'VIAT',
		toSymbol: 'BTC',
		fromAmount: '',
		ratePerBtc: DEFAULT_RATE_VIAT_PER_BTC,
		status: '',
		statusTone: '',
	};
	get fromAsset() {
		return ASSETS[this.state.fromSymbol];
	}
	get toAsset() {
		return ASSETS[this.state.toSymbol];
	}
	get fromAmountNumber() {
		return parseAmount(this.state.fromAmount);
	}
	get toAmountValue() {
		const amount = this.fromAmountNumber;
		const rate = this.state.ratePerBtc;
		if (!rate) {
			return 0;
		}
		if (this.state.fromSymbol === 'VIAT') {
			return amount / rate;
		}
		return amount * rate;
	}
	get formattedToAmount() {
		return formatAmount(this.toAmountValue);
	}
	get rateLineText() {
		const rate = this.state.ratePerBtc;
		if (!rate) {
			return '—';
		}
		return `1 BTC ≈ ${formatAmount(rate)} VIAT`;
	}
	renderAssetGlyph(asset) {
		if (asset.glyph) {
			return this.htmlElement `<span class="sp-glyph">${asset.glyph}</span>`;
		}
		return this.htmlElement `<ui-icon class="sp-icon" .name=${'bitcoin'} .size=${'md'}></ui-icon>`;
	}
	flipDirection() {
		const next = this.state.fromSymbol === 'VIAT' ? 'BTC' : 'VIAT';
		this.state.fromSymbol = next;
		this.state.toSymbol = next === 'VIAT' ? 'BTC' : 'VIAT';
		this.state.fromAmount = '';
		this.state.status = '';
	}
	handleFlip() {
		this.flipDirection();
	}
	handleExecute() {
		const amount = this.fromAmountNumber;
		if (!amount) {
			this.state.statusTone = 'error';
			this.state.status = 'Enter an amount to swap.';
			return;
		}
		this.state.statusTone = 'success';
		this.state.status = `Quote locked: ${formatAmount(amount)} ${this.state.fromSymbol} → ${this.formattedToAmount} ${this.state.toSymbol}`;
	}
	renderFromCard() {
		const asset = this.fromAsset;
		return this.htmlElement `
			<section class="sp-card sp-card-from">
				<div class="sp-card-head">
					<span class="sp-card-label">FROM</span>
					<span class="sp-balance">balance —</span>
				</div>
				<div class="sp-card-row">
					<input
						class="sp-amount"
						type="text"
						inputmode="decimal"
						placeholder="0.0"
						spellcheck="false"
						autocomplete="off"
						$value="fromAmount">
					<div class="sp-asset">
						${this.renderAssetGlyph(asset)}
						<span class="sp-asset-symbol">${asset.symbol}</span>
					</div>
				</div>
			</section>
		`;
	}
	renderFlipButton() {
		return this.htmlElement `
			<button class="sp-flip" @click=${this.handleFlip} aria-label="Flip swap direction" tooltip="Flip direction">
				<ui-icon class="sp-flip-icon" .name=${'arrow-up-down'} .size=${'md'}></ui-icon>
			</button>
		`;
	}
	renderToCard() {
		const asset = this.toAsset;
		return this.htmlElement `
			<section class="sp-card sp-card-to">
				<div class="sp-card-head">
					<span class="sp-card-label">TO</span>
					<span class="sp-balance">balance —</span>
				</div>
				<div class="sp-card-row">
					<div class="sp-amount sp-amount-out">${this.formattedToAmount}</div>
					<div class="sp-asset">
						${this.renderAssetGlyph(asset)}
						<span class="sp-asset-symbol">${asset.symbol}</span>
					</div>
				</div>
			</section>
		`;
	}
	render() {
		this.html `
			<div class="sp-shell">
				<div class="sp-frame">
					<header class="sp-header">
						<span class="sp-id">SWAP</span>
						<span class="sp-title">// VIAT ⇄ BTC</span>
					</header>
					${this.renderFromCard}
					<div class="sp-flip-row">${this.renderFlipButton}</div>
					${this.renderToCard}
					<div class="sp-rate">RATE · <span class="sp-rate-value">${this.rateLineText}</span></div>
					<button class="sp-execute" @click=${this.handleExecute}>EXECUTE SWAP</button>
					<div class="sp-status" data-tone=${this.state.statusTone || 'idle'} ?data-visible=${this.state.status}>${this.state.status}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('swap-page', SwapPage);
