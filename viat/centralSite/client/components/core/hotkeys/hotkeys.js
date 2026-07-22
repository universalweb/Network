/*
 * Keyboard subsystem — one master keydown listener, one canonical-combo
 * normalizer, one registry. Two front-ends share it:
 *   • programmatic — `this.hotKey(combo, callback, options)` on any WebComponent
 *   • declarative  — the `hotkey="combo"` template behavior (behaviors/hotkey.js)
 *
 * A combo is a SET of keys held simultaneously — order-insensitive. The
 * canonical form lowercases, resolves aliases, sorts the tokens and joins with
 * '+', so `a+b` ≡ `b+a` and a registration always agrees with the combo rebuilt
 * from a live keydown. Importing this module is inert — listeners attach lazily
 * on the first `registerHotkey()` and detach when the registry empties.
 */
import { isApple } from '../environment/device.js';
import { settleEventResult } from '../events/settle.js';
import { getOrInit, isPromiseLike, weakRefFor } from '../utilities.js';
// Spec-token aliases → canonical. Canonical modifiers: ctrl, alt, shift, meta.
const MODIFIER_ALIASES = {
	cmd: 'meta',
	command: 'meta',
	control: 'ctrl',
	option: 'alt',
	super: 'meta',
	win: 'meta',
	windows: 'meta',
};
const KEY_ALIASES = {
	del: 'delete',
	down: 'arrowdown',
	esc: 'escape',
	left: 'arrowleft',
	return: 'enter',
	right: 'arrowright',
	spacebar: 'space',
	up: 'arrowup',
};
/*
 * Modifiers that let a bare combo fire while a field is focused (input guard).
 * `shift` is excluded — `Shift`+key is ordinary typing, not a shortcut.
 */
const BYPASS_MODIFIERS = new Set([
	'alt', 'ctrl', 'meta',
]);
/*
 * `KeyboardEvent.key` values for the modifier keys themselves — never held;
 * their state is read from the event's modifier flags instead.
 */
const MODIFIER_KEYS = new Set([
	'Alt', 'AltGraph', 'Control', 'Meta', 'Shift',
]);
const EMPTY_OPTIONS = {};
/*
 * Returned when `combo` canonicalises to empty — a stable sentinel so the
 * caller still gets the standard `{ entry, unregister }` shape without a null
 * check at every site.
 */
const EMPTY_REGISTRATION = {
	entry: null,
	unregister() {},
};
/**
 * Resolve a registration spec ('mod+k', 'b+a', 'Shift+Esc') to canonical form.
 * A shifted symbol is registered as its glyph (`~`, `|`) — never `shift+`<base>;
 * see `comboFromEvent` for why.
 */
export function canonicalizeCombo(spec) {
	const tokens = String(spec).toLowerCase().split('+');
	const parts = [];
	const tokensLength = tokens.length;
	for (let index = 0; index < tokensLength; index += 1) {
		let token = tokens[index].trim();
		if (!token) {
			continue;
		}
		if (token === 'mod') {
			token = isApple ? 'meta' : 'ctrl';
		} else if (MODIFIER_ALIASES[token]) {
			token = MODIFIER_ALIASES[token];
		} else if (KEY_ALIASES[token]) {
			token = KEY_ALIASES[token];
		}
		if (parts.indexOf(token) === -1) {
			parts.push(token);
		}
	}
	parts.sort();
	return parts.join('+');
}
/*
 * Held-key tracking. Keyed by physical key id (`KeyboardEvent.code`) so keydown
 * and keyup stay symmetric even when a modifier is released mid-press and the
 * glyph changes (`~` down, `` ` `` up). The value is the glyph used in combos.
 */
const heldKeys = new Map();
let masterAttached = false;
// @engram em:network/code/hotkeys-e1-e9-3-lossless-keydown-caches-the-synthetic-repeat — invalidation contract + how the probe tests prove the cache is consulted
/*
 * Repeat-combo cache. OS auto-repeat fires keydown storms with an unchanged
 * (code, modifier-bits) pair, and only the last-pressed key repeats — so the
 * canonical combo cannot differ between consecutive repeats. Valid only while
 * heldKeys is untouched since the cache write: every mutation site either
 * refreshes it (onKeydown) or clears it (keyup, blur, detach, codeless event).
 * `null` is the empty sentinel — `KeyboardEvent.code` is never null.
 */
