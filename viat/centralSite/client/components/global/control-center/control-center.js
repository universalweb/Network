import '../icon/icon.js';
import '../switch/switch.js';
import { WebComponent } from 'webcomponent';
/*
 * Tile row for the control-center grid. Raw item → state; emits
 * `control-center-tile:toggle` with { id, item, checked }.
 */
class ControlCenterTile extends WebComponent {
	static url = import.meta.url;
	static styles = {
		controlCenterTile: './control-center-tile.css',
	};
	static state = {
		itemId: '',
		label: '',
		icon: '',
		description: '',
		checked: false,
		disabled: false,
		tone: 'neutral',
	};
	handleClick() {
		if (this.state.disabled) {
			return;
		}
		const checked = !this.state.checked;
		this.state.checked = checked;
		const itemId = this.state.itemId;
		this.emit('control-center-tile:toggle', {
			id: itemId,
			item: {
				id: itemId,
				label: this.state.label,
				icon: this.state.icon,
				description: this.state.description,
				checked,
				disabled: this.state.disabled,
				tone: this.state.tone,
			},
			checked,
		});
	}
	render() {
		this.html`
			<button
				type="button"
				class="cc-tile"
				data-tone=${this.state.tone || 'neutral'}
				?data-checked=${this.state.checked}
				?disabled=${this.state.disabled}
				aria-pressed=${() => {
					return this.state.checked ? 'true' : 'false';
				}}
				@click=${this.handleClick}>
				<span class="cc-tile-icon" aria-hidden="true">
					<ui-icon .state.name=${this.state.icon} .state.size=${'md'}></ui-icon>
				</span>
				<span class="cc-tile-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-control-center-tile', ControlCenterTile);
/*
 * Switch-row for secondary control-center settings (volume-like toggles).
 */
class ControlCenterRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		controlCenterRow: './control-center-row.css',
	};
	static state = {
		itemId: '',
		label: '',
		icon: '',
		description: '',
		checked: false,
		disabled: false,
	};
	handleSwitchChange(domEvent) {
		const checked = Boolean(domEvent.detail?.data?.checked ?? domEvent.detail?.data?.value);
		this.state.checked = checked;
		this.emit('control-center-row:change', {
			id: this.state.itemId,
			item: {
				id: this.state.itemId,
				label: this.state.label,
				icon: this.state.icon,
				description: this.state.description,
				checked,
				disabled: this.state.disabled,
			},
			checked,
		});
	}
	render() {
		this.html`
			<div class="cc-row" ?data-disabled=${this.state.disabled}>
				<span class="cc-row-icon" aria-hidden="true">
					<ui-icon .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
				</span>
				<div class="cc-row-text">
					<span class="cc-row-label">${this.state.label}</span>
					<span class="cc-row-desc" ?hidden=${() => {
						return !this.state.description;
					}}>${this.state.description}</span>
				</div>
				<ui-switch
					.state.checked=${this.state.checked}
					.state.disabled=${this.state.disabled}
					@switch:change=${this.handleSwitchChange}></ui-switch>
			</div>
		`;
	}
}
customElements.define('ui-control-center-row', ControlCenterRow);
/**
 * `<ui-control-center>` — macOS Tahoe–inspired Control Center panel.
 *
 * Blank-slate primitive: pass `tiles` (icon grid toggles) and `items` (switch
 * rows) via `.state=`. Emits `control-center:change` with `{ id, checked, kind }`
 * when any control flips. Host `open` attr controls visibility; call
 * open()/close()/toggle() or bind `centerOpen`.
 *
 * @example
 * <ui-control-center .state=${{
 *   tiles: [
 *     { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', checked: true },
 *     { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', checked: false },
 *   ],
 *   items: [
 *     { id: 'airdrop', label: 'AirDrop', icon: 'radio', checked: true },
 *   ],
 * }}></ui-control-center>
 */
export class UIControlCenter extends WebComponent {
	static url = import.meta.url;
	static styles = {
		controlCenter: './control-center.css',
	};
	static attrs = {
		open: false,
	};
	static state = {
		heading: 'Control Center',
		tiles: [],
		items: [],
	};
	open() {
		this.attrs.open = true;
	}
	close() {
		this.attrs.open = false;
	}
	toggle() {
		this.attrs.open = !this.attrs.open;
	}
	handleTileToggle(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.syncTileChecked(data.id, data.checked);
		this.emit('control-center:change', {
			id: data.id,
			checked: data.checked,
			kind: 'tile',
			item: data.item,
		});
	}
	handleRowChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.syncRowChecked(data.id, data.checked);
		this.emit('control-center:change', {
			id: data.id,
			checked: data.checked,
			kind: 'row',
			item: data.item,
		});
	}
	syncTileChecked(itemId, checked) {
		const tiles = this.state.tiles;
		const tileCount = tiles.length;
		for (let index = 0; index < tileCount; index++) {
			const tile = tiles[index];
			const tileKey = tile.itemId ?? tile.id;
			if (tileKey === itemId) {
				tile.checked = checked;
				return;
			}
		}
	}
	syncRowChecked(itemId, checked) {
		const items = this.state.items;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index++) {
			const item = items[index];
			const itemKey = item.itemId ?? item.id;
			if (itemKey === itemId) {
				item.checked = checked;
				return;
			}
		}
	}
	handleBackdropClick() {
		this.close();
	}
	/*
	 * Item shape uses `id` (list key / API); row components use `itemId` (id is a
	 * forbidden static-state key on components). Mirror once before paint.
	 */
	ensureItemIds(collection) {
		const items = collection;
		const itemCount = items.length;
		for (let index = 0; index < itemCount; index++) {
			const item = items[index];
			if (item.itemId == null && item.id != null) {
				item.itemId = item.id;
			}
		}
	}
	beforeRender() {
		this.ensureItemIds(this.state.tiles);
		this.ensureItemIds(this.state.items);
	}
	render() {
		this.html`
			<div class="cc-root" ?data-open=${this.attrs.open}>
				<div class="cc-backdrop" @click=${this.handleBackdropClick}></div>
				<section
					class="cc-panel"
					role="dialog"
					aria-label=${this.state.heading}
					?inert=${() => {
						return !this.attrs.open;
					}}
					@control-center-tile:toggle=${this.handleTileToggle}
					@control-center-row:change=${this.handleRowChange}>
					<header class="cc-header">
						<span class="cc-heading">${this.state.heading}</span>
					</header>
					<div class="cc-tiles">
						${this.list('tiles', ControlCenterTile)}
					</div>
					<div class="cc-rows" ?hidden=${() => {
						return this.state.items.length === 0;
					}}>
						${this.list('items', ControlCenterRow)}
					</div>
					<slot></slot>
				</section>
			</div>
		`;
	}
}
customElements.define('ui-control-center', UIControlCenter);
