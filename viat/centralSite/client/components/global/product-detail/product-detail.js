/*
	DESCRIPTION: ui-product-detail — page-scale product surface. Composes the
	card's parts (stage + thumbs, rating, price, badge, size chips, swatches,
	qty, CTA, favourite, action) plus ui-tabs and a spec definition list.
	Not a product-card variant — a larger host with its own tree.
	── PANES ─────────────────────────────────────────────────
	  overview  description copy
	  specs     key/value definition list
	Screenshot rail (`media`) drives the stage. Alternate-cover strip (`covers`)
	is a second gallery-thumb collection with its own index.
	── EVENTS ──────────────────────────────────────────────────
	  product-detail:add { id, qty }
	  product-detail:option { name, value }   size | color
	  product-detail:media { index, item }
	  product-detail:cover { index, item }
	  product-detail:favourite { id, favourite }
	  product-detail:action { id, icon }
	  product-detail:tab { id }
	── USAGE ──────────────────────────────────────────────────
	  <ui-product-detail .state.heading=${'Modern Yellow Chair'}
	    .state.amount=${420} .state.media=${shots} .state.covers=${editions}
	    .state.tabs=${[{ id: 'overview', label: 'Overview' }, { id: 'specs', label: 'Specifications' }]}
	    .state.specs=${[{ id: 'material', label: 'Material', value: 'Oak' }]}
	    @product-detail:add=${this.onAdd}></ui-product-detail>
*/
import '../badge/badge.js';
import '../button/button.js';
import '../icon-button/icon-button.js';
import '../media-stage/media-stage.js';
import '../number-stepper/number-stepper.js';
import '../price/price.js';
import '../rating/rating.js';
import '../swatch-group/swatch-group.js';
import '../tabs/tabs.js';
import '../toggle-group/toggle-group.js';
import { html, WebComponent } from 'webcomponent';
import { UIGalleryThumb } from '../gallery-thumb/gallery-thumb.js';
const OVERVIEW_TAB = 'overview';
const SPECS_TAB = 'specs';
export class UIProductDetail extends WebComponent {
	static url = import.meta.url;
	static styles = {
		productDetail: './product-detail.css',
	};
	static state = {
		id: '',
		heading: '',
		subheading: '',
		meta: '',
		description: '',
		amount: 0,
		original: null,
		currency: 'USD',
		qty: 1,
		max: 99,
		addLabel: 'Add to cart',
		badge: '',
		badgeTone: 'accent',
		rating: '',
		ratingCount: 0,
		ratingVariant: 'stars',
		sizes: [],
		sizeValue: '',
		swatches: [],
		swatchValue: '',
		media: [],
		mediaIndex: 0,
		showThumbs: true,
		covers: [],
		coverIndex: 0,
		coversLabel: '',
		tabs: [],
		tab: '',
		tabVariant: 'pill',
		specs: [],
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
		this.observe([
			'covers',
			'coverIndex',
		], this.syncCoverFlags, {
			immediate: true,
		});
		this.observe([
			'tabs',
			'tab',
		], this.syncTabSeed, {
			immediate: true,
		});
	}
	syncThumbFlags(items, activeIndex) {
		if (!items) {
			return;
		}
		const count = items.length;
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
	syncMediaFlags() {
		this.syncThumbFlags(this.state.media, this.state.mediaIndex);
	}
	syncCoverFlags() {
		this.syncThumbFlags(this.state.covers, this.state.coverIndex);
	}
	syncTabSeed() {
		if (this.state.tab) {
			return;
		}
		const items = this.state.tabs;
		if (!items?.length) {
			return;
		}
		this.state.tab = items[0].id;
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
	mediaCount() {
		return this.state.media?.length || 0;
	}
	coverCount() {
		return this.state.covers?.length || 0;
	}
	stageHidden() {
		return this.mediaCount() === 0;
	}
	slotMediaHidden() {
		return this.mediaCount() > 0;
	}
	railHidden() {
		return !this.state.showThumbs || this.mediaCount() < 2;
	}
	coversHidden() {
		return this.coverCount() === 0;
	}
	coversLabelHidden() {
		return this.coversHidden() || !this.state.coversLabel;
	}
	mediaNavShown() {
		return this.mediaCount() >= 2;
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
	coverKey(item, index) {
		return item.id ?? item.src ?? index;
	}
	specKey(item, index) {
		return item.id ?? item.label ?? index;
	}
	favouriteHidden() {
		return !this.state.showFavourite;
	}
	actionHidden() {
		return !this.state.actionIcon;
	}
	tabsHidden() {
		return !this.state.tabs?.length;
	}
	overviewHidden() {
		if (this.tabsHidden()) {
			return !this.state.description;
		}
		return this.state.tab !== OVERVIEW_TAB || !this.state.description;
	}
	specsHidden() {
		if (this.tabsHidden()) {
			return !this.state.specs?.length;
		}
		return this.state.tab !== SPECS_TAB || !this.state.specs?.length;
	}
	indexOfItem(items, src, id) {
		if (!items) {
			return -1;
		}
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
		this.emit('product-detail:media', {
			index: next,
			item: this.state.media[next],
		});
	}
	specRow(item) {
		return html`<div class="product-detail-spec"><dt>${item.label}</dt><dd>${item.value}</dd></div>`;
	}
	handleQty(domEvent) {
		const value = Number(domEvent.detail?.data?.value);
		if (Number.isFinite(value)) {
			this.state.qty = value;
		}
	}
	handleAdd() {
		this.emit('product-detail:add', {
			id: this.state.id,
			qty: this.state.qty,
		});
	}
	handleSize(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value === undefined || value === null) {
			return;
		}
		this.state.sizeValue = value;
		this.emit('product-detail:option', {
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
		this.emit('product-detail:option', {
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
		this.emit('product-detail:media', {
			index,
			item: this.state.media[index],
		});
	}
	handleThumbSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = this.indexOfItem(this.state.media, data.src, data.id);
		if (index < 0) {
			return;
		}
		this.state.mediaIndex = index;
		this.emit('product-detail:media', {
			index,
			item: this.state.media[index],
		});
	}
	handleCoverSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const index = this.indexOfItem(this.state.covers, data.src, data.id);
		if (index < 0) {
			return;
		}
		this.state.coverIndex = index;
		this.emit('product-detail:cover', {
			index,
			item: this.state.covers[index],
		});
	}
	handleFavourite() {
		const next = this.state.favourite !== true;
		this.state.favourite = next;
		this.emit('product-detail:favourite', {
			id: this.state.id,
			favourite: next,
		});
	}
	handleAction() {
		this.emit('product-detail:action', {
			id: this.state.id,
			icon: this.state.actionIcon,
		});
	}
	handleTab(domEvent) {
		const tabId = domEvent.detail?.data?.id;
		if (!tabId) {
			return;
		}
		this.state.tab = tabId;
		this.emit('product-detail:tab', {
			id: tabId,
		});
	}
	render() {
		this.html`
			<article class="product-detail">
				<div class="product-detail-hero">
					<div class="product-detail-media">
						<div class="product-detail-slot" ?hidden=${this.slotMediaHidden}>
							<slot name="media"></slot>
						</div>
						<ui-media-stage
							class="product-detail-stage"
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
						<div class="product-detail-rail" ?hidden=${this.railHidden} @gallery-thumb:select=${this.handleThumbSelect}>
							${this.list('media', UIGalleryThumb, this.mediaKey)}
						</div>
						<p class="product-detail-covers-label" ?hidden=${this.coversLabelHidden}>${this.state.coversLabel}</p>
						<div class="product-detail-covers" ?hidden=${this.coversHidden} @gallery-thumb:select=${this.handleCoverSelect}>
							${this.list('covers', UIGalleryThumb, this.coverKey)}
						</div>
						<ui-icon-button
							class="product-detail-fav"
							?hidden=${this.favouriteHidden}
							.state.icon=${'heart'}
							.state.active=${this.state.favourite}
							.state.tooltip=${'Favourite'}
							.state.size=${'sm'}
							.state.circle=${true}
							@icon-button:click=${this.handleFavourite}></ui-icon-button>
						<ui-badge
							class="product-detail-badge"
							?hidden=${this.badgeHidden}
							.state.label=${this.state.badge}
							.state.tone=${this.state.badgeTone}
							.state.size=${'sm'}
							.state.surface=${'glass'}></ui-badge>
					</div>
					<div class="product-detail-buy">
						<h2 class="product-detail-heading">${this.state.heading}</h2>
						<p class="product-detail-sub" ?hidden=${this.subHidden}>${this.state.subheading}</p>
						<p class="product-detail-meta" ?hidden=${this.metaHidden}>${this.state.meta}</p>
						<div class="product-detail-price-row">
							<ui-price .state.amount=${this.state.amount} .state.original=${this.state.original} .state.currency=${this.state.currency} .state.size=${'lg'}></ui-price>
							<ui-rating
								class="product-detail-rating"
								?hidden=${this.ratingHidden}
								.state.value=${this.state.rating}
								.state.count=${this.state.ratingCount}
								.state.variant=${this.state.ratingVariant}
								.state.size=${'md'}></ui-rating>
						</div>
						<div class="product-detail-options" ?hidden=${this.optionsHidden}>
							<ui-toggle-group
								class="product-detail-sizes"
								?hidden=${this.sizesHidden}
								.state.items=${this.state.sizes}
								.state.value=${this.state.sizeValue}
								.state.size=${'sm'}
								.state.overflow=${'wrap'}
								@toggle-group:change=${this.handleSize}></ui-toggle-group>
							<ui-swatch-group
								class="product-detail-swatches"
								?hidden=${this.swatchesHidden}
								.state.items=${this.state.swatches}
								.state.value=${this.state.swatchValue}
								.state.size=${'sm'}
								@swatch-group:change=${this.handleColor}></ui-swatch-group>
						</div>
						<div class="product-detail-actions">
							<ui-number-stepper
								.state.value=${this.state.qty}
								.state.min=${1}
								.state.max=${this.state.max}
								.state.label=${'Quantity'}
								@number-stepper:change=${this.handleQty}></ui-number-stepper>
							<ui-button
								class="product-detail-cta"
								.state.label=${this.state.addLabel}
								.state.tone=${'primary'}
								.state.size=${'md'}
								@button:click=${this.handleAdd}></ui-button>
							<ui-icon-button
								class="product-detail-action"
								?hidden=${this.actionHidden}
								.state.icon=${this.state.actionIcon}
								.state.tooltip=${this.state.actionTooltip}
								.state.size=${'md'}
								.state.variant=${'solid'}
								.state.tone=${'primary'}
								@icon-button:click=${this.handleAction}></ui-icon-button>
						</div>
					</div>
				</div>
				<div class="product-detail-panels">
					<ui-tabs
						class="product-detail-tabs"
						?hidden=${this.tabsHidden}
						.state.items=${this.state.tabs}
						.state.activeIndex=${this.state.tab}
						.state.contentMode=${'remote'}
						.state.variant=${this.state.tabVariant}
						@tabs:change=${this.handleTab}></ui-tabs>
					<p class="product-detail-copy" ?hidden=${this.overviewHidden}>${this.state.description}</p>
					<dl class="product-detail-specs" ?hidden=${this.specsHidden}>
						${this.list('specs', this.specRow, this.specKey)}
					</dl>
				</div>
			</article>
		`;
	}
}
customElements.define('ui-product-detail', UIProductDetail);