let repeatCode = null;
let repeatBits = 0;
let repeatCanonical = '';
/*
 * Bypass-ness is fixed per canonical string, and comboHasBypassModifier only
 * runs for canonicals with a live bucket, so this is bounded by registered
 * combos. Cleared with the registry when the master listener detaches.
 */
const bypassCache = new Map();
function isModifierKey(rawKey) {
	return MODIFIER_KEYS.has(rawKey);
}
/*
 * All four flags, shift included — releasing Shift mid-repeat never reaches
 * onKeyup's invalidation (modifier keyups early-return), so the bits compare
 * is what catches it.
 */
function modifierBits(keyEvent) {
	let bits = 0;
	if (keyEvent.ctrlKey) {
		bits |= 1;
	}
	if (keyEvent.altKey) {
		bits |= 2;
	}
	if (keyEvent.metaKey) {
		bits |= 4;
	}
	if (keyEvent.shiftKey) {
		bits |= 8;
	}
	return bits;
}
function normalizeEventKey(rawKey) {
	const lower = rawKey.toLowerCase();
	return lower === ' ' ? 'space' : lower;
}
function physicalId(keyEvent, glyph) {
	return keyEvent.code || glyph;
}
/**
 * `shift` carries information only for letters and named keys. For a shifted
 * symbol the glyph already encodes it (`~`, not `` ` ``), so adding `shift`
 * would double-count and never match a `~` registration.
 */
function shiftIsMeaningful() {
	for (const glyph of heldKeys.values()) {
		if (glyph.length > 1 || (glyph >= 'a' && glyph <= 'z')) {
			return true;
		}
	}
	return false;
}
function comboFromEvent(keyEvent) {
	const parts = [];
	if (keyEvent.ctrlKey) {
		parts.push('ctrl');
	}
	if (keyEvent.altKey) {
		parts.push('alt');
	}
	if (keyEvent.metaKey) {
		parts.push('meta');
	}
	if (keyEvent.shiftKey && shiftIsMeaningful()) {
		parts.push('shift');
	}
	for (const glyph of heldKeys.values()) {
		if (parts.indexOf(glyph) === -1) {
			parts.push(glyph);
		}
	}
	parts.sort();
	return parts.join('+');
}
function onKeydown(keyEvent) {
	const rawKey = keyEvent.key;
	if (!rawKey || isModifierKey(rawKey)) {
		return;
	}
	const bits = modifierBits(keyEvent);
	/*
	 * Repeat hit — the held set is provably unchanged (any mutation cleared the
	 * cache), so skip the Map.set and the whole combo rebuild.
	 */
	if (keyEvent.repeat === true && keyEvent.code === repeatCode && bits === repeatBits) {
		dispatch(repeatCanonical, keyEvent);
		return;
	}
	const glyph = normalizeEventKey(rawKey);
	heldKeys.set(physicalId(keyEvent, glyph), glyph);
	let canonical;
	/*
	 * Ordinary typing fast path: no modifier flags and one held key means the
	 * only heldKeys value is the glyph just set — identical to what
	 * comboFromEvent's collect+sort+join would produce for a single part.
	 */
	if (bits === 0 && heldKeys.size === 1) {
		canonical = glyph;
	} else {
		canonical = comboFromEvent(keyEvent);
	}
	if (keyEvent.code) {
		repeatCode = keyEvent.code;
		repeatBits = bits;
		repeatCanonical = canonical;
	} else {
		repeatCode = null;
	}
	dispatch(canonical, keyEvent);
}
function onKeyup(keyEvent) {
	const rawKey = keyEvent.key;
	if (!rawKey || isModifierKey(rawKey)) {
		return;
	}
	heldKeys.delete(physicalId(keyEvent, normalizeEventKey(rawKey)));
	repeatCode = null;
}
function clearHeld() {
	heldKeys.clear();
	repeatCode = null;
}
function ensureMasterListener() {
	if (masterAttached) {
		return;
	}
	masterAttached = true;
	document.addEventListener('keydown', onKeydown, {
		capture: true,
	});
	document.addEventListener('keyup', onKeyup, {
		capture: true,
	});
	globalThis.addEventListener('blur', clearHeld);
}
function detachMasterListener() {
	if (!masterAttached) {
		return;
	}
	masterAttached = false;
	document.removeEventListener('keydown', onKeydown, {
		capture: true,
	});
	document.removeEventListener('keyup', onKeyup, {
		capture: true,
	});
	globalThis.removeEventListener('blur', clearHeld);
	heldKeys.clear();
	repeatCode = null;
	bypassCache.clear();
}
/*
 * Registry: canonicalCombo → Set<Entry>. Each Entry holds a WeakRef to its
 * target, so the registry never pins a component or element. The
 * FinalizationRegistry is the safety net for targets GC'd without cleanup.
 */
