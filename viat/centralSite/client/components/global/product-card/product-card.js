/*
	DESCRIPTION: ui-product-card — product tile: media, heading, price, qty, add.
	Composes ui-price, ui-number-stepper, ui-button, ui-badge, ui-rating,
	ui-toggle-group (size chips), ui-swatch-group (colour). A `media[]` array
	adopts ui-media-stage (prev/next/dots, fit=cover) plus ui-gallery-thumb;
	the named media slot remains the single-image fallback.
	── VARIANTS ──────────────────────────────────────────────
	One component, five layouts, switchable AT RUNTIME:
	  tile     default — media on top, body, actions beneath
	  compact  horizontal row for lists — small media, body, price
	  overlay  media fills the card, content over a scrim
	  game     large cover-art card with meta, tags and a prominent CTA
	  split    two-panel: media column | body + actions (CSS grid, same tree)
	The variant rides as `data-variant` and the LAYOUT IS CSS. There is one markup
	tree; optional parts sit in the DOM behind `?hidden` and each variant reveals
	what it needs. That is deliberately NOT a template per variant: a branch would
	remount the subtree — losing qty, focus and any in-flight animation — every
	time the variant changed, and a raw inline html branch is value-only and would
	go stale. A data attribute re-lays-out instantly and stays reactive, which is
	what "change on the fly" has to mean.
	── EVENTS ──────────────────────────────────────────────────
	  product-card:add { id, qty }
	  product-card:option { name, value }   size | color
	  product-card:media { index, item }
	  product-card:favourite { id, favourite }
	  product-card:action { id, icon }
	── USAGE ──────────────────────────────────────────────────
	  <ui-product-card .state.heading=${'Atlas Tee'} .state.amount=${48} @product-card:add=${this.onAdd}>
	    <ui-image slot="media" .state.src=${'/images/bg.png'} .state.alt=${'Atlas Tee'}></ui-image>
	  </ui-product-card>
	  <ui-product-card .state.variant=${'game'} .state.heading=${'Sector Nine'}
	    .state.tags=${['Co-op', 'Roguelike']} .state.rating=${'4.8'}></ui-product-card>
*/
import '../badge/badge.js';
import '../button/button.js';
import '../icon-button/icon-button.js';
import '../media-stage/media-stage.js';
import '../number-stepper/number-stepper.js';
import '../price/price.js';
import '../rating/rating.js';
import '../swatch-group/swatch-group.js';
import '../toggle-group/toggle-group.js';
import { html, WebComponent } from 'webcomponent';
import { UIGalleryThumb } from '../gallery-thumb/gallery-thumb.js';
const VARIANTS = new Set([
	'tile',
	'compact',
	'overlay',
	'game',
	'split',
]);
/* Variants that hand the buyer a quantity before they add. A compact list row
   and a cover-art game card both commit a single unit instead. */
