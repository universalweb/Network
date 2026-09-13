/*
	DESCRIPTION: ui-avatar — a user/entity avatar. Renders an image when `src` is set,
	otherwise initials on a deterministic colour derived from `name` (same name → same
	hue, every render). Optional status dot (online/away/busy/offline → tone tokens).
	Optional role badge (admin/mod/user preset, or a free Lucide icon name + tone) —
	sits opposite the status dot. `badge` is the state key (`role` is forbidden).
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-avatar .state.src=${'/u/42.png'} .state.name=${'Ada Lovelace'} .state.size=${'lg'}></ui-avatar>
	  <ui-avatar .state.name=${'0xA1f2…c4'} .state.shape=${'square'} .state.status=${'online'}></ui-avatar>
	  <ui-avatar .state.name=${'Ada'} .state.badge=${'admin'} .state.status=${'online'}></ui-avatar>
	  <ui-avatar .state.initials=${'AL'} .state.badge=${'crown'} .state.badgeTone=${'warning'}></ui-avatar>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
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
const BADGE_PRESETS = new Map([
	[
		'admin',
		{
			icon: 'shield-check',
			tone: 'danger',
			label: 'admin',
		},
	],
	[
		'mod',
		{
			icon: 'shield',
			tone: 'info',
			label: 'mod',
		},
	],
	[
		'user',
		{
			icon: 'user',
			tone: 'neutral',
			label: 'user',
		},
	],
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
function resolveBadge(badge, toneOverride) {
	const key = String(badge ?? '').trim();
	if (key === '') {
		return null;
	}
	const preset = BADGE_PRESETS.get(key);
	const tone = String(toneOverride ?? '').trim();
	if (preset) {
		return {
			icon: preset.icon,
			tone: tone || preset.tone,
			label: preset.label,
		};
	}
	return {
		icon: key,
		tone: tone || 'accent',
		label: key,
	};
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
		badge: '',
		badgeTone: '',
		/*
		 * The src that FAILED to load, or '' while none has. Reactive because the
		 * face is chosen from it; a plain field would change without repainting.
		 *
		 * Storing the failed URL rather than a status enum is what makes a swapped
		 * photo recover by itself: the comparison in showImage() stops matching the
		 * moment `src` changes, so a new image gets a fresh attempt with no reset
		 * step to run and no render-ordering to get right. An 'error' FLAG needs
		 * clearing at exactly the right point in the pass, which is the bug this
		 * shape removes rather than solves.
		 */
		failedSrc: '',
	};
	handleImageLoad() {
		this.emit('avatar:load-change', {
			state: 'ready',
			src: this.state.src,
		});
	}
	/*
	 * A broken src falls back to the initials face this component already knows
	 * how to draw, rather than painting the browser's broken-image glyph. The
	 * event lets a consumer swap in its own placeholder or log the bad URL.
	 */
	handleImageError(domEvent) {
		const src = String(domEvent?.currentTarget?.getAttribute('src') ?? this.state.src ?? '').trim();
		if (src === '' || this.state.failedSrc === src) {
			return;
		}
		this.state.failedSrc = src;
		this.emit('avatar:load-change', {
			state: 'error',
			src,
		});
	}
	/*
	 * The image is the face UNLESS this exact src has failed — not "once it has
	 * loaded". Gating on a load event would leave a cached photo (no event on
	 * some paths) hidden behind initials forever, with an <img> no screen reader
	 * can see. Failure is the exceptional case, so failure is what is tested for.
	 */
	showImage() {
		const src = String(this.state.src ?? '').trim();
		return src !== '' && this.state.failedSrc !== src;
	}
	/*
	 * The two faces are SEPARATE spots, not one method returning both. A content
	 * spot mounts a single element, so returning two siblings from one
	 * htmlElement silently drops them — the <img> never reached the tree at all.
	 *
	 * The image must stay MOUNTED while a src is set (hidden, not removed) so it
	 * can load and so a failure can be observed; removing it would mean the error
	 * that triggers the fallback could never fire.
	 */
	imageView() {
		const src = String(this.state.src ?? '').trim();
		if (src === '') {
			return '';
		}
		return this.htmlElement`<img class="avatar-img" src=${src} alt=${this.state.name || 'avatar'} loading="lazy"
			?hidden=${!this.showImage()}
			@load=${this.handleImageLoad}
			@error=${this.handleImageError}>`;
	}
	initialsView() {
		if (this.showImage()) {
			return '';
		}
		const initials = this.state.initials || initialsFor(this.state.name);
		const hue = hueFor(this.state.name || this.state.initials);
		return this.htmlElement`<span class="avatar-initials" style=${`background:oklch(0.62 0.13 ${hue})`} aria-hidden="true">${initials}</span>`;
	}
	statusView() {
		const tone = STATUS_TONES.get(String(this.state.status));
		if (!tone) {
			return '';
		}
		return this.htmlElement`<span class="avatar-status" data-tone=${tone} tooltip=${this.state.status} role="img" aria-label=${this.state.status}></span>`;
	}
	badgeView() {
		const resolved = resolveBadge(this.state.badge, this.state.badgeTone);
		if (!resolved) {
			return '';
		}
		return this.htmlElement`
			<span class="avatar-badge" data-tone=${resolved.tone} tooltip=${resolved.label} role="img" aria-label=${resolved.label}>
				<ui-icon .state.name=${resolved.icon} .state.size=${'xs'}></ui-icon>
			</span>`;
	}
	render() {
		this.html`
			<div class="avatar" data-size=${SIZES.has(this.state.size) ? this.state.size : 'md'} data-shape=${this.state.shape === 'square' ? 'square' : 'circle'} ?data-image-failed=${!this.showImage() && this.state.src}>
				${this.imageView}
				${this.initialsView}
				${this.badgeView}
				${this.statusView}
			</div>
		`;
	}
}
customElements.define('ui-avatar', UIAvatar);