const registry = new Map();
const finalizationRegistry = new FinalizationRegistry(pruneEntry);
function makeEntrySet() {
	return new Set();
}
function pruneEntry(entry) {
	const bucket = registry.get(entry.combo);
	if (!bucket) {
		return;
	}
	bucket.delete(entry);
	if (bucket.size === 0) {
		registry.delete(entry.combo);
	}
	if (registry.size === 0) {
		detachMasterListener();
	}
}
function isEditableTarget(node) {
	if (!node || node.nodeType !== 1) {
		return false;
	}
	const tag = node.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
		return true;
	}
	return node.isContentEditable === true;
}
function comboHasBypassModifier(canonical) {
	let bypass = bypassCache.get(canonical);
	if (bypass === undefined) {
		bypass = false;
		const tokens = canonical.split('+');
		const tokensLength = tokens.length;
		for (let index = 0; index < tokensLength; index += 1) {
			if (BYPASS_MODIFIERS.has(tokens[index])) {
				bypass = true;
				break;
			}
		}
		bypassCache.set(canonical, bypass);
	}
	return bypass;
}
// @engram em:network/code/ispromiselike-gates-catch-at-6-sites-2-were-live-crashes-use — why isPromiseLike + .catch is a bug at any user-handler boundary
/*
 * The combo is the hotkey's event name, and there is no element — the master
 * listener sits on `document`, so the target IS the owner. Settling (not
 * `.catch`) because isPromiseLike only proves `.then` exists: a bare thenable
 * has no `.catch` to call, which threw a TypeError inside dispatch and took the
 * remaining hotkeys of that keystroke down with it.
 */
function invokeHandler(entry, target, keyEvent, canonical) {
	const result = entry.handler.call(target, keyEvent, canonical);
	if (isPromiseLike(result)) {
		settleEventResult(result, target, keyEvent, null, canonical);
	}
}
function dispatch(canonical, keyEvent) {
	const bucket = registry.get(canonical);
	if (!bucket || bucket.size === 0) {
		return;
	}
	const bareWhileTyping = isEditableTarget(keyEvent.composedPath()[0]) &&
		!comboHasBypassModifier(canonical);
	const isRepeat = keyEvent.repeat === true;
	let handlerRan = false;
	let blockDefault = false;
	/*
	 * Deleting a dead entry mid-iteration is safe: Set iteration order is
	 * insertion order and a removed member is simply not revisited.
	 */
	for (const entry of bucket) {
		const target = entry.targetRef.deref();
		if (!target) {
			bucket.delete(entry);
			finalizationRegistry.unregister(entry);
			continue;
		}
		if (target.isConnected === false) {
			continue;
		}
		const options = entry.options;
		if (isRepeat && !options.allowRepeat) {
			continue;
		}
		if (bareWhileTyping && !options.whileTyping) {
			continue;
		}
		handlerRan = true;
		if (options.preventDefault !== false) {
			blockDefault = true;
		}
		invokeHandler(entry, target, keyEvent, canonical);
	}
	if (bucket.size === 0) {
		registry.delete(canonical);
		if (registry.size === 0) {
			detachMasterListener();
		}
	}
	if (handlerRan && blockDefault) {
		keyEvent.preventDefault();
	}
}
/**
 * Release a single entry — detach from the GC net, prune from its bucket, and
 * cascade the empty-bucket → empty-registry → detach-master-listener chain.
 * The canonical teardown operation; manual unregister (from `registerHotkey`'s
 * returned closure) and the lifecycle sweep both route through it.
 */
