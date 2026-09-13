/*
	DESCRIPTION: ui-tracker — status squares composed from <ui-tabs variant=blocks>.
	Click a segment to expand an INLINE detail panel under the bar. Emits
	cancelable tracker:select so a parent can hijack via event.preventDefault().
	toggleActive on the strip collapses on a second click of the open block.
	openOnHover (default true): once a block is open, hovering another activates it.
	Overflow arrows sit on this host (not ui-tabs): they page so the last
	fully-visible block on that edge becomes the new start.
	`timeGuide` weights each block by its duration and prints clock ticks under
	it. It COMPOSES with `join` rather than overriding it: detached splits the
	open block apart, attached expands it in place, and under the guide the
	gutter is painted inside the block so its box — and its ticks — stay on the
	clock either way.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tracker .state.items=${[
	    { tone: 'success', label: 'API', icon: 'activity' },
	    { tone: 'danger', label: 'DB', empty: true },
	  ]}></ui-tracker>
*/
import '../button/button.js';
import '../icon/icon.js';
import '../tabs/tabs.js';
import {
	durationOf,
	formatTime,
	html,
	isArray,
	isFalse,
	isString,
	isTrue,
	noValue,
	WebComponent,
} from 'webcomponent';
import {
	pageStripEndDest,
	pageStripStartDest,
	SCROLL_EDGE_PX,
	visibleEdgeIndexes,
} from './stripPage.js';
const LABEL_EXPAND_MS = 240;
const STRIP_SCROLL_MS = 280;
function easeOutCubic(progress) {
	const inverse = 1 - progress;
	return 1 - (inverse * inverse * inverse);
}
const TONES = new Set([
	'accent',
	'success',
	'warning',
	'danger',
	'info',
	'neutral',
]);
function normalizeTone(tone) {
	return TONES.has(tone) ? tone : 'neutral';
}
function segmentTime(segment, index) {
	const start = Number(segment?.start);
	const end = Number(segment?.end);
	if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
		return {
			start,
			end,
			duration: durationOf({
				start,
				end,
			}),
		};
	}
	return {
		start: index,
		end: index + 1,
		duration: 1,
	};
}
function segmentFields(segment, index) {
	if (isString(segment)) {
		const fallback = segmentTime(null, index);
		return {
			tone: normalizeTone(segment),
			label: '',
			title: '',
			detail: '',
			icon: '',
			meta: '',
			actions: [],
			empty: false,
			display: '',
			color: '',
			start: fallback.start,
			end: fallback.end,
			duration: fallback.duration,
		};
	}
	const label = segment?.label ? String(segment.label) : '';
	const title = segment?.title ? String(segment.title) : label;
	const detail = noValue(segment?.detail) ? '' : String(segment.detail);
	const icon = segment?.icon ? String(segment.icon) : '';
	const meta = segment?.meta ? String(segment.meta) : '';
	const actions = isArray(segment?.actions) ? segment.actions : [];
	const range = segmentTime(segment, index);
	return {
		tone: normalizeTone(segment?.tone),
		label,
		title,
		detail,
		icon,
		meta,
		actions,
		empty: isTrue(segment?.empty) || isFalse(segment?.filled),
		display: segment?.display ? String(segment.display) : '',
		color: segment?.color ? String(segment.color) : '',
		start: range.start,
		end: range.end,
		duration: range.duration,
	};
}
const EMPTY_FIELDS = {
	tone: 'neutral',
	label: '',
	title: '',
	detail: '',
	icon: '',
	meta: '',
	actions: [],
	empty: false,
	display: '',
	color: '',
	start: 0,
	end: 1,
	duration: 1,
};
export class UITracker extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tracker: './tracker.css',
	};
	static state = {
		items: [],
		tabItems: [],
		label: '',
		expandedIndex: -1,
		expandOnSelect: true,
		openOnHover: true,
		join: 'detached',
		actionItems: [],
		slideDir: 'none',
		canScrollStart: false,
		canScrollEnd: false,
		arrowStyle: 'rail',
		timeGuide: false,
		labelPlace: 'in',
	};
	layoutGen = 0;
	stripObserver = null;
	stripNode = null;
	overflowTimer = null;
	stripRefreshTimer = null;
	resizeForwarder = null;
	stripScrollTick = null;
	stripScrollRunning = false;
	stripScrollFrom = 0;
	stripScrollTarget = 0;
	stripScrollStarted = 0;
	stripScrollStrip = null;
	expandedCache = EMPTY_FIELDS;
	expandedCacheIndex = -2;
	expandedCacheItems = null;
	onConnect() {
		this.resizeForwarder = () => {
			this.syncOverflow();
		};
		this.stripScrollTick = () => {
			this.onStripScrollFrame();
		};
		this.on('keydown', this.handleHostKeydown);
		this.observe('expandedIndex', this.syncActionItems);
		this.observe('items', this.syncTabItems);
		this.observe('timeGuide', this.syncTabItems);
		this.observe('labelPlace', this.syncTabItems);
		this.observe('expandedIndex', this.onExpandedChange);
		this.syncTabItems();
		this.syncActionItems();
	}
	onMount() {
		this.attachStripOverflow();
		this.queueOverflowSync();
	}
	onDisconnect() {
		this.layoutGen += 1;
		this.stripScrollRunning = false;
		this.detachStripOverflow();
	}
	syncTabItems() {
		const items = this.state.items;
		const next = [];
		let totalDuration = 0;
		if (isArray(items)) {
			const itemCount = items.length;
			for (let index = 0; index < itemCount; index++) {
				const fields = segmentFields(items[index], index);
				totalDuration += fields.duration;
			}
			const span = totalDuration > 0 ? totalDuration : 1;
			const guide = this.state.timeGuide === true;
			for (let index = 0; index < itemCount; index++) {
				const fields = segmentFields(items[index], index);
				const last = index === itemCount - 1;
				next.push({
					id: String(index),
					label: fields.label,
					icon: fields.icon,
					tone: fields.tone,
					empty: fields.empty,
					display: fields.display,
					color: fields.color,
					weight: fields.duration / span,
					labelPlace: this.state.labelPlace === 'over' ? 'over' : 'in',
					tickStart: guide ? formatTime(fields.start) : '',
					tickEnd: guide && last ? formatTime(fields.end) : '',
				});
			}
		}
		this.state.tabItems = next;
		if (this.isMounted) {
			this.queueStripAttach();
		}
	}
	syncActionItems() {
		const fields = this.expandedFields();
		this.state.actionItems = fields.actions;
	}
	async onExpandedChange() {
		const gen = this.layoutGen + 1;
		this.layoutGen = gen;
		const pane = this.refs.pane;
		if (pane && this.state.expandedIndex >= 0) {
			pane.style.animation = 'none';
		}
		await this.nextFrame();
		if (gen !== this.layoutGen || this.isDisconnected) {
			return;
		}
		this.layoutDetail();
		this.syncOverflow();
		this.queueOverflowSync();
		await this.nextFrame();
		if (gen !== this.layoutGen || this.isDisconnected) {
			return;
		}
		if (pane) {
			pane.style.animation = '';
		}
	}
	layoutDetail() {
		const panelViewport = this.refs.viewport;
		const pane = this.refs.pane;
		if (!panelViewport) {
			return;
		}
		if (this.state.expandedIndex < 0 || !pane) {
			panelViewport.style.blockSize = '';
			return;
		}
		const height = Math.ceil(Math.max(pane.scrollHeight || 0, pane.offsetHeight || 0));
		if (height > 0) {
			panelViewport.style.blockSize = `${height}px`;
		}
	}
	queueStripAttach() {
		(this.stripRefreshTimer ??= this.createTimeout(this.onStripAttachTimer, 0)).run();
	}
	onStripAttachTimer(component) {
		if (component.isDisconnected) {
			return;
		}
		component.attachStripOverflow();
	}
	queueOverflowSync() {
		(this.overflowTimer ??= this.createTimeout(this.onOverflowTimer, LABEL_EXPAND_MS)).run();
	}
	onOverflowTimer(component) {
		if (component.isDisconnected) {
			return;
		}
		component.syncOverflow();
	}
	attachStripOverflow() {
		this.detachStripOverflow();
		const tabs = this.findComponent('ui-tabs');
		const strip = tabs?.refs?.strip;
		if (!strip) {
			return;
		}
		this.stripNode = strip;
		strip.addEventListener('scroll', this, {
			passive: true,
		});
		if (typeof ResizeObserver !== 'undefined') {
			this.stripObserver = new ResizeObserver(this.resizeForwarder);
			this.stripObserver.observe(strip);
			this.stripObserver.observe(this);
			const nodes = strip.children;
			const nodeCount = nodes.length;
			for (let index = 0; index < nodeCount; index++) {
				this.stripObserver.observe(nodes[index]);
			}
		}
		this.syncOverflow();
	}
	detachStripOverflow() {
		const strip = this.stripNode;
		if (strip) {
			strip.removeEventListener('scroll', this);
		}
		this.stripObserver?.disconnect();
		this.stripObserver = null;
		this.stripNode = null;
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'scroll') {
			this.syncOverflow();
		}
	}
	syncOverflow(component) {
		const tracker = component || this;
		if (tracker.isDisconnected || tracker.stripScrollRunning) {
			return;
		}
		const strip = tracker.stripNode;
		if (!strip) {
			return;
		}
		const viewSize = strip.clientWidth;
		const maxScroll = Math.max(0, strip.scrollWidth - viewSize);
		const scrollPos = strip.scrollLeft;
		this.markVisibleEdges(strip, viewSize, scrollPos);
		const canStart = scrollPos > SCROLL_EDGE_PX;
		const canEnd = scrollPos < maxScroll - SCROLL_EDGE_PX;
		if (tracker.state.canScrollStart === canStart && tracker.state.canScrollEnd === canEnd) {
			return;
		}
		tracker.assignState({
			canScrollStart: canStart,
			canScrollEnd: canEnd,
		});
	}
	prefersReducedMotion() {
		return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
	}
	scrollStripTo(strip, dest) {
		const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
		const target = Math.max(0, Math.min(maxScroll, dest));
		const from = strip.scrollLeft;
		if (this.prefersReducedMotion() || Math.abs(target - from) < 2) {
			this.stripScrollRunning = false;
			strip.scrollLeft = target;
			this.syncOverflow();
			return;
		}
		this.stripScrollStrip = strip;
		this.stripScrollFrom = from;
		this.stripScrollTarget = target;
		this.stripScrollStarted = performance.now();
		if (this.stripScrollRunning) {
			return;
		}
		this.stripScrollRunning = true;
		requestAnimationFrame(this.stripScrollTick);
	}
	onStripScrollFrame() {
		if (!this.stripScrollRunning || this.isDisconnected) {
			this.stripScrollRunning = false;
			return;
		}
		const strip = this.stripScrollStrip;
		if (!strip) {
			this.stripScrollRunning = false;
			return;
		}
		const elapsed = performance.now() - this.stripScrollStarted;
		const progress = Math.min(1, elapsed / STRIP_SCROLL_MS);
		const delta = this.stripScrollTarget - this.stripScrollFrom;
		strip.scrollLeft = this.stripScrollFrom + (delta * easeOutCubic(progress));
		if (progress < 1) {
			requestAnimationFrame(this.stripScrollTick);
			return;
		}
		this.stripScrollRunning = false;
		this.syncOverflow();
	}
	markVisibleEdges(strip, viewSize, scrollPos) {
		const blocks = this.stripBlocks(strip);
		const edges = visibleEdgeIndexes(blocks, viewSize, scrollPos);
		const startIndex = edges.clipStart ? -1 : edges.start;
		const endIndex = edges.clipEnd ? -1 : edges.end;
		const blockCount = blocks.length;
		for (let index = 0; index < blockCount; index += 1) {
			const node = blocks[index];
			node.toggleAttribute('data-edge-start', index === startIndex);
			node.toggleAttribute('data-edge-end', index === endIndex);
		}
	}
	stripBlocks(strip) {
		const nodes = strip.children;
		const nodeCount = nodes.length;
		const blocks = [];
		for (let index = 0; index < nodeCount; index++) {
			const node = nodes[index];
			if (node.tagName === 'UI-TAB-BUTTON') {
				blocks.push(node);
			}
		}
		return blocks;
	}
	/*
	 * Page one window along the strip. The last fully-visible block on the
	 * requested edge becomes the new start (scrollLeft = that child's
	 * offsetLeft). Remainder shorter than one window scrolls the rest of the way.
	 */
	pageStrip(direction) {
		const strip = this.stripNode;
		if (!strip) {
			return;
		}
		const viewSize = strip.clientWidth;
		const maxScroll = Math.max(0, strip.scrollWidth - viewSize);
		/* Page from the lerp dest so a second click during motion advances another window. */
		const scrollPos = this.stripScrollRunning ? this.stripScrollTarget : strip.scrollLeft;
		const blocks = this.stripBlocks(strip);
		if (direction > 0) {
			this.scrollStripTo(strip, pageStripEndDest(blocks, viewSize, scrollPos, maxScroll));
			return;
		}
		this.scrollStripTo(strip, pageStripStartDest(blocks, viewSize, scrollPos, maxScroll));
	}
	handleScrollStart() {
		this.pageStrip(-1);
	}
	handleScrollEnd() {
		this.pageStrip(1);
	}
	activeTabId() {
		const index = this.state.expandedIndex;
		if (index < 0) {
			return '';
		}
		return String(index);
	}
	handleTabsChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		if (data.collapsed === true) {
			this.collapse();
			return;
		}
		const index = Number(data.id);
		if (!Number.isFinite(index)) {
			return;
		}
		this.selectSegment(index, true);
	}
	handleTabsHover(domEvent) {
		if (this.state.openOnHover !== true) {
			return;
		}
		if (this.state.expandedIndex < 0) {
			return;
		}
		const tabId = domEvent.detail?.data?.id;
		if (!tabId) {
			return;
		}
		const index = Number(tabId);
		if (!Number.isFinite(index) || index < 0 || index === this.state.expandedIndex) {
			return;
		}
		this.previewSegment(index);
	}
	handleHostKeydown(domEvent) {
		if (domEvent.key !== 'Escape') {
			return;
		}
		if (this.state.expandedIndex < 0) {
			return;
		}
		domEvent.stopPropagation();
		this.collapse();
	}
	selectSegment(index, fromTabs) {
		const items = this.state.items;
		if (!isArray(items) || index < 0 || index >= items.length) {
			return;
		}
		const item = items[index];
		const fields = segmentFields(item, index);
		if (isTrue(fields.empty)) {
			return;
		}
		const proceed = this.emit('tracker:select', {
			index,
			item,
			tone: fields.tone,
			label: fields.label,
			title: fields.title,
			detail: fields.detail,
			icon: fields.icon,
			meta: fields.meta,
			actions: fields.actions,
			expanded: this.state.expandedIndex === index,
		}, {
			cancelable: true,
		});
		if (proceed === false) {
			return;
		}
		if (this.state.expandOnSelect !== true) {
			return;
		}
		if (!fromTabs && this.state.expandedIndex === index) {
			this.collapse();
			return;
		}
		this.openAt(index);
	}
	previewSegment(index) {
		const items = this.state.items;
		if (!isArray(items) || index < 0 || index >= items.length) {
			return;
		}
		if (this.state.expandedIndex < 0 || this.state.expandedIndex === index) {
			return;
		}
		this.openAt(index);
		const fields = segmentFields(items[index], index);
		this.emit('tracker:hover', {
			index,
			item: items[index],
			tone: fields.tone,
			label: fields.label,
			title: fields.title,
			detail: fields.detail,
			icon: fields.icon,
			meta: fields.meta,
		});
	}
	openAt(index) {
		const previous = this.state.expandedIndex;
		if (previous < 0) {
			this.state.slideDir = 'in';
		} else if (index > previous) {
			this.state.slideDir = 'next';
		} else if (index < previous) {
			this.state.slideDir = 'prev';
		}
		this.state.expandedIndex = index;
	}
	collapse() {
		if (this.state.expandedIndex < 0) {
			return;
		}
		const previous = this.state.expandedIndex;
		this.state.slideDir = 'none';
		this.state.expandedIndex = -1;
		this.emit('tracker:collapse', {
			index: previous,
		});
	}
	hasExpanded() {
		return this.state.expandedIndex >= 0;
	}
	detailHidden() {
		return this.state.expandedIndex < 0;
	}
	hideScrollStart() {
		return !this.state.canScrollStart;
	}
	hideScrollEnd() {
		return !this.state.canScrollEnd;
	}
	arrowStyleFlag() {
		return this.state.arrowStyle === 'overlay' ? 'overlay' : 'rail';
	}
	timeGuideOn() {
		return this.state.timeGuide === true;
	}
	labelPlaceAttr() {
		return this.state.labelPlace === 'over' ? 'over' : 'in';
	}
	expandedFields() {
		const index = this.state.expandedIndex;
		const items = this.state.items;
		if (index === this.expandedCacheIndex && items === this.expandedCacheItems) {
			return this.expandedCache;
		}
		this.expandedCacheIndex = index;
		this.expandedCacheItems = items;
		if (!isArray(items) || index < 0 || index >= items.length) {
			this.expandedCache = EMPTY_FIELDS;
			return EMPTY_FIELDS;
		}
		const fields = segmentFields(items[index], index);
		this.expandedCache = fields;
		return fields;
	}
	expandedTitle() {
		const fields = this.expandedFields();
		return fields.title || fields.label || 'Segment';
	}
	expandedDetail() {
		const fields = this.expandedFields();
		if (fields.detail) {
			return fields.detail;
		}
		return fields.label || 'No additional detail.';
	}
	expandedTone() {
		return this.expandedFields().tone;
	}
	expandedIcon() {
		return this.expandedFields().icon;
	}
	expandedMeta() {
		return this.expandedFields().meta;
	}
	expandedLabel() {
		return this.expandedFields().label;
	}
	hideExpandedIcon() {
		return !this.expandedIcon();
	}
	hideExpandedMeta() {
		return !this.expandedMeta();
	}
	hideExpandedLabel() {
		const fields = this.expandedFields();
		return !fields.label || fields.label === fields.title;
	}
	hideActions() {
		return this.state.actionItems.length === 0;
	}
	handleDetailClose() {
		this.collapse();
	}
	handleActionClick(domEvent) {
		const source = domEvent.detail?.source;
		const actionId = source?.dataset?.action || source?.state?.label || '';
		if (!actionId) {
			return;
		}
		const index = this.state.expandedIndex;
		const items = this.state.items;
		const item = isArray(items) ? items[index] : null;
		this.emit('tracker:action', {
			index,
			action: actionId,
			item,
		});
	}
	render() {
		this.html`
			<div class="tracker-root" data-arrows=${this.arrowStyleFlag} ?data-expanded=${this.hasExpanded}>
				<div class="tracker-strip-row">
					<button
						class="tracker-arrow"
						type="button"
						data-dir="start"
						data-variant="icon"
						data-tone="neutral"
						data-size="sm"
						aria-label="Previous blocks"
						tooltip="Previous blocks"
						?hidden=${this.hideScrollStart}
						@click=${this.handleScrollStart}>
						<ui-icon .state.name=${'chevron-left'} .state.size=${'sm'}></ui-icon>
					</button>
					<ui-tabs class="tracker-tabs"
						?data-time-guide=${this.timeGuideOn}
						data-label-place=${this.labelPlaceAttr}
						.state.variant=${'blocks'}
						.state.join=${this.state.join}
						.state.toggleActive=${true}
						.state.contentMode=${'remote'}
						.state.items=${this.state.tabItems}
						.state.activeIndex=${this.activeTabId}
						aria-label=${this.state.label}
						@tabs:change=${this.handleTabsChange}
						@tabs:hover=${this.handleTabsHover}></ui-tabs>
					<button
						class="tracker-arrow"
						type="button"
						data-dir="end"
						data-variant="icon"
						data-tone="neutral"
						data-size="sm"
						aria-label="Next blocks"
						tooltip="Next blocks"
						?hidden=${this.hideScrollEnd}
						@click=${this.handleScrollEnd}>
						<ui-icon .state.name=${'chevron-right'} .state.size=${'sm'}></ui-icon>
					</button>
				</div>
				<div
					id="tracker-detail"
					class="tracker-detail"
					data-tone=${this.expandedTone}
					data-slide=${this.state.slideDir}
					?hidden=${this.detailHidden}
					role="region"
					aria-live="polite">
					<div #viewport class="tracker-detail-viewport">
						<div #pane class="tracker-detail-pane" data-slide=${this.state.slideDir}>
							<div class="tracker-detail-head">
								<span class="tracker-detail-swatch" data-tone=${this.expandedTone} aria-hidden="true"></span>
								<ui-icon
									class="tracker-detail-icon"
									?hidden=${this.hideExpandedIcon}
									.state.name=${this.expandedIcon}
									.state.size=${'sm'}></ui-icon>
								<span class="tracker-detail-title">${this.expandedTitle}</span>
								<ui-button
									class="tracker-detail-close"
									.state.variant=${'ghost'}
									.state.size=${'sm'}
									.state.tone=${'neutral'}
									.state.leadicon=${'x'}
									.state.tooltip=${'Close detail'}
									@button:click=${this.handleDetailClose}></ui-button>
							</div>
							<div class="tracker-detail-label" ?hidden=${this.hideExpandedLabel}>${this.expandedLabel}</div>
							<div class="tracker-detail-meta" ?hidden=${this.hideExpandedMeta}>${this.expandedMeta}</div>
							<div class="tracker-detail-body">${this.expandedDetail}</div>
							<div
								class="tracker-detail-actions"
								?hidden=${this.hideActions}
								@button:click=${this.handleActionClick}>
								${this.list('actionItems', this.actionButton)}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
	actionButton(item) {
		const actionLabel = item?.label || item?.id || 'Action';
		const actionId = item?.id || actionLabel;
		const actionTone = item?.tone || 'neutral';
		return html`<ui-button
			data-action=${actionId}
			.state.variant=${'outline'}
			.state.size=${'sm'}
			.state.tone=${actionTone}
			.state.label=${actionLabel}></ui-button>`;
	}
}
customElements.define('ui-tracker', UITracker);
