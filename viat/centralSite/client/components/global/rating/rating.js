/*
	DESCRIPTION: ui-rating — star rating with numeric value and optional review
	count. Read-only by default; interactive rate-it snaps to full or half stars.
	Consumable standalone — product-card is one caller, not the owner.
	── VARIANTS ──────────────────────────────────────────────
	  stars      default — glyph row + numeric value + (count)
	  medallion  compact score chip (the 4.5 score mark)
	── EVENTS ──────────────────────────────────────────────────
	  rating:change { value }   interactive commit (pointer or keyboard)
	── USAGE ──────────────────────────────────────────────────
	  <ui-rating .state.value=${4.56} .state.count=${125}></ui-rating>
	  <ui-rating .state.value=${4.5} .state.variant=${'medallion'}></ui-rating>
	  <ui-rating .state.value=${3} .state.interactive=${true}
	    .state.precision=${'half'} @rating:change=${this.onRate}></ui-rating>
*/
import '../icon/icon.js';
import { html, WebComponent } from 'webcomponent';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
const VARIANTS = new Set([
	'stars',
	'medallion',
]);
const PRECISIONS = new Set([
	'full',
	'half',
]);
const DEFAULT_MAX = 5;
function starItems(max) {
	const items = [];
	const count = max;
	for (let index = 0; index < count; index += 1) {
		items.push({
			id: `s${index}`,
		});
	}
	return items;
}
export class UIRating extends WebComponent {
	static url = import.meta.url;
	static styles = {
		rating: './rating.css',
	};
	static state = {
		value: 0,
		max: DEFAULT_MAX,
		count: 0,
		size: 'md',
		interactive: false,
		precision: 'half',
		variant: 'stars',
		label: 'Rating',
		stars: starItems(DEFAULT_MAX),
	};
	onConnect() {
		this.observe(['max'], this.syncStars);
		this.syncStars();
	}
	resolvedMax() {
		const max = Number(this.state.max);
		if (!Number.isFinite(max) || max < 1) {
			return DEFAULT_MAX;
		}
		return Math.round(max);
	}
	resolvedSize() {
		return SIZES.has(this.state.size) ? this.state.size : 'md';
	}
	resolvedVariant() {
		return VARIANTS.has(this.state.variant) ? this.state.variant : 'stars';
	}
	resolvedPrecision() {
		return PRECISIONS.has(this.state.precision) ? this.state.precision : 'half';
	}
	clampedValue() {
		const value = Number(this.state.value);
		if (!Number.isFinite(value)) {
			return 0;
		}
		const max = this.resolvedMax();
		if (value < 0) {
			return 0;
		}
		if (value > max) {
			return max;
		}
		return value;
	}
	fillPercent() {
		const max = this.resolvedMax();
		return (this.clampedValue() / max) * 100;
	}
	fillStyle() {
		return `--rating-fill: ${this.fillPercent()}%`;
	}
	displayValue() {
		const value = this.clampedValue();
		if (Number.isInteger(value)) {
			return String(value);
		}
		return String(Number(value.toFixed(2)));
	}
	countHidden() {
		return !(Number(this.state.count) > 0);
	}
	countLabel() {
		return `(${this.state.count})`;
	}
	ratingRole() {
		return this.state.interactive === true ? 'slider' : 'img';
	}
	ratingTabIndex() {
		return this.state.interactive === true ? '0' : undefined;
	}
	ratingLabel() {
		const heading = this.state.label || 'Rating';
		const display = this.displayValue();
		const max = this.resolvedMax();
		const count = Number(this.state.count);
		if (Number.isFinite(count) && count > 0) {
			return `${heading}: ${display} out of ${max}, ${count} reviews`;
		}
		return `${heading}: ${display} out of ${max}`;
	}
	valueNow() {
		return String(this.clampedValue());
	}
	valueMin() {
		return '0';
	}
	valueMax() {
		return String(this.resolvedMax());
	}
	syncStars() {
		const max = this.resolvedMax();
		const stars = this.state.stars;
		if (Array.isArray(stars) && stars.length === max) {
			return;
		}
		this.state.stars = starItems(max);
	}
	snapValue(raw) {
		const max = this.resolvedMax();
		let next = Number(raw);
		if (!Number.isFinite(next)) {
			next = 0;
		}
		if (next < 0) {
			next = 0;
		}
		if (next > max) {
			next = max;
		}
		const step = this.resolvedPrecision() === 'full' ? 1 : 0.5;
		return Math.round(next / step) * step;
	}
	commitValue(raw) {
		const next = this.snapValue(raw);
		if (next === Number(this.state.value)) {
			return;
		}
		this.state.value = next;
		this.emit('rating:change', {
			value: next,
		});
	}
	commitFromPoint(clientX) {
		const track = this.refs.track;
		if (!track) {
			return;
		}
		const rect = track.getBoundingClientRect();
		const width = rect.width;
		if (width <= 0) {
			return;
		}
		let ratio = (clientX - rect.left) / width;
		if (getComputedStyle(track).direction === 'rtl') {
			ratio = 1 - ratio;
		}
		if (ratio < 0) {
			ratio = 0;
		}
		if (ratio > 1) {
			ratio = 1;
		}
		this.commitValue(ratio * this.resolvedMax());
	}
	handlePointerDown(domEvent) {
		if (this.state.interactive !== true) {
			return;
		}
		if (domEvent.button !== 0) {
			return;
		}
		domEvent.preventDefault();
		this.commitFromPoint(domEvent.clientX);
	}
	handleKey(domEvent) {
		if (this.state.interactive !== true) {
			return;
		}
		const step = this.resolvedPrecision() === 'full' ? 1 : 0.5;
		switch (domEvent.key) {
			case 'ArrowRight':
			case 'ArrowUp': {
				domEvent.preventDefault();
				this.commitValue(this.clampedValue() + step);
				break;
			}
			case 'ArrowLeft':
			case 'ArrowDown': {
				domEvent.preventDefault();
				this.commitValue(this.clampedValue() - step);
				break;
			}
			case 'Home': {
				domEvent.preventDefault();
				this.commitValue(0);
				break;
			}
			case 'End': {
				domEvent.preventDefault();
				this.commitValue(this.resolvedMax());
				break;
			}
			default: {
				break;
			}
		}
	}
	starMark() {
		return html`<span class="rating-star" aria-hidden="true"><ui-icon .state.name=${'star'}></ui-icon></span>`;
	}
	render() {
		this.html`
			<div
				class="rating"
				data-size=${this.resolvedSize}
				data-variant=${this.resolvedVariant}
				?data-interactive=${this.state.interactive === true}>
				<div
					class="rating-stars"
					#track
					style=${this.fillStyle}
					role=${this.ratingRole}
					tabindex=${this.ratingTabIndex}
					aria-label=${this.ratingLabel}
					aria-valuemin=${this.valueMin}
					aria-valuemax=${this.valueMax}
					aria-valuenow=${this.valueNow}
					@pointerdown=${this.handlePointerDown}
					@keydown=${this.handleKey}>
					<div class="rating-base">${this.each(this.state.stars, this.starMark)}</div>
					<div class="rating-fill">
						<div class="rating-fill-inner">${this.each(this.state.stars, this.starMark)}</div>
					</div>
				</div>
				<span class="rating-medallion" aria-hidden="true">${this.displayValue}</span>
				<span class="rating-value">${this.displayValue}</span>
				<span class="rating-count" ?hidden=${this.countHidden}>${this.countLabel}</span>
			</div>
		`;
	}
}
customElements.define('ui-rating', UIRating);
