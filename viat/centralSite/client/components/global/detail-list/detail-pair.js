/*
	One label→value row in a <ui-detail-list>. Its own custom element so a copyable
	pair owns its copy button + transient "copied" flash WITHOUT the parent reaching
	across rows with `closest()`. Receives its pair as-is ({label, value, mono?,
	copy?}); a `copy: true` pair turns its value into a click-to-copy control via the
	framework `copyText` (Promise<boolean> — flashes only on a real success).
*/
import { WebComponent } from 'webcomponent';
const COPY_FLASH_MS = 1200;
export class UIDetailPair extends WebComponent {
	static url = import.meta.url;
	static styles = {
		detailPair: './detail-pair.css',
	};
	static state = {
		label: '',
		value: '',
		mono: false,
		copy: false,
		copied: false,
	};
	async handleCopy() {
		const accepted = await this.copyText(String(this.state.value ?? ''));
		if (accepted !== true) {
			return;
		}
		this.state.copied = true;
		this.setTimeout(() => {
			this.state.copied = false;
		}, COPY_FLASH_MS);
	}
	render() {
		if (this.state.copy === true) {
			this.html`
				<dt class="dtl-label">${this.state.label}</dt>
				<dd class="dtl-value" ?data-mono=${this.state.mono}>
					<button #button type="button" class="dtl-copy" ?data-copied=${this.state.copied}
						aria-label=${`Copy ${this.state.label}`}
						@click=${this.handleCopy}>
						${this.state.value}<span class="dtl-copy-hint">${this.state.copied ? 'copied' : 'copy'}</span>
					</button>
				</dd>
			`;
			return;
		}
		this.html`
			<dt class="dtl-label">${this.state.label}</dt>
			<dd class="dtl-value" ?data-mono=${this.state.mono}>${this.state.value}</dd>
		`;
	}
}
customElements.define('ui-detail-pair', UIDetailPair);
