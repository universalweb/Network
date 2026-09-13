/*
	ui-command — ⌘K command palette. Composes UIModal (centered focus-trap
	overlay), UIInput (query), UICollection (filter + virtual list — same
	contract as ActivityLog), ui-command-item (menu-item fields + ui-kbd),
	ui-empty-state, and this.hotKey('mod+k') (same core/hotkeys registry).
	── EVENTS ───────────────────────────────────────────────────────────
	  command:select { item }
	  command:open
	  command:close
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-command .state.items=${[
	    { label: 'Copy', value: 'copy', kbd: 'mod+c', group: 'Edit' },
	  ]} @command:select=${this.run}></ui-command>
	  this.refs.palette.open();
	──────────────────────────────────────────────────────────────────────
*/
import '../empty-state/empty-state.js';
import '../icon/icon.js';
import '../input/input.js';
import '../kbd/kbd.js';
import '../modal/modal.js';
import { isArray, isFunction, WebComponent } from '../../core/index.js';
import { COLLECTION_EVENT } from '../collection/collection.js';
import { optionIdFor, UICommandItem } from '../command-item/command-item.js';
const ROW_STYLES = new URL('./command-rows.css', import.meta.url).href;
/**
 * Default keep-predicate for UICollection.filter / filterArg.
 * Case-insensitive substring over label, then keywords.
 * @param {object} item - Command item.
 * @param {string} query - Live filterArg.
 * @returns {boolean} Whether the row stays visible.
 */