const STEPPER_VARIANTS = new Set([
	'tile',
	'overlay',
	'split',
]);
export class UIProductCard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		productCard: './product-card.css',
	};
	static state = {
		id: '',
		heading: '',
		subheading: '',
		amount: 0,
		// Compare price. Null hides the strike/percent on ui-price.
		original: null,
		currency: 'USD',
		qty: 1,
		max: 99,
		addLabel: 'Add to cart',
		// tile | compact | overlay | game | split
		variant: 'tile',
		// Corner flag — 'New', '-20%', 'Pre-order'. Empty hides it.
		badge: '',
		badgeTone: 'accent',
		// game: a short meta line (studio · year · players) and a score.
		meta: '',
		rating: '',
		ratingCount: 0,
		// Size chips — ui-toggle-group items { value, label }. Empty hides the row.
		sizes: [],
		sizeValue: '',
		// Colour swatches — ui-swatch-group items { value, label, color }.
		swatches: [],
		swatchValue: '',
		// game: genre/feature chips. Plain strings.
		tags: [],
		// Carousel. Empty keeps the slotted single image. Host of stage+thumbs.
		media: [],
		mediaIndex: 0,
		showThumbs: false,
		showFavourite: false,
		favourite: false,
		actionIcon: '',
		actionTooltip: '',
	};
	onConnect() {
		this.observe([
			'media',
			'mediaIndex',
		], this.syncMediaFlags, {
			immediate: true,
		});
	}
	syncMediaFlags() {
		const items = this.state.media;
		if (!items) {
			return;
		}
		const count = items.length;
		const activeIndex = this.state.mediaIndex;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			const nextActive = index === activeIndex;
			if (item.active !== nextActive) {
				item.active = nextActive;
			}
			if (item.thumbIndex !== index) {
				item.thumbIndex = index;
			}
		}
	}
	resolvedVariant() {
		return VARIANTS.has(this.state.variant) ? this.state.variant : 'tile';
	}
	showStepper() {
		return STEPPER_VARIANTS.has(this.resolvedVariant());
	}
	stepperHidden() {
		return !this.showStepper();
	}
	badgeHidden() {
		return !this.state.badge;
	}
	subHidden() {
		return !this.state.subheading;
	}
	metaHidden() {
		return !this.state.meta;
	}
	ratingHidden() {
		return !this.state.rating;
	}
	sizesHidden() {
		return !this.state.sizes?.length;
	}
	swatchesHidden() {
		return !this.state.swatches?.length;
	}
	optionsHidden() {
		return this.sizesHidden() && this.swatchesHidden();
	}
	tagsHidden() {
		return !this.state.tags?.length;
	}
	mediaCount() {
		return this.state.media?.length || 0;
	}
	stageHidden() {
		return this.mediaCount() === 0;
	}
	slotMediaHidden() {
		return this.mediaCount() > 0;
	}
	thumbsHidden() {
		if (!this.state.showThumbs || this.mediaCount() < 2) {
			return true;
		}
		const variant = this.resolvedVariant();
		return variant === 'compact' || variant === 'overlay';
	}
	mediaNavShown() {
		return this.mediaCount() >= 2 && this.resolvedVariant() !== 'compact';
	}
	currentSrc() {
		return this.state.media[this.state.mediaIndex]?.src || '';
	}
	currentAlt() {
		const item = this.state.media[this.state.mediaIndex];
		return item?.alt || item?.label || '';
	}
	mediaKey(item, index) {
		return item.id ?? item.src ?? index;
	}
	favouriteHidden() {
		return !this.state.showFavourite;
	}
	actionHidden() {
		return !this.state.actionIcon;
	}
	indexOfMedia(src, id) {
		const items = this.state.media;
		const count = items.length;
		if (id) {
			for (let index = 0; index < count; index += 1) {
				if (String(items[index].id) === String(id)) {
					return index;
				}
			}
		}
		for (let index = 0; index < count; index += 1) {
			if (items[index].src === src) {
				return index;
			}
		}
		return -1;
	}
	stepMedia(delta) {
		const count = this.mediaCount();
		if (count === 0) {
			return;
		}
		const next = (this.state.mediaIndex + delta + count) % count;
		this.state.mediaIndex = next;
		this.emit('product-card:media', {
			index: next,
			item: this.state.media[next],
		});
	}
	/* Light row — plain values only, no behaviours. */
	tagChip(tag) {
		return html`<li class="product-card-tag">${tag}</li>`;
	}
	handleQty(domEvent) {
		const value = Number(domEvent.detail?.data?.value);
		if (Number.isFinite(value)) {
			this.state.qty = value;
		}
	}
	handleAdd() {
		this.emit('product-card:add', {
			id: this.state.id,
			/* A variant with no stepper always commits one unit, whatever a previous
			   variant left behind in `qty`. */
			qty: this.showStepper() ? this.state.qty : 1,
		});
	}
	handleSize(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value === undefined || value === null) {
			return;
		}
		this.state.sizeValue = value;
		this.emit('product-card:option', {
			name: 'size',
			value,
		});
	}
	handleColor(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value === undefined || value === null) {
			return;
		}
		this.state.swatchValue = value;
		this.emit('product-card:option', {
			name: 'color',
			value,
		});
	}
	handleMediaPrev() {
		this.stepMedia(-1);
	}
	handleMediaNext() {
		this.stepMedia(1);
	}
	handleMediaDot(domEvent) {
		const index = Number(domEvent.detail?.data?.index);
		if (!Number.isFinite(index) || !this.state.media[index]) {
			return;
		}
		this.state.mediaIndex = index;
		this.emit('product-card:media', {
			index,
			item: this.state.media[index],
		});
	}
	handleThumbSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = this.indexOfMedia(data.src, data.id);
		if (index < 0) {
			return;
		}
		this.state.mediaIndex = index;
		this.emit('product-card:media', {
			index,
			item: this.state.media[index],
		});
	}
	handleFavourite() {
		const next = this.state.favourite !== true;
		this.state.favourite = next;
		this.emit('product-card:favourite', {
			id: this.state.id,
			favourite: next,
		});
	}
	handleAction() {
		this.emit('product-card:action', {
			id: this.state.id,
			icon: this.state.actionIcon,
		});
	}
	render() {
		this.html`
			<article class="product-card" data-variant=${this.resolvedVariant()}>
				<div class="product-card-media">
					<div class="product-card-slot" ?hidden=${this.slotMediaHidden}>
						<slot name="media"></slot>
					</div>
					<ui-media-stage
						class="product-card-stage"
						?hidden=${this.stageHidden}
						.state.src=${this.currentSrc}
						.state.alt=${this.currentAlt}
						.state.showNav=${this.mediaNavShown}
						.state.showDots=${this.mediaNavShown}
						.state.dotCount=${this.mediaCount}
						.state.activeIndex=${this.state.mediaIndex}
						.state.fit=${'cover'}
						@media-stage:prev=${this.handleMediaPrev}
						@media-stage:next=${this.handleMediaNext}
						@media-stage:dot=${this.handleMediaDot}></ui-media-stage>
					<div class="product-card-thumbs" ?hidden=${this.thumbsHidden} @gallery-thumb:select=${this.handleThumbSelect}>
						${this.list('media', UIGalleryThumb, this.mediaKey)}
					</div>
					<ui-icon-button
						class="product-card-fav"
						?hidden=${this.favouriteHidden}
						.state.icon=${'heart'}
						.state.active=${this.state.favourite}
						.state.tooltip=${'Favourite'}
						.state.size=${'sm'}
						.state.circle=${true}
						@icon-button:click=${this.handleFavourite}></ui-icon-button>
					<ui-badge
						class="product-card-badge"
						?hidden=${this.badgeHidden}
						.state.label=${this.state.badge}
						.state.tone=${this.state.badgeTone}
						.state.size=${'sm'}
						.state.surface=${'glass'}></ui-badge>
				</div>
				<div class="product-card-body">
					<h3 class="product-card-heading">${this.state.heading}</h3>
					<p class="product-card-sub" ?hidden=${this.subHidden}>${this.state.subheading}</p>
					<p class="product-card-meta" ?hidden=${this.metaHidden}>${this.state.meta}</p>
					<ul class="product-card-tags" ?hidden=${this.tagsHidden}>${this.list('tags', this.tagChip)}</ul>
					<div class="product-card-options" ?hidden=${this.optionsHidden}>
						<ui-toggle-group
							class="product-card-sizes"
							?hidden=${this.sizesHidden}
							.state.items=${this.state.sizes}
							.state.value=${this.state.sizeValue}
							.state.size=${'sm'}
							.state.overflow=${'wrap'}
							@toggle-group:change=${this.handleSize}></ui-toggle-group>
						<ui-swatch-group
							class="product-card-swatches"
							?hidden=${this.swatchesHidden}
							.state.items=${this.state.swatches}
							.state.value=${this.state.swatchValue}
							.state.size=${'sm'}
							@swatch-group:change=${this.handleColor}></ui-swatch-group>
					</div>
					<div class="product-card-price-row">
						<ui-price .state.amount=${this.state.amount} .state.original=${this.state.original} .state.currency=${this.state.currency} .state.size=${'md'}></ui-price>
						<ui-rating
							class="product-card-rating"
							?hidden=${this.ratingHidden}
							.state.value=${this.state.rating}
							.state.count=${this.state.ratingCount}
							.state.size=${'sm'}></ui-rating>
					</div>
				</div>
				<div class="product-card-actions">
					<ui-number-stepper
							?hidden=${this.stepperHidden}
							.state.value=${this.state.qty}
							.state.min=${1}
							.state.max=${this.state.max}
							.state.label=${'Quantity'}
							@number-stepper:change=${this.handleQty}></ui-number-stepper>
					<ui-button
						class="product-card-cta"
						.state.label=${this.state.addLabel}
						.state.tone=${'primary'}
						.state.size=${'sm'}
						@button:click=${this.handleAdd}></ui-button>
					<ui-icon-button
						class="product-card-action"
						?hidden=${this.actionHidden}
						.state.icon=${this.state.actionIcon}
						.state.tooltip=${this.state.actionTooltip}
						.state.size=${'sm'}
						.state.variant=${'solid'}
						.state.tone=${'primary'}
						@icon-button:click=${this.handleAction}></ui-icon-button>
				</div>
			</article>
		`;
	}
}
customElements.define('ui-product-card', UIProductCard);