export function releaseHotkeyEntry(entry) {
	finalizationRegistry.unregister(entry);
	pruneEntry(entry);
}
/**
 * Sweep a component's `hotkeyEntries` set on disconnect — releases each entry
 * then empties the set. Safe on an empty or undefined set (components that
 * never registered a hotkey still hit this path).
 */
export function sweepHotkeyEntries(entries) {
	if (!entries || entries.size === 0) {
		return;
	}
	entries.forEach(releaseHotkeyEntry);
	entries.clear();
}
/**
 * Low-level registration shared by every front-end. `target` is a WebComponent
 * (programmatic) or an Element (template). `options`: { whileTyping, allowRepeat,
 * preventDefault }.
 *
 * Returns the entry, or `null` when `combo` canonicalises to empty. The entry
 * IS the teardown handle — it is its own key in every Set it lives in (the
 * registry bucket and the component's `hotkeyEntries`), so removal is always
 * O(1) and never has to search: pass it to `releaseHotkeyEntry`. Allocation-
 * free beyond the entry itself — no wrapper object, no unregister closure.
 */
export function createHotkeyEntry(target, combo, handler, source, options) {
	const canonical = canonicalizeCombo(combo);
	if (!canonical) {
		return null;
	}
	const entry = {
		combo: canonical,
		handler,
		options: options || EMPTY_OPTIONS,
		source: source || 'api',
		targetRef: weakRefFor(target),
	};
	getOrInit(registry, canonical, makeEntrySet).add(entry);
	ensureMasterListener();
	finalizationRegistry.register(target, entry, entry);
	return entry;
}
/**
 * Public wrapper for consumers that want a self-contained `{ entry, unregister }`
 * binding. Framework-internal paths (the template behavior, `hotKey()` below)
 * use `createHotkeyEntry` + `releaseHotkeyEntry` directly and skip this
 * allocation.
 */
export function registerHotkey(target, combo, handler, source, options) {
	const entry = createHotkeyEntry(target, combo, handler, source, options);
	if (!entry) {
		return EMPTY_REGISTRATION;
	}
	return {
		entry,
		unregister() {
			releaseHotkeyEntry(entry);
		},
	};
}
/**
 * Programmatic front-end — mixed onto WebComponent.prototype by base.js, so
 * `this` is the component. The entry itself is tracked in `this.hotkeyEntries`
 * (no per-registration closure stored) and released by the lifecycle sweep on
 * disconnect. The returned releaser is the public API for the rare manual-
 * release case; if the caller drops it, it is collected — only the entry
 * stays live.
 */
export function hotKey(combo, callback, options) {
	const component = this;
	const entry = createHotkeyEntry(component, combo, callback, 'api', options);
	if (!entry) {
		return EMPTY_REGISTRATION.unregister;
	}
	(component.hotkeyEntries ??= new Set()).add(entry);
	return function releaseHotkey() {
		releaseHotkeyEntry(entry);
		component.hotkeyEntries?.delete(entry);
	};
}
/**
 * Live components also bound to `combo`, excluding `this` — lets a component
 * see its co-listeners (e.g. for a "show all shortcuts" overlay).
 */
export function hotKeyListeners(combo) {
	const bucket = registry.get(canonicalizeCombo(combo));
	const others = [];
	if (!bucket) {
		return others;
	}
	for (const entry of bucket) {
		const target = entry.targetRef.deref();
		if (target && target !== this && others.indexOf(target) === -1) {
			others.push(target);
		}
	}
	return others;
}
