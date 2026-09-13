/*
	DESCRIPTION: ui-multi-select — chip-trigger multi picker.
	Composes ui-listbox (multiple + optional filter) and ui-chip for the value
	display. A trailing clear rail (core/dom/rail.css) sits on the fused
	surface; the chevron stays inboard on the combobox trigger so the rail
	never swallows the open click. `values` is controlled: an external write
	re-seeds `liveValues` and rebuilds chips. User picks still mutate
	`liveValues` and emit multi-select:change {values,items}; an external
	write does NOT emit — the parent is telling the control what it is, not
	asking it to report.
	ECHO GUARD: skip the re-seed when the incoming array is member-equal to
	liveValues (same length, same members in order). assignState compares
	top-level keys with ===, so a parent writeback of a fresh slice that
	matches liveValues still notifies. Re-emitting that would write another
	slice, notify again, and loop. The original uncontrolled seed existed
	to dodge that loop; the guard is what makes controlled safe.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-multi-select .state.items=${[{id:'a',label:'Alpha',value:'a'}]}
	    .state.values=${['a']} .state.filterable=${true}
	    @multi-select:change=${this.onPick}></ui-multi-select>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import {
	isArray, isTrue, isUndefined, WebComponent,
} from 'webcomponent';
import { hideOverlay, positionOverlayWhenReady } from '../../core/dom/anchor.js';
import { SurfaceController } from '../../core/dom/surfaceController.js';
import { isTopEscapable } from '../../core/escape/escapeStack.js';
import { UIChip } from '../chip/chip.js';
import { listboxItemKey, listboxItemLabel, listboxItemValue } from '../listbox/listbox.js';
const EMPTY_ITEMS = [];
/**
 * True when both arrays hold the same members in the same order.
 * @param {*} left - Candidate array (non-arrays read as empty).
 * @param {*} right - Candidate array (non-arrays read as empty).
 * @returns {boolean} Member-equal.
 */
