/*
	DESCRIPTION: ui-aspect-ratio — locks slotted content to a ratio.
	ratio is a number (16/9 → 1.777…) or "W/H" string.
*/
import { WebComponent } from 'webcomponent';
export class UIAspectRatio extends WebComponent {
	static url = import.meta.url;
	static styles = {
		aspectRatio: './aspect-ratio.css',
	};
	static state = {
		// Number or "16/9" string.
		ratio: '16/9',
	};
	ratioStyle() {
		const raw = this.state.ratio;
		if (typeof raw === 'number' && raw > 0) {
			return `aspect-ratio:${raw}`;
		}
		const text = String(raw || '16/9').trim();
		if (text.includes('/')) {
			const [
				w,
				h,
			] = text.split('/');
			const width = Number(w);
			const height = Number(h);
			if (width > 0 && height > 0) {
				return `aspect-ratio:${width} / ${height}`;
			}
		}
		const num = Number(text);
		if (num > 0) {
			return `aspect-ratio:${num}`;
		}
		return 'aspect-ratio:16 / 9';
	}
	render() {
		this.html`
			<div class="ar" style=${this.ratioStyle}>
				<div class="ar-inner"><slot></slot></div>
			</div>
		`;
	}
}
customElements.define('ui-aspect-ratio', UIAspectRatio);
