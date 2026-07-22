/*
	DESCRIPTION: ui-avatar — a user/entity avatar. Renders an image when `src` is set,
	otherwise initials on a deterministic colour derived from `name` (same name → same
	hue, every render). Optional status dot (online/away/busy/offline → tone tokens).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-avatar .state.src=${'/u/42.png'} .state.name=${'Ada Lovelace'} .state.size=${'lg'}></ui-avatar>
	  <ui-avatar .state.name=${'0xA1f2…c4'} .state.shape=${'square'} .state.status=${'online'}></ui-avatar>
	  <ui-avatar .state.initials=${'AL'}></ui-avatar>   (explicit initials override)
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
const SIZES = new Set([
	'xs',
	'sm',
	'md',
	'lg',
]);
const STATUS_TONES = new Map([
	['online', 'success'],
	['away', 'warning'],
	['busy', 'danger'],
	['offline', 'neutral'],
]);
/* Up to two leading characters of the first two words (or the first two of one). */
function initialsFor(fullName) {
	const words = String(fullName ?? '').trim().split(/\s+/)
		.filter(Boolean);
	if (words.length === 0) {
		return '';
	}
	if (words.length === 1) {
		return words[0].slice(0, 2).toUpperCase();
	}
	return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
/* Deterministic hue 0..359 from a string (stable across renders/sessions). */
function hueFor(value) {
	const text = String(value ?? '');
	let hash = 0;
	for (let index = 0; index < text.length; index += 1) {
		hash = ((hash * 31) + text.charCodeAt(index)) % 360;
	}
	return hash;
}
export class UIAvatar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		avatar: './avatar.css',
	};
	static state = {
		src: '',
		name: '',
		initials: '',
		size: 'md',
		shape: 'circle',
		status: '',
	};
	render() {
		this.html`
			<div class="av" data-size=${SIZES.has(this.state.size) ? this.state.size : 'md'} data-shape=${this.state.shape === 'square' ? 'square' : 'circle'}>
				${() => {
					const src = String(this.state.src ?? '').trim();
					if (src !== '') {
						return this.htmlElement`<img class="av-img" src=${src} alt=${this.state.name || 'avatar'} loading="lazy">`;
					}
					const initials = this.state.initials || initialsFor(this.state.name);
					const hue = hueFor(this.state.name || this.state.initials);
					return this.htmlElement`<span class="av-initials" style=${`background:oklch(0.62 0.13 ${hue})`} aria-hidden="true">${initials}</span>`;
				}}
				${() => {
					const tone = STATUS_TONES.get(String(this.state.status));
					if (!tone) {
						return '';
					}
					return this.htmlElement`<span class="av-status" data-tone=${tone} tooltip=${this.state.status} role="img" aria-label=${this.state.status}></span>`;
				}}
			</div>
		`;
	}
}
customElements.define('ui-avatar', UIAvatar);