export function matchCommandItem(item, query) {
	if (!item || item.separator) {
		return !query;
	}
	if (!query) {
		return true;
	}
	const needle = String(query).toLowerCase();
	const label = String(item.label ?? '').toLowerCase();
	if (label.includes(needle)) {
		return true;
	}
	const keywords = item.keywords;
	if (typeof keywords === 'string') {
		return keywords.toLowerCase().includes(needle);
	}
	if (!Array.isArray(keywords)) {
		return false;
	}
	const keywordCount = keywords.length;
	for (let index = 0; index < keywordCount; index += 1) {
		if (String(keywords[index]).toLowerCase().includes(needle)) {
			return true;
		}
	}
	return false;
}
function commandItemKey(item, index) {
	return item.key ?? item.value ?? index;
}
export class UICommand extends WebComponent {
	static url = import.meta.url;
	static styles = {
		command: './command.css',
	};
	static state = {
		items: [],
		open: false,
		query: '',
		placeholder: 'Type a command or search…',
		emptyMessage: 'No results found.',
		hotkey: 'mod+k',
		filterFn: null,
		activeIndex: -1,
		rowStyles: ROW_STYLES,
	};
	/* Stable collection config — merged via `.state=`. filter is installed in
	   onConnect so the keep-predicate can read instance filterFn / query. */
	listConfig = {
		loader: null,
		renderRow: UICommandItem,
		keyFn: commandItemKey,
		filter: null,
		showBar: false,
		virtual: true,
		estimatedHeight: 36,
		overscan: 4,
		tableMaxHeight: '20rem',
		pagingStyle: 'button',
		itemNoun: 'commands',
		listbox: true,
		listboxLabel: 'Commands',
	};
	queryKeysBound = null;
	virtualStampHooked = false;
	onConnect() {
		const command = this;
		this.listConfig.loader = function loadCommandItems() {
			return command.loadItems();
		};
		this.listConfig.filter = function keepCommandItem(item, query) {
			return command.runFilter(item, query);
		};
		this.modalFocusTarget = function modalFocusTarget() {
			return command.refs.query;
		};
		this.matchActiveRow = function matchActiveRow(candidate) {
			return command.rowMatchesActive(candidate);
		};
		this.hotKey(this.state.hotkey, this.handleHotkey);
		this.observe('open', this.syncOpen);
		this.observe('items', this.handleItemsChange);
		this.observe('query', this.handleQueryChange);
		this.observe('activeIndex', this.handleActiveChange);
		this.on('keydown', this.handleKeydown);
		if (this.state.open) {
			this.resetActive();
		}
	}
	onRendered() {
		this.wireQueryKeys();
		this.syncInputAria();
		this.hookVirtualStamp();
		this.stampRowFlags();
		this.syncOpen(this.state.open);
	}
	loadItems() {
		const items = this.state.items;
		const list = isArray(items) ? items : [];
		return {
			items: list,
			nextCursor: null,
			hasMore: false,
			totalCount: list.length,
		};
	}
	runFilter(item, query) {
		const custom = this.state.filterFn;
		if (isFunction(custom)) {
			return custom(item, query) === true;
		}
		return matchCommandItem(item, query);
	}
	refreshList() {
		this.emit(COLLECTION_EVENT.REFRESH);
	}
	enabledIndexes() {
		const items = isArray(this.state.items) ? this.state.items : [];
		const query = this.state.query;
		const indexes = [];
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (item && !item.separator && !item.disabled && this.runFilter(item, query)) {
				indexes.push(index);
			}
		}
		return indexes;
	}
	hasVisibleItems() {
		const items = isArray(this.state.items) ? this.state.items : [];
		const query = this.state.query;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (item && !item.separator && this.runFilter(item, query)) {
				return true;
			}
		}
		return false;
	}
	activeOptionId() {
		const item = this.state.items[this.state.activeIndex];
		if (!item || item.separator) {
			return '';
		}
		return optionIdFor(item);
	}
	resetActive() {
		const indexes = this.enabledIndexes();
		const current = this.state.activeIndex;
		if (indexes.indexOf(current) !== -1) {
			return;
		}
		this.state.activeIndex = indexes.length ? indexes[0] : -1;
	}
	/*
	 * active / groupStart are ROW state, never written onto caller items.
	 * Nested item.N.active would notify the `items` bucket and re-enter
	 * handleItemsChange → collection reset (set-loop).
	 */
	stampRowFlags() {
		const list = this.refs.list;
		if (!list) {
			return;
		}
		const rows = isFunction(list.findComponents) ? list.findComponents('ui-command-item') : [];
		const rowCount = rows.length;
		if (!rowCount) {
			return;
		}
		const byValue = new Map();
		for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
			const row = rows[rowIndex];
			if (!row.state.separator) {
				byValue.set(row.state.value, row);
			}
		}
		const items = isArray(this.state.items) ? this.state.items : [];
		const query = this.state.query;
		const activeIndex = this.state.activeIndex;
		let lastGroup = '';
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const item = items[index];
			if (!item || item.separator || !this.runFilter(item, query)) {
				continue;
			}
			const group = item.group || '';
			const groupStart = group !== '' && group !== lastGroup;
			if (group) {
				lastGroup = group;
			}
			const row = byValue.get(item.value);
			if (!row) {
				continue;
			}
			const nextActive = index === activeIndex;
			if (row.state.active !== nextActive || row.state.groupStart !== groupStart) {
				row.assignState({
					active: nextActive,
					groupStart,
				});
			}
		}
	}
	hookVirtualStamp() {
		const list = this.refs.list;
		if (!list || this.virtualStampHooked) {
			return;
		}
		const spot = list.list('items')?.spot;
		if (!spot) {
			return;
		}
		this.virtualStampHooked = true;
		const prior = spot.onVirtualWindow;
		const command = this;
		spot.onVirtualWindow = function onCommandVirtualWindow(windowStart) {
			if (isFunction(prior)) {
				prior.call(list, windowStart);
			}
			command.stampRowFlags();
		};
	}
	scrollActiveIntoView() {
		const item = this.state.items[this.state.activeIndex];
		const list = this.refs.list;
		if (!item || !list) {
			return;
		}
		const row = list.findComponent('ui-command-item', this.matchActiveRow);
		if (row) {
			row.scrollIntoView({
				block: 'nearest',
			});
		}
	}
	handleItemsChange() {
		this.refreshList();
		if (this.state.open) {
			this.resetActive();
		}
	}
	handleQueryChange() {
		const list = this.refs.list;
		if (list && list.state.filterArg !== this.state.query) {
			list.state.filterArg = this.state.query;
		}
		if (this.state.open) {
			this.resetActive();
		}
		this.refreshList();
		this.stampRowFlags();
		this.syncInputAria();
	}
	handleActiveChange() {
		this.stampRowFlags();
		this.scrollActiveIntoView();
		this.syncInputAria();
	}
	handleListPainted() {
		this.stampRowFlags();
		/*
		 * `refs.list` is only reliably resolvable once the collection has painted,
		 * so re-run the ARIA pass here — the open-time pass can run before the
		 * listbox is available and would leave the controls link unset.
		 */
		this.syncInputAria();
	}
	async syncOpen(next) {
		const palette = this.refs.palette;
		if (next) {
			if (palette?.state.open) {
				return;
			}
			palette?.open();
			this.resetActive();
			this.stampRowFlags();
			this.emit('command:open');
			this.wireQueryKeys();
			this.syncInputAria();
			// Two frames: dialog top-layer + slot projection must settle before focus.
			await this.nextFrame();
			await this.nextFrame();
			this.focusQuery();
			return;
		}
		if (palette?.state.open) {
			palette.close();
		}
	}
	focusQuery() {
		const field = this.refs.query;
		if (!field) {
			return;
		}
		if (typeof field.focus === 'function') {
			field.focus();
		}
		field.refs?.input?.focus?.();
	}
	wireQueryKeys() {
		const nativeInput = this.refs.query?.refs?.input;
		if (!nativeInput || this.queryKeysBound === nativeInput) {
			return;
		}
		this.queryKeysBound = nativeInput;
		this.addEvent('keydown', this.handleKeydown, nativeInput);
	}
	/**
	 * Point an ARIA relationship at an ELEMENT rather than an id string.
	 * @param {Element} host - Element carrying the relationship.
	 * @param {string} property - Reflection property, e.g. ariaControlsElements.
	 * @param {Element|Element[]|null} target - What it should point at.
	 * @returns {boolean} True when the property existed and was assigned.
	 */
	linkAriaElement(host, property, target) {
		if (!host || !(property in host)) {
			return false;
		}
		host[property] = target;
		return true;
	}
	/*
	 * ARIA IDREFs cannot cross a shadow boundary, and this palette spans THREE
	 * roots: the real <input> is inside ui-input's, `#command-list` is the
	 * ui-collection host in OUR root, and every ui-command-item is inside
	 * ui-collection's. So `aria-controls="command-list"` was set on an element that
	 * could not see its target. Measured, not assumed: from the input's own
	 * root, getElementById returned null for it.
	 *
	 * `ariaControlsElements` takes an element REFERENCE and IS valid here,
	 * because the collection host sits in a shadow-including ANCESTOR scope of
	 * the input. Verified in-browser: the property reads back as that host.
	 *
	 * `aria-activedescendant` cannot live on the input: the options sit in a
	 * sibling tree (ui-collection's shadow). Hosting a shadow is also not an
	 * ancestor scope, so putting it on the collection HOST is equally inert.
	 * The real relationship is inside the collection: `.collection-rows` (opt-in
	 * `listbox: true`) and the option CEs share that shadow.
	 */
	syncInputAria() {
		const nativeInput = this.refs.query?.refs?.input;
		if (!nativeInput) {
			return;
		}
		nativeInput.setAttribute('role', 'combobox');
		nativeInput.setAttribute('aria-controls', 'command-list');
		nativeInput.setAttribute('aria-autocomplete', 'list');
		nativeInput.setAttribute('aria-expanded', this.state.open ? 'true' : 'false');
		nativeInput.removeAttribute('aria-activedescendant');
		const listbox = this.refs.list;
		this.linkAriaElement(nativeInput, 'ariaControlsElements', listbox ? [listbox] : []);
		this.linkAriaElement(nativeInput, 'ariaActiveDescendantElement', null);
	}
	handleQuery(domEvent) {
		const next = domEvent.detail?.data?.value ?? '';
		if (next !== this.state.query) {
			this.state.query = next;
		}
	}
	handleHotkey() {
		this.toggle();
	}
	handleKeydown(domEvent) {
		if (!this.state.open) {
			return;
		}
		switch (domEvent.key) {
			case 'ArrowDown': {
				domEvent.preventDefault();
				this.move(1);
				break;
			}
			case 'ArrowUp': {
				domEvent.preventDefault();
				this.move(-1);
				break;
			}
			case 'Home': {
				domEvent.preventDefault();
				this.moveToEdge(0);
				break;
			}
			case 'End': {
				domEvent.preventDefault();
				this.moveToEdge(-1);
				break;
			}
			case 'Enter': {
				domEvent.preventDefault();
				this.selectIndex(this.state.activeIndex);
				break;
			}
			default: {
				break;
			}
		}
	}
	move(delta) {
		const indexes = this.enabledIndexes();
		if (!indexes.length) {
			return;
		}
		const position = indexes.indexOf(this.state.activeIndex);
		let next;
		if (position === -1) {
			next = delta > 0 ? indexes[0] : indexes[indexes.length - 1];
		} else {
			next = indexes[(position + delta + indexes.length) % indexes.length];
		}
		this.state.activeIndex = next;
	}
	moveToEdge(edge) {
		const indexes = this.enabledIndexes();
		if (!indexes.length) {
			return;
		}
		this.state.activeIndex = edge < 0 ? indexes[indexes.length - 1] : indexes[0];
	}
	rowMatchesActive(candidate) {
		const item = this.state.items[this.state.activeIndex];
		return Boolean(item) && candidate.state.value === item.value;
	}
	indexOfValue(value) {
		const items = this.state.items;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index += 1) {
			const candidate = items[index];
			if (candidate && !candidate.separator && candidate.value === value) {
				return index;
			}
		}
		return -1;
	}
	handleItemSelect(domEvent) {
		this.selectIndex(this.indexOfValue(domEvent.detail?.data?.value));
	}
	selectIndex(index) {
		const item = this.state.items[index];
		if (!item || item.disabled || item.separator) {
			return;
		}
		const action = item.action;
		if (isFunction(action)) {
			action(item);
		}
		this.emit('command:select', {
			item,
		});
		this.close();
	}
	handleModalClose() {
		if (!this.state.open) {
			return;
		}
		this.assignState({
			open: false,
			query: '',
			activeIndex: -1,
		});
		this.emit('command:close');
	}
	open() {
		if (this.state.open) {
			return;
		}
		this.state.open = true;
	}
	close() {
		if (!this.state.open) {
			return;
		}
		this.refs.palette?.close();
		if (this.state.open) {
			this.handleModalClose();
		}
	}
	toggle() {
		if (this.state.open) {
			this.close();
			return;
		}
		this.open();
	}
	render() {
		this.html`
			<div class="command">
				<ui-modal #palette
					.state.modal=${true}
					.state.skin=${'glass'}
					.state.closeOnBackdrop=${true}
					.state.autoFocus=${this.modalFocusTarget}
					@modal:close=${this.handleModalClose}>
					<div class="command-dialog" role="dialog" aria-label="Command palette" aria-modal="true">
						<ui-input #query
							class="command-field"
							.state.value=${this.state.query}
							.state.placeholder=${this.state.placeholder}
							.state.type=${'search'}
							.state.size=${'md'}
							@input:input=${this.handleQuery}>
							<ui-icon slot="leading" .state.name=${'search'} .state.size=${'sm'}></ui-icon>
						</ui-input>
						<div class="command-listbox">
							<ui-collection #list
								id="command-list"
								.state=${this.listConfig}
								.state.filterArg=${this.state.query}
								.state.activeId=${this.activeOptionId}
								.state.emptyMessage=${this.state.emptyMessage}
								.importStyles=${this.state.rowStyles}
								@items:loaded=${this.handleListPainted}
								@command-item:select=${this.handleItemSelect}></ui-collection>
							<ui-empty-state
								class="command-empty"
								?hidden=${this.hasVisibleItems}
								.state.heading=${this.state.emptyMessage}></ui-empty-state>
						</div>
					</div>
				</ui-modal>
			</div>
		`;
	}
}
customElements.define('ui-command', UICommand);
