import '../icon/icon.js';
import '../switch/switch.js';
import { WebComponent } from 'webcomponent';
import { ControlCenterTile } from '../control-center-tile/control-center-tile.js';
import { ControlCenterRow } from '../control-center-row/control-center-row.js';

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
