/*
	DESCRIPTION: ui-pick-list — dual-list transfer (source ↔ target).
	`items` is the source; `target` is the transferred collection. Rows own
	`selected` (toggled at event-time on the bound item). Uncontrolled after seed.
	`reorderTarget` (default true): PrimeVue-style up/down/top/bottom on the
	target pane for selected rows (no second list implementation — mutate target).
	── EVENTS ───────────────────────────────────────────────────────────
	  pick-list:change { items, target }
	  pick-list:add { items, item }
	  pick-list:remove { items, item }
	  pick-list:reorder { target, from, to, count }
	    from/to = topmost mover pre/post step (direction-stable);
	    count = how many selected rows actually moved this action
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-pick-list .state.items=${avail} .state.target=${chosen}></ui-pick-list>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
function pickId(item) {
	if (!item) {
		return '';
	}
	if (item.id != null && item.id !== '') {
		return String(item.id);
	}
	if (item.value != null && item.value !== '') {
		return String(item.value);
	}
	return String(item.label || '');
}
export class UIPickItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pickList: './pick-list.css',
	};
	static state = {
		id: '',
		value: '',
		label: '',
		selected: false,
		disabled: false,
	};
	handleActivate() {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('pick-item:select', {
			id: pickId(this.state),
			value: this.state.value || pickId(this.state),
			selected: this.state.selected !== true,
		});
	}
	displayLabel() {
		return this.state.label || this.state.value || this.state.id;
	}
	render() {
		this.html`
			<button type="button" class="pk-item" role="option"
				?data-selected=${this.state.selected}
				?disabled=${this.state.disabled}
				aria-selected=${this.state.selected ? 'true' : 'false'}
				@click=${this.handleActivate}>
				${this.displayLabel}
			</button>
		`;
	}
}
customElements.define('ui-pick-item', UIPickItem);
export class UIPickList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pickList: './pick-list.css',
	};
	static state = {
		items: [],
		target: [],
		sourceHeading: 'Available',
		targetHeading: 'Selected',
		// Target-pane reorder controls (up / down / top / bottom).
		reorderTarget: true,
	};
	itemKey(item, index) {
		return pickId(item) || index;
	}
	hideReorder() {
		return this.state.reorderTarget !== true;
	}
	/**
	 * Reorder selected target rows.
	 * - ±1: each selected index steps independently (PrimeVue parity — scattered
	 *   selections do NOT collapse into one block).
	 * - start/end: gather selected (relative order kept) to top/bottom.
	 * Disabled rows are never movers (selection-driven), but may be displaced when
	 * a selected row steps past them — position is not locked.
	 * @param {number|'start'|'end'} move - Step or edge.
	 */
	reorderSelected(move) {
		const source = Array.isArray(this.state.target) ? this.state.target.slice() : [];
		const count = source.length;
		if (count < 2) {
			return;
		}
		if (move === 'start' || move === 'end') {
			this.reorderGather(source, move);
			return;
		}
		const step = Number(move) || 0;
		if (step === 0) {
			return;
		}
		// Independent per-index swap: iterate from the leading edge so neighbors
		// don't double-swap in one pass.
		// Payload from/to = topmost mover after the pass (direction-stable).
		let movedCount = 0;
		let topFrom = -1;
		let topTo = -1;
		if (step < 0) {
			for (let index = 0; index < count; index += 1) {
				const item = source[index];
				if (item?.selected !== true || item?.disabled === true) {
					continue;
				}
				const targetIndex = index + step;
				if (targetIndex < 0) {
					continue;
				}
				const neighbor = source[targetIndex];
				if (neighbor?.selected === true && neighbor?.disabled !== true) {
					continue;
				}
				source[index] = neighbor;
				source[targetIndex] = item;
				movedCount += 1;
				if (topFrom < 0 || targetIndex < topTo) {
					topFrom = index;
					topTo = targetIndex;
				}
			}
		} else {
			for (let index = count - 1; index >= 0; index -= 1) {
				const item = source[index];
				if (item?.selected !== true || item?.disabled === true) {
					continue;
				}
				const targetIndex = index + step;
				if (targetIndex >= count) {
					continue;
				}
				const neighbor = source[targetIndex];
				if (neighbor?.selected === true && neighbor?.disabled !== true) {
					continue;
				}
				source[index] = neighbor;
				source[targetIndex] = item;
				movedCount += 1;
				// After swap, this mover is at targetIndex; track topmost (lowest index).
				if (topTo < 0 || targetIndex < topTo) {
					topFrom = index;
					topTo = targetIndex;
				}
			}
		}
		if (movedCount === 0) {
			return;
		}
		this.state.target = source;
		this.emit('pick-list:reorder', {
			target: source,
			// Leading-edge (topmost) mover before/after its swap — same meaning both directions.
			from: topFrom,
			to: topTo,
			count: movedCount,
		});
		this.emitChange();
	}
	/**
	 * Edge gather — selected (!disabled) form one block at start or end.
	 * @param {object[]} source - Mutable copy of target.
	 * @param {'start'|'end'} edge - Top or bottom.
	 */
	reorderGather(source, edge) {
		const selected = [];
		const rest = [];
		let firstFrom = -1;
		const count = source.length;
		for (let index = 0; index < count; index += 1) {
			const item = source[index];
			if (item?.selected === true && item?.disabled !== true) {
				if (firstFrom < 0) {
					firstFrom = index;
				}
				selected.push(item);
			} else {
				rest.push(item);
			}
		}
		if (selected.length === 0 || firstFrom < 0) {
			return;
		}
		const insertAt = edge === 'start' ? 0 : rest.length;
		// Already at edge?
		if (edge === 'start' && firstFrom === 0) {
			let alreadyTop = true;
			for (let index = 0; index < selected.length; index += 1) {
				if (source[index] !== selected[index]) {
					alreadyTop = false;
					break;
				}
			}
			if (alreadyTop) {
				return;
			}
		}
		if (edge === 'end' && firstFrom === count - selected.length) {
			let alreadyBottom = true;
			for (let index = 0; index < selected.length; index += 1) {
				if (source[count - selected.length + index] !== selected[index]) {
					alreadyBottom = false;
					break;
				}
			}
			if (alreadyBottom) {
				return;
			}
		}
		const next = rest.slice(0, insertAt).concat(selected, rest.slice(insertAt));
		this.state.target = next;
		this.emit('pick-list:reorder', {
			target: next,
			from: firstFrom,
			to: insertAt,
			count: selected.length,
		});
		this.emitChange();
	}
	reorderUp() {
		this.reorderSelected(-1);
	}
	reorderDown() {
		this.reorderSelected(1);
	}
	reorderTop() {
		this.reorderSelected('start');
	}
	reorderBottom() {
		this.reorderSelected('end');
	}
	toggleFlag(collection, id) {
		const count = collection.length;
		const needle = String(id);
		for (let index = 0; index < count; index += 1) {
			const item = collection[index];
			if (pickId(item) === needle) {
				item.selected = item.selected !== true;
				return item;
			}
		}
		return null;
	}
	handleSourceSelect(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		this.toggleFlag(this.state.items, id);
	}
	handleTargetSelect(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		this.toggleFlag(this.state.target, id);
	}
	takeSelected(fromList, toList) {
		const moved = [];
		const kept = [];
		const count = fromList.length;
		for (let index = 0; index < count; index += 1) {
			const item = fromList[index];
			if (item.selected === true && item.disabled !== true) {
				item.selected = false;
				moved.push(item);
			} else {
				kept.push(item);
			}
		}
		const nextTarget = toList.slice();
		const movedCount = moved.length;
		for (let index = 0; index < movedCount; index += 1) {
			nextTarget.push(moved[index]);
		}
		return {
			kept,
			moved,
			nextTarget,
		};
	}
	emitChange() {
		this.emit('pick-list:change', {
			items: this.state.items,
			target: this.state.target,
		});
	}
	addSelected() {
		const result = this.takeSelected(this.state.items, this.state.target);
		if (result.moved.length === 0) {
			return;
		}
		this.state.items = result.kept;
		this.state.target = result.nextTarget;
		this.emit('pick-list:add', {
			items: result.moved,
			item: result.moved[0],
		});
		this.emitChange();
	}
	removeSelected() {
		const result = this.takeSelected(this.state.target, this.state.items);
		if (result.moved.length === 0) {
			return;
		}
		this.state.target = result.kept;
		this.state.items = result.nextTarget;
		this.emit('pick-list:remove', {
			items: result.moved,
			item: result.moved[0],
		});
		this.emitChange();
	}
	moveAll(fromKey, toKey, action) {
		const fromList = this.state[fromKey];
		const toList = this.state[toKey].slice();
		const kept = [];
		const moved = [];
		const count = fromList.length;
		for (let index = 0; index < count; index += 1) {
			const item = fromList[index];
			if (item.disabled === true) {
				kept.push(item);
				continue;
			}
			item.selected = false;
			moved.push(item);
			toList.push(item);
		}
		if (moved.length === 0) {
			return;
		}
		this.state[fromKey] = kept;
		this.state[toKey] = toList;
		this.emit(`pick-list:${action}`, {
			items: moved,
			item: moved[0],
		});
		this.emitChange();
	}
	addAll() {
		this.moveAll('items', 'target', 'add');
	}
	removeAll() {
		this.moveAll('target', 'items', 'remove');
	}
	handleListKey(domEvent) {
		if (domEvent.key !== 'Enter' && domEvent.key !== ' ') {
			return;
		}
		const path = domEvent.composedPath();
		const pathCount = path.length;
		for (let index = 0; index < pathCount; index += 1) {
			const node = path[index];
			if (node?.classList?.contains('pk-item') && !node.disabled) {
				domEvent.preventDefault();
				node.click();
				return;
			}
		}
	}
	render() {
		this.html`
			<div class="pk">
				<section class="pk-pane">
					<header class="pk-head">${this.state.sourceHeading}</header>
					<div class="pk-list" role="listbox" tabindex="0" aria-multiselectable="true"
						@pick-item:select=${this.handleSourceSelect}
						@keydown=${this.handleListKey}>
						${this.list('items', UIPickItem, this.itemKey)}
					</div>
				</section>
				<div class="pk-actions">
					<button type="button" class="pk-btn" tooltip="Add selected" aria-label="Add selected" @click=${this.addSelected}>
						<ui-icon .state.name=${'chevron-right'} .state.size=${'sm'}></ui-icon>
					</button>
					<button type="button" class="pk-btn" tooltip="Add all" aria-label="Add all" @click=${this.addAll}>
						<ui-icon .state.name=${'chevrons-right'} .state.size=${'sm'}></ui-icon>
					</button>
					<button type="button" class="pk-btn" tooltip="Remove selected" aria-label="Remove selected" @click=${this.removeSelected}>
						<ui-icon .state.name=${'chevron-left'} .state.size=${'sm'}></ui-icon>
					</button>
					<button type="button" class="pk-btn" tooltip="Remove all" aria-label="Remove all" @click=${this.removeAll}>
						<ui-icon .state.name=${'chevrons-left'} .state.size=${'sm'}></ui-icon>
					</button>
				</div>
				<section class="pk-pane">
					<header class="pk-head">${this.state.targetHeading}</header>
					<div class="pk-target-body">
						<div class="pk-list" role="listbox" tabindex="0" aria-multiselectable="true"
							@pick-item:select=${this.handleTargetSelect}
							@keydown=${this.handleListKey}>
							${this.list('target', UIPickItem, this.itemKey)}
						</div>
						<div class="pk-reorder" ?hidden=${this.hideReorder}>
							<button type="button" class="pk-btn" tooltip="Move to top" aria-label="Move to top" @click=${this.reorderTop}>
								<ui-icon .state.name=${'chevrons-up'} .state.size=${'sm'}></ui-icon>
							</button>
							<button type="button" class="pk-btn" tooltip="Move up" aria-label="Move up" @click=${this.reorderUp}>
								<ui-icon .state.name=${'chevron-up'} .state.size=${'sm'}></ui-icon>
							</button>
							<button type="button" class="pk-btn" tooltip="Move down" aria-label="Move down" @click=${this.reorderDown}>
								<ui-icon .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
							</button>
							<button type="button" class="pk-btn" tooltip="Move to bottom" aria-label="Move to bottom" @click=${this.reorderBottom}>
								<ui-icon .state.name=${'chevrons-down'} .state.size=${'sm'}></ui-icon>
							</button>
						</div>
					</div>
				</section>
			</div>
		`;
	}
}
customElements.define('ui-pick-list', UIPickList);
