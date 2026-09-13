/*
	DESCRIPTION: ui-toggle-group — a segmented single/multi selector (1H · 24H · 7D …).
	Binds `items` straight off state via `list()` — items pass through as-is; each
	<ui-toggle-option> owns its render from its own fields + defaults. The parent owns
	selection only: it stamps `item.active` at EVENT/observe time (never a per-render
	loop) and the deep flag write flows to the child through the list binding. Sizing
	is group config → CSS custom properties on the container (no per-item copies).
	Single mode tracks `value`; multi mode tracks `values[]`.
	Multi-only rails (plain <button>, never list rows / never options):
	  selectAll  — pinned leading toggle. First click writes every option value into
	               values[]; second click (already all-selected) writes [].
	  clearable  — pinned trailing control. Always writes [].
	overflow is a CSS mode written once to data-overflow: auto | scroll | wrap.
	  auto/scroll — middle strip is the only scroller (rails stay pinned).
	  wrap        — options wrap; no inline scroll.
	Emits toggle-group:change { value, values, source }.
	  source is 'option' | 'select-all' | 'clear'. Rails send value: null (never '').
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-toggle-group .state.items=${[
	    { value: '1h', label: '1H' }, { value: '24h', label: '24H' }, { value: '7d', label: '7D' },
	  ]} .state.value=${'24h'}></ui-toggle-group>
	  A parent listens with a template event, never addEventListener:
	  <ui-toggle-group … @toggle-group:change=${this.handleRange}></ui-toggle-group>   // e.detail.data.value
	  Multi: .state.multiple=${true} .state.values=${['a','c']} → detail.data.values is the active set.
	  Rails: .state.selectAll=${true} .state.clearable=${true} .state.overflow=${'auto'}
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { movingIndicator, WebComponent } from 'webcomponent';
import { UIToggleOption } from '../toggle-option/toggle-option.js';
const SIZES = new Set([
	'sm',
	'md',
	'lg',
]);
const OVERFLOWS = new Set([
	'auto',
	'scroll',
	'wrap',
]);
export class UIToggleGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		rail: '../../core/dom/rail.css',
		toggleGroup: './toggle-group.css',
	};
	static state = {
		items: [],
		value: '',
		values: [],
		multiple: false,
		size: 'md',
		selectAll: false,
		selectAllIcon: {
			name: 'list-checks',
			size: 'sm',
		},
		selectAllLabel: 'All',
		clearable: false,
		clearIcon: {
			name: 'filter-x',
			size: 'sm',
		},
		clearLabel: 'Clear',
		overflow: 'auto',
	};
	indicatorController = null;
	stripObserver = null;
	isActive(value) {
		if (this.state.multiple === true) {
			return Array.isArray(this.state.values) && this.state.values.indexOf(value) !== -1;
		}
		return this.state.value === value;
	}
	onConnect() {
		/*
		 * Selection is parent-owned but lives ON the bound items as a deep flag —
		 * stamped here whenever the selection inputs change (event-time, not a
		 * per-render map). Deep `item.active` writes notify the list binding,
		 * which routes them into the existing children via assignState.
		 */
		this.observe([
			'value',
			'values',
			'items',
			'multiple',
			'size',
			'overflow',
		], this.onSelectionChange);
		this.syncActive();
	}
	onMount() {
		this.indicatorController = movingIndicator(this.refs.indicator, {
			prefix: 'tgind',
		});
		const strip = this.refs.scroll;
		if (strip && typeof ResizeObserver !== 'undefined') {
			if (!this.onStripResizeTick) {
				this.onStripResizeTick = () => {
					this.onStripResize();
				};
			}
			this.stripObserver = new ResizeObserver(this.onStripResizeTick);
			this.stripObserver.observe(strip);
		}
		this.syncIndicator(true);
		this.syncOverflow();
	}
	onRendered() {
		this.syncOverflow();
	}
	onStripResize() {
		this.syncIndicator(this.indicatorPrimed !== true);
		this.indicatorPrimed = true;
		this.syncOverflow();
	}
	onDisconnect() {
		this.stripObserver?.disconnect();
		this.stripObserver = null;
		this.indicatorPrimed = false;
		this.indicatorController?.destroy();
		this.indicatorController = null;
	}
	onSelectionChange() {
		this.syncActive();
		this.syncIndicator();
		this.syncOverflow();
	}
	syncOverflow() {
		const scroller = this.refs.scroll;
		if (!scroller) {
			return;
		}
		const overflowing = this.state.overflow !== 'wrap' &&
			scroller.scrollWidth > scroller.clientWidth + 1;
		/*
		 * Fade is the class, not a data-* hook. uwc.util-scroll-fade is in the
		 * shadow manifest, so `.scroll-fade-x` resolves inside this root —
		 * moduleParity.test.js pins that. An attribute would paint nothing.
		 */
		scroller.classList.toggle('scroll-fade-x', overflowing);
	}
	syncIndicator(skipTransition = false) {
		const controller = this.indicatorController;
		if (!controller) {
			return;
		}
		if (this.state.multiple === true) {
			controller.hide();
			return;
		}
		controller.moveTo(this.selectedOption(), skipTransition);
	}
	/*
	 * Resolve the target from the SELECTED VALUE, not from the child's `active`
	 * flag.
	 *
	 * `syncActive()` writes `item.active` into the items DATA, and that only
	 * reaches the child components on the next flush — but onSelectionChange calls
	 * syncIndicator synchronously straight afterwards. Reading `option.state.active`
	 * there sampled the PREVIOUS selection: no child matched yet, `moveTo` got
	 * null, and the indicator simply stayed put. That was the "slides to the wrong
	 * section" bug.
	 *
	 * `state.value` is the source of truth and is already correct at this point,
	 * so matching on it is race-free and needs no deferral.
	 */
	selectedOption() {
		const selected = this.state.value;
		return this.findComponent('ui-toggle-option', (option) => {
			return option.state?.value === selected;
		}) ?? null;
	}
	syncActive() {
		const items = this.state.items;
		if (!Array.isArray(items)) {
			return;
		}
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			const active = this.isActive(item?.value);
			if (item && item.active !== active) {
				item.active = active;
			}
		}
	}
	allSelected() {
		const items = this.state.items;
		if (!Array.isArray(items) || items.length === 0) {
			return false;
		}
		const selected = Array.isArray(this.state.values) ? this.state.values : [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (selected.indexOf(items[index]?.value) === -1) {
				return false;
			}
		}
		return true;
	}
	allPressed() {
		return this.allSelected() ? 'true' : 'false';
	}
	allOptionValues() {
		const items = this.state.items;
		const next = [];
		if (!Array.isArray(items)) {
			return next;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			next.push(items[index]?.value);
		}
		return next;
	}
	hideSelectAll() {
		return this.state.multiple !== true || this.state.selectAll !== true;
	}
	hideClearAll() {
		return this.state.multiple !== true || this.state.clearable !== true;
	}
	emitChange(source, clicked) {
		const multi = this.state.multiple === true;
		this.emit('toggle-group:change', {
			value: multi ? clicked : this.state.value,
			values: multi ? this.state.values : [this.state.value],
			source,
		});
	}
	handleSelectAll() {
		if (this.allSelected()) {
			this.state.values = [];
		} else {
			this.state.values = this.allOptionValues();
		}
		this.emitChange('select-all', null);
	}
	handleClearAll() {
		this.state.values = [];
		this.emitChange('clear', null);
	}
	handleSelect(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (value === undefined) {
			return;
		}
		if (this.state.multiple === true) {
			const next = new Set(Array.isArray(this.state.values) ? this.state.values : []);
			if (next.has(value)) {
				next.delete(value);
			} else {
				next.add(value);
			}
			this.state.values = Array.from(next);
		} else {
			this.state.value = value;
		}
		this.emitChange('option', value);
	}
	render() {
		this.html`
			<div
				class="rail-shell toggle-group"
				#group
				data-size=${SIZES.has(this.state.size) ? this.state.size : 'md'}
				?data-multiple=${this.state.multiple === true}
				data-overflow=${OVERFLOWS.has(this.state.overflow) ? this.state.overflow : 'auto'}
				role="group" @toggle-group:select=${this.handleSelect}>
				<button
					class="tg-rail tg-rail-lead"
					type="button"
					?hidden=${this.hideSelectAll}
					aria-label=${this.state.selectAllLabel || 'All'}
					aria-pressed=${this.allPressed}
					?data-active=${this.allSelected}
					@click=${this.handleSelectAll}>
					<ui-icon .state=${this.state.selectAllIcon}></ui-icon>
				</button>
				<div class="tg-scroll" #scroll>
					<div class="toggle-group-indicator" #indicator></div>
					${this.list('items', UIToggleOption, this.optionKey)}
				</div>
				<button
					class="tg-rail tg-rail-trail"
					type="button"
					?hidden=${this.hideClearAll}
					aria-label=${this.state.clearLabel || 'Clear'}
					@click=${this.handleClearAll}>
					<ui-icon .state=${this.state.clearIcon}></ui-icon>
				</button>
			</div>
		`;
	}
	optionKey(item) {
		return item.value;
	}
}
customElements.define('ui-toggle-group', UIToggleGroup);
