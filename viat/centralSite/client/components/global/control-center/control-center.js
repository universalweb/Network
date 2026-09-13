import '../icon/icon.js';
import '../switch/switch.js';
import { WebComponent } from 'webcomponent';
import {
	isTopEscapable,
	pushEscapable,
	releaseEscapable,
} from '../../core/escape/escapeStack.js';
import { ControlCenterRow } from '../control-center-row/control-center-row.js';
import { ControlCenterTile } from '../control-center-tile/control-center-tile.js';
/**
 * `<ui-control-center>` — macOS Tahoe–inspired Control Center panel.
 *
 * Blank-slate primitive: pass `tiles` (icon grid toggles) and `items` (switch
 * rows) via `.state=`. Emits `control-center:change` with `{ id, checked, kind }`
 * when any control flips. Host `open` attr controls visibility; call
 * open()/close()/toggle(). Enter/leave motion is the default: the panel
 * scales and fades via CSS transitions. Do not hide the popover until
 * close() finishes that leave.
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
	motionToken = 0;
	/*
	 * Overlay is `popover="manual"` so it paints in the top layer and escapes
	 * ancestor overflow / content-visibility / transform containing blocks.
	 * `position: fixed` alone does not — the preview stage + .demo CV clip it.
	 *
	 * Show the popover at the closed visual BEFORE [open] flips — otherwise
	 * the panel paints already at rest and the enter transition never runs.
	 * hidePopover waits until the leave transition finishes for the same reason.
	 */
	onConnect() {
		// Registered once and guarded per press; the hotkey registry sweeps it on
		// disconnect, so there is no listener to unwind by hand.
		this.hotKey('escape', this.handleEscape, {
			preventDefault: false,
		});
	}
	onDisconnect() {
		releaseEscapable(this);
	}
	// @engram em:network/code/ui-control-center-must-show-popover-before-open-and-delay-hi — show at closed visual before [open]; hide after leave
	open() {
		this.motionToken += 1;
		this.refs.panel?.classList.remove('is-exiting');
		const overlay = this.refs.root;
		if (overlay) {
			this.showSurfacePopover(overlay);
		}
		const panel = this.refs.panel;
		if (panel) {
			this.flushPanel(panel);
		}
		this.attrs.open = true;
		pushEscapable(this);
	}
	close() {
		if (this.attrs.open !== true) {
			return;
		}
		this.attrs.open = false;
		const panel = this.refs.panel;
		if (!panel) {
			this.finishClose();
			return;
		}
		const token = this.motionToken + 1;
		this.motionToken = token;
		return this.afterCloseMotion(this.animateOut({
			target: panel,
			className: 'is-exiting',
		}), token);
	}
	flushPanel(panel) {
		return panel.offsetWidth;
	}
	async afterCloseMotion(motion, token) {
		await motion;
		if (token !== this.motionToken) {
			return;
		}
		this.finishClose();
	}
	finishClose() {
		this.refs.panel?.classList.remove('is-exiting');
		if (this.attrs.open === true) {
			return;
		}
		releaseEscapable(this);
		this.hideSurfacePopover(this.refs.root);
	}
	/*
	 * A `popover="manual"` surface gets NO light-dismiss from the UA, so Escape
	 * has to be wired by hand. The stack guard keeps it honest when something else
	 * is open on top: only the most recent layer answers the key.
	 *
	 * `preventDefault: false` on the registration, then prevent by hand only when
	 * we actually close — same contract app.js uses, so a closed control-center
	 * never swallows Escape from whoever else wants it.
	 */
	handleEscape(keyEvent) {
		if (this.attrs.open !== true || !isTopEscapable(this)) {
			return;
		}
		keyEvent.preventDefault();
		this.close();
	}
	toggle() {
		if (this.attrs.open) {
			this.close();
			return;
		}
		this.open();
	}
	onRendered() {
		if (this.attrs.open) {
			this.showSurfacePopover(this.refs.root);
		}
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
			<div class="control-center-root" #root popover="manual" ?data-open=${this.attrs.open}>
				<div class="control-center-backdrop" @click=${this.handleBackdropClick}></div>
				<section
					class="control-center-panel glass"
					#panel
					role="dialog"
					aria-label=${this.state.heading}
					?inert=${() => {
						return !this.attrs.open;
					}}
					@control-center-tile:toggle=${this.handleTileToggle}
					@control-center-row:change=${this.handleRowChange}>
					<header class="control-center-header">
						<span class="control-center-heading">${this.state.heading}</span>
					</header>
					<div class="control-center-tiles">
						${this.list('tiles', ControlCenterTile)}
					</div>
					<div class="control-center-rows" ?hidden=${() => {
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
