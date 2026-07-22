/*
 * ListHandle — imperative view handle for a mounted `list()` / `filter()` /
 * `collection()` spot, registered on `component.lists` by state key.
 *
 * Template still uses `list(key, Row)` / `this.list(key, Row)` as a binding
 * factory. After mount, `this.list(key)` (one arg) returns this handle for
 * find/search/row access — same dual-mode shape as `this.collection(key)`.
 *
 * Data search walks `state[key]`; row access walks the ListSpot keyMap.
 */
import { getValueAtPath } from '../utilities.js';
/**
 * Resolve state array for a list key (supports dotted keys like stores.x.items).
 * @param {object} component - Owning component.
 * @param {string} stateKey - List binding key.
 * @returns {Array|null} Items array or null.
 */
function itemsFor(component, stateKey) {
	const value = getValueAtPath(component.state, stateKey);
	return Array.isArray(value) ? value : null;
}
export class ListHandle {
	constructor(component, stateKey) {
		this.component = component;
		this.stateKey = stateKey;
		this.spot = null;
	}
	attachSpot(spot) {
		this.spot = spot;
	}
	detachSpot(spot) {
		if (this.spot === spot) {
			this.spot = null;
		}
	}
	/** Bound items array (live reactive state). */
	get items() {
		return itemsFor(this.component, this.stateKey);
	}
	get size() {
		const items = this.items;
		return items ? items.length : 0;
	}
	/** Row element for a list key (keyFn result). */
	get(itemKey) {
		return this.spot?.keyMap?.get(itemKey) ?? null;
	}
	/** Row element at source index. */
	at(index) {
		const items = this.items;
		const spot = this.spot;
		if (!items || !spot || index < 0 || index >= items.length) {
			return null;
		}
		const itemKey = spot.keyFn(items[index], index);
		return spot.keyMap?.get(itemKey) ?? null;
	}
	/**
	 * First item matching predicate (data search).
	 * @param {(item: any, index: number) => boolean} predicate - Keep test.
	 * @returns {*|null} Matching item or null.
	 */
	find(predicate) {
		const items = this.items;
		if (!items) {
			return null;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (predicate(items[index], index)) {
				return items[index];
			}
		}
		return null;
	}
	/**
	 * First row element whose item matches predicate.
	 * @param {(item: any, index: number) => boolean} predicate - Keep test.
	 * @returns {Element|null} Row element or null.
	 */
	findRow(predicate) {
		const items = this.items;
		const spot = this.spot;
		if (!items || !spot) {
			return null;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (predicate(items[index], index)) {
				const itemKey = spot.keyFn(items[index], index);
				return spot.keyMap?.get(itemKey) ?? null;
			}
		}
		return null;
	}
	/**
	 * Case-insensitive substring search on a field (default `label`).
	 * @param {string} query - Search string.
	 * @param {string} [field='label'] - Item field name.
	 * @returns {*|null} First matching item or null.
	 */
	search(query, field = 'label') {
		const needle = String(query ?? '').toLowerCase();
		if (!needle) {
			return null;
		}
		return this.find((item) => {
			const hay = item == null ? '' : String(item[field] ?? '');
			return hay.toLowerCase().includes(needle);
		});
	}
	/**
	 * Case-insensitive field search → row element.
	 * @param {string} query - Search string.
	 * @param {string} [field='label'] - Item field name.
	 * @returns {Element|null} Row element or null.
	 */
	searchRow(query, field = 'label') {
		const needle = String(query ?? '').toLowerCase();
		if (!needle) {
			return null;
		}
		return this.findRow((item) => {
			const hay = item == null ? '' : String(item[field] ?? '');
			return hay.toLowerCase().includes(needle);
		});
	}
}
/**
 * Get-or-create + attach a ListHandle for a ListSpot.
 * @param {object} component - Owning component.
 * @param {object} spot - ListSpot instance.
 * @returns {ListHandle} The handle.
 */
export function registerListHandle(component, spot) {
	const stateKey = spot.bindingKey;
	let registry = component.lists;
	if (!registry) {
		registry = new Map();
		component.lists = registry;
	}
	let handle = registry.get(stateKey);
	if (!handle) {
		handle = new ListHandle(component, stateKey);
		registry.set(stateKey, handle);
	}
	handle.attachSpot(spot);
	return handle;
}
/**
 * Detach a ListSpot from its handle (spot teardown).
 * @param {object} component - Owning component.
 * @param {object} spot - ListSpot instance.
 */
export function unregisterListHandle(component, spot) {
	const handle = component.lists?.get(spot.bindingKey);
	if (handle) {
		handle.detachSpot(spot);
	}
}
/**
 * `this.list(key)` one-arg lookup — the mounted ListHandle.
 * @param {string} stateKey - List state key.
 * @returns {ListHandle|null} Handle or null.
 */
export function listCtrl(stateKey) {
	return this.lists?.get(stateKey) ?? null;
}
/**
 * Clear list handles on disconnect (spots already unsubscribed).
 */
export function disposeLists() {
	// Drop the last ref — Map.clear() before null is wasted work.
	this.lists = null;
}
