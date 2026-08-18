/*
	DESCRIPTION: ui-tracker — status squares (Tremor-style uptime bars).
	Click a segment to expand an INLINE detail panel under the bar (no full-
	screen backdrop). Emits cancelable tracker:select so a parent can hijack
	for modal / popover / floating-panel via event.preventDefault().
	When the panel is open, hovering another segment slides + resizes the
	detail (nav-section openOnHover + viewport morph). expandOnSelect:false
	→ emit only.
*/
import '../icon/icon.js';
import { isArray, isString } from '@universalweb/utilitylib';
import { html, WebComponent } from 'webcomponent';
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
function segmentFields(segment) {
	if (isString(segment)) {
		return {
			tone: normalizeTone(segment),
			label: '',
			title: '',
			detail: '',
			icon: '',
			meta: '',
			actions: [],
		};
	}
	const label = segment?.label ? String(segment.label) : '';
	const title = segment?.title ? String(segment.title) : label;
	const detail = segment?.detail == null ? '' : String(segment.detail);
	const icon = segment?.icon ? String(segment.icon) : '';
	const meta = segment?.meta ? String(segment.meta) : '';
	const actions = isArray(segment?.actions) ? segment.actions : [];
	return {
		tone: normalizeTone(segment?.tone),
		label,
		title,
		detail,
		icon,
		meta,
		actions,
	};
}
function segmentIndexFromEvent(domEvent) {
	const path = domEvent.composedPath();
	const pathCount = path.length;
	for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
		const node = path[pathIndex];
		if (node?.classList?.contains('trk-seg') && node.dataset?.index != null) {
			return Number(node.dataset.index);
		}
	}
	return -1;
}
export class UITracker extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tracker: './tracker.css',
	};
	static state = {
		items: [],
		label: '',
		// -1 = collapsed. Index of the open segment detail panel.
		expandedIndex: -1,
		// When true (default), a non-canceled select toggles the inline panel.
		// When false, only tracker:select is emitted (parent owns the reaction).
		expandOnSelect: true,
		// When the panel is already open, hover another segment to morph to it.
		openOnHover: true,
		// Actions for the open segment — synced from items[expandedIndex].
		actionItems: [],
		slideDir: 'none',
	};
	layoutGen = 0;
	onConnect() {
		this.on('keydown', this.handleHostKeydown);
		this.observe('expandedIndex', this.syncActionItems);
		this.observe('items', this.syncActionItems);
		this.observe('expandedIndex', this.onExpandedChange);
		this.syncActionItems();
	}
	onDisconnect() {
		this.layoutGen += 1;
	}
	syncActionItems() {
		const fields = this.expandedFields();
		this.state.actionItems = fields.actions;
	}
	async onExpandedChange() {
		const gen = this.layoutGen + 1;
		this.layoutGen = gen;
		await this.nextFrame();
		if (gen !== this.layoutGen || this.isDisconnected) {
			return;
		}
		this.restartPaneAnimation();
		this.layoutDetail();
	}
	restartPaneAnimation() {
		const pane = this.refs.pane;
		if (!pane || this.state.expandedIndex < 0) {
			return;
		}
		pane.style.animation = 'none';
		pane.getBoundingClientRect();
		pane.style.animation = '';
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
	/* Light row — plain values only. Click / hover are delegated on the track. */
	segmentRow(segment, itemIndex) {
		const fields = segmentFields(segment);
		const index = itemIndex ?? 0;
		const expanded = index === this.state.expandedIndex;
		const aria = fields.label || `Segment ${index + 1}`;
		return html`
			<button
				type="button"
				class="trk-seg"
				data-tone=${fields.tone}
				data-index=${String(index)}
				data-active=${expanded ? 'true' : 'false'}
				aria-label=${aria}
				aria-expanded=${expanded ? 'true' : 'false'}
				aria-controls="trk-detail"></button>`;
	}
	handleTrackClick(domEvent) {
		const index = segmentIndexFromEvent(domEvent);
		if (!Number.isFinite(index) || index < 0) {
			return;
		}
		this.selectSegment(index);
	}
	handleTrackHover(domEvent) {
		if (this.state.openOnHover !== true) {
			return;
		}
		if (this.state.expandedIndex < 0) {
			return;
		}
		const index = segmentIndexFromEvent(domEvent);
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
	/**
	 * Select a segment by index. Emits cancelable `tracker:select`.
	 * If the event is not canceled and expandOnSelect is true, toggles the
	 * inline detail panel (no backdrop).
	 * @param {number} index - Segment index in state.items.
	 */
	selectSegment(index) {
		const items = this.state.items;
		if (!isArray(items) || index < 0 || index >= items.length) {
			return;
		}
		const item = items[index];
		const fields = segmentFields(item);
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
		if (this.state.expandedIndex === index) {
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
		const fields = segmentFields(items[index]);
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
	expandedFields() {
		const index = this.state.expandedIndex;
		const items = this.state.items;
		if (!isArray(items) || index < 0 || index >= items.length) {
			return {
				tone: 'neutral',
				label: '',
				title: '',
				detail: '',
				icon: '',
				meta: '',
				actions: [],
			};
		}
		return segmentFields(items[index]);
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
	caretStyle() {
		const items = this.state.items;
		const index = this.state.expandedIndex;
		if (!isArray(items) || items.length === 0 || index < 0) {
			return '';
		}
		const percent = ((index + 0.5) / items.length) * 100;
		return `--trk-caret:${percent}%;`;
	}
	handleDetailClose() {
		this.collapse();
	}
	/* Light row — plain values. Click is delegated on the actions host. */
	actionRow(item) {
		return html`
			<button
				type="button"
				class="trk-action"
				data-action=${item?.id || item?.label || ''}
				data-tone=${item?.tone || 'neutral'}>${item?.label || item?.id || 'Action'}</button>`;
	}
	handleActionClick(domEvent) {
		const path = domEvent.composedPath();
		const pathCount = path.length;
		let actionId = '';
		for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
			const node = path[pathIndex];
			if (node?.classList?.contains('trk-action') && node.dataset?.action != null) {
				actionId = node.dataset.action;
				break;
			}
		}
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
	/*
	 * each() (not list()) so rows re-materialize when expandedIndex changes —
	 * data-active / aria-expanded must track selection, and list() only re-diffs
	 * on the items path. Reading expandedIndex registers the render dep.
	 *
	 * Key includes open-state (closed over, not via this.keyFn — keyFn is called
	 * on LiveList, so `this` is not the host). patchList sameKeyOrder skips
	 * light-row re-patch when the item ref is unchanged; flipping two keys
	 * remounts only previous + next open rows.
	 */
	segmentsLive() {
		const expanded = this.state.expandedIndex;
		if (expanded < -1) {
			return this.each([], this.segmentRow);
		}
		return this.each(this.state.items, this.segmentRow, (_segment, index) => {
			if (index === expanded) {
				return `open:${index}`;
			}
			return index;
		});
	}
	render() {
		this.html`
			<div class="trk-root" ?data-expanded=${this.hasExpanded}>
				<div
					class="trk"
					role="group"
					aria-label=${this.state.label}
					@click=${this.handleTrackClick}
					@pointerover=${this.handleTrackHover}>
					${this.segmentsLive}
				</div>
				<div
					id="trk-detail"
					class="trk-detail"
					data-tone=${this.expandedTone}
					data-slide=${this.state.slideDir}
					style=${this.caretStyle}
					?hidden=${this.detailHidden}
					role="region"
					aria-live="polite">
					<div #viewport class="trk-detail-viewport">
						<div #pane class="trk-detail-pane" data-slide=${this.state.slideDir}>
							<div class="trk-detail-head">
								<span class="trk-detail-swatch" data-tone=${this.expandedTone} aria-hidden="true"></span>
								<ui-icon
									class="trk-detail-icon"
									?hidden=${this.hideExpandedIcon}
									.state.name=${this.expandedIcon}
									.state.size=${'sm'}></ui-icon>
								<span class="trk-detail-title">${this.expandedTitle}</span>
								<button
									type="button"
									class="trk-detail-close"
									aria-label="Close detail"
									@click=${this.handleDetailClose}>×</button>
							</div>
							<div class="trk-detail-label" ?hidden=${this.hideExpandedLabel}>${this.expandedLabel}</div>
							<div class="trk-detail-meta" ?hidden=${this.hideExpandedMeta}>${this.expandedMeta}</div>
							<div class="trk-detail-body">${this.expandedDetail}</div>
							<div
								class="trk-detail-actions"
								?hidden=${this.hideActions}
								@click=${this.handleActionClick}>
								${this.list('actionItems', this.actionRow)}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-tracker', UITracker);