function sameMembers(left, right) {
	const leftItems = isArray(left) ? left : EMPTY_ITEMS;
	const rightItems = isArray(right) ? right : EMPTY_ITEMS;
	const count = leftItems.length;
	if (count !== rightItems.length) {
		return false;
	}
	for (let index = 0; index < count; index += 1) {
		if (leftItems[index] !== rightItems[index]) {
			return false;
		}
	}
	return true;
}
export class UIMultiSelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		rail: '../../core/dom/rail.css',
		multiSelect: './multi-select.css',
	};
	static state = {
		items: [],
		values: [],
		chipItems: [],
		open: false,
		filterable: false,
		placeholder: 'Select…',
		disabled: false,
		emptyMessage: 'No results.',
		clearable: true,
		showSelectAll: true,
		clearIcon: {
			name: 'filter-x',
			size: 'sm',
		},
		clearLabel: 'Clear',
		chevronIcon: {
			name: 'chevrons-up-down',
			size: 'sm',
		},
	};
	liveValues = [];
	onConnect() {
		const seed = isArray(this.state.values) ? this.state.values : [];
		this.liveValues = seed.slice();
		this.rebuildChips();
		this.observe([
			'items',
			'disabled',
		], this.rebuildChips);
		this.observe('open', this.syncOpen);
		this.observe('values', this.syncValues);
	}
	/*
	 * Controlled inbound path. Never emit — a parent write is not a user
	 * change, and emitting would re-enter a parent that writes the payload
	 * back (filter-bar Clear is that parent).
	 */
	syncValues(next) {
		const incoming = isArray(next) ? next : EMPTY_ITEMS;
		if (sameMembers(incoming, this.liveValues)) {
			return;
		}
		this.liveValues = incoming.slice();
		this.rebuildChips();
		this.syncListboxValues();
	}
	/*
	 * chipItems is a list() key — writing it patches chips without re-running
	 * render(), so the listbox `.state.values=${liveValues}` binding would
	 * stay on the previous array. Push the live set into the composed listbox.
	 */
	syncListboxValues() {
		const listbox = this.findComponent('ui-listbox');
		if (!listbox) {
			return;
		}
		listbox.assignState({
			values: this.liveValues,
		});
	}
	onRendered() {
		this.syncOpen(this.state.open);
	}
	onDisconnect() {
		this.surfaceCtl?.detach();
	}
	ensureSurfaceCtl() {
		this.surfaceCtl ??= new SurfaceController(this, {
			surface: () => {
				return this.refs.surface;
			},
			closeMethod: 'closeList',
			keepOpen: () => {
				return this.refs.surface;
			},
			listenEscape: false,
			outside: true,
		});
		return this.surfaceCtl;
	}
	positionPanel() {
		positionOverlayWhenReady(this.refs.surface, this.refs.shell || this.refs.trigger, {
			placement: 'bottom-start',
			offset: 6,
			matchWidth: true,
		});
	}
	hideClearRail() {
		return this.state.clearable !== true || this.state.chipItems.length === 0;
	}
	handleClearAll(domEvent) {
		domEvent.stopPropagation();
		if (this.state.disabled) {
			return;
		}
		this.commitValues([]);
	}
	handleToggle(domEvent) {
		const isOpen = domEvent.newState === 'open';
		if (this.state.open !== isOpen) {
			this.state.open = isOpen;
		}
		if (isOpen) {
			this.positionPanel();
		}
	}
	rebuildChips() {
		const chosen = new Set(this.liveValues);
		const items = isArray(this.state.items) ? this.state.items : [];
		const chips = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const value = listboxItemValue(item);
			if (!chosen.has(value)) {
				continue;
			}
			chips.push({
				label: listboxItemLabel(item),
				value,
				removable: !isTrue(this.state.disabled),
				disabled: isTrue(this.state.disabled),
				size: 'sm',
			});
		}
		this.state.chipItems = chips;
	}
	selectedItems() {
		const chosen = new Set(this.liveValues);
		const items = isArray(this.state.items) ? this.state.items : [];
		const out = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (item && chosen.has(listboxItemValue(item))) {
				out.push(item);
			}
		}
		return out;
	}
	emitChange(items) {
		this.emit('multi-select:change', {
			values: this.liveValues.slice(),
			items: items || this.selectedItems(),
		});
	}
	commitValues(values, items) {
		this.liveValues = isArray(values) ? values.slice() : [];
		this.rebuildChips();
		this.syncListboxValues();
		this.emitChange(items);
	}
	handleListboxChange(domEvent) {
		const data = domEvent.detail?.data;
		this.commitValues(data?.values, data?.items);
	}
	handleChipRemove(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (isUndefined(value)) {
			return;
		}
		const next = [];
		const current = this.liveValues;
		const count = current.length;
		for (let index = 0; index < count; index += 1) {
			if (current[index] !== value) {
				next.push(current[index]);
			}
		}
		this.commitValues(next);
	}
	toggleOpen() {
		if (this.state.disabled) {
			return;
		}
		const surface = this.refs.surface;
		if (surface?.matches(':popover-open')) {
			this.hideSurfacePopover(surface);
			return;
		}
		hideOverlay(surface);
		this.showSurfacePopover(surface);
	}
	closeList() {
		this.hideSurfacePopover(this.refs.surface);
	}
	syncOpen(isOpen) {
		const ctl = this.ensureSurfaceCtl();
		if (isOpen) {
			hideOverlay(this.refs.surface);
			ctl.show();
			ctl.attach();
		} else {
			ctl.hide();
			ctl.detach();
		}
	}
	handleKeydown(domEvent) {
		if (domEvent.key === 'Escape' && this.state.open) {
			// Only the most recent open layer answers Escape.
			if (!isTopEscapable(this)) {
				return;
			}
			domEvent.preventDefault();
			this.closeList();
			return;
		}
		if ((domEvent.key === 'Enter' || domEvent.key === ' ') && !this.state.disabled) {
			const path = domEvent.composedPath();
			const pathCount = path.length;
			for (let index = 0; index < pathCount; index += 1) {
				if (path[index]?.classList?.contains('multi-select-trigger')) {
					domEvent.preventDefault();
					this.toggleOpen();
					return;
				}
			}
		}
		if (domEvent.key === 'ArrowDown' && !this.state.open) {
			domEvent.preventDefault();
			this.toggleOpen();
		}
	}
	hasChips() {
		return this.state.chipItems.length > 0;
	}
	/*
	 * Listbox keys bind from liveValues (the live set). `.state=${instanceBag}`
	 * does not patch: a class-field bag is not observed. state.values is the
	 * inbound controlled channel; liveValues is what the panel paints.
	 */
	render() {
		this.html`
			<div class="multi-select"
				?data-open=${this.state.open}
				?data-disabled=${this.state.disabled}
				@listbox:change=${this.handleListboxChange}
				@chip:remove=${this.handleChipRemove}
				@keydown=${this.handleKeydown}>
				<div class="rail-shell" #shell>
					<div class="multi-select-trigger" data-hover=${'hairline'} #trigger role="combobox"
						tabindex=${this.state.disabled ? '-1' : '0'}
						aria-disabled=${this.state.disabled ? 'true' : 'false'}
						aria-haspopup="listbox"
						aria-expanded=${this.state.open ? 'true' : 'false'}
						@click=${this.toggleOpen}>
						<span class="multi-select-chips">
							${this.list('chipItems', UIChip, listboxItemKey)}
							<span class="multi-select-placeholder" ?hidden=${this.hasChips}>${this.state.placeholder}</span>
						</span>
						<span class="multi-select-icon" aria-hidden="true">
							<ui-icon .state=${this.state.chevronIcon}></ui-icon>
						</span>
					</div>
					<button
						class="tg-rail tg-rail-trail"
						type="button"
						?hidden=${this.hideClearRail}
						aria-label=${this.state.clearLabel || 'Clear'}
						@click=${this.handleClearAll}>
						<ui-icon .state=${this.state.clearIcon}></ui-icon>
					</button>
				</div>
				<div class="multi-select-panel" #surface popover="manual" @toggle=${this.handleToggle}>
					<ui-listbox
						.state.items=${isArray(this.state.items) ? this.state.items : EMPTY_ITEMS}
						.state.values=${this.liveValues}
						.state.multiple=${true}
						.state.filterable=${isTrue(this.state.filterable)}
						.state.disabled=${isTrue(this.state.disabled)}
						.state.showSelectAll=${isTrue(this.state.showSelectAll)}
						.state.emptyMessage=${this.state.emptyMessage}></ui-listbox>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-multi-select', UIMultiSelect);
