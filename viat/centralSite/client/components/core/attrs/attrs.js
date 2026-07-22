/**
 * @file Reactive, typed HOST-ATTRIBUTE channel — `this.attrs.*`. The third
 * authoring channel alongside `state` (reactive data) and `.prop=` (JS props).
 *
 * TYPE CONTRACT — the `static attrs` default value's TYPE declares the
 * attribute's nature. There is NO boolean→string coercion; a wrong type is a
 * misdeclaration, fixed at the declaration.
 * - boolean → PRESENCE attribute (like `disabled`): write `true` sets an empty
 * attribute, `false`/`null` REMOVES it; read is `hasAttribute` → bool.
 * - string → VALUED / enumerated attribute (like `spellcheck="false"`): write is
 * `String(v)`; read is the raw attribute, or the default when absent.
 * - number → VALUED numeric (like `tabindex`): write `String(v)`; read `Number(raw)`.
 * So a presence toggle declares `false`; an enumerated `"true"`/`"false"` attribute
 * (spellcheck) declares the STRING `'true'` — declaring it boolean makes the intended
 * `spellcheck="false"` read as "present → on", the inverse of intent.
 *
 * REACTIVITY — a render-time `this.attrs.x` read records a dep (`trackAttrRead`),
 * and `attributeChangedCallback` (base.js) notifies the component's bus on the
 * `attr:`-namespaced path, so any spot that read the attribute re-patches. An attr
 * changed but never read in render() has no subscriber and does not repaint.
 * Mutate via `this.attrs.x = v` (write-through → `setAttribute` → the same callback).
 *
 * CHANNEL vs `.prop=` — `.prop=${v}` sets `element[prop]` (a JS property; for a
 * reflected native prop like `spellcheck` it happens to round-trip to the attribute,
 * a coincidence, not a channel). `this.attrs.x` is the typed, reactive channel for
 * ANY attribute. See ./reactive-attrs.plan.private.md for the full design + rationale.
 */
import { trackAttrRead } from '../state/binding.js';
import { hasAnyKey } from '../utilities.js';
export function writeHostAttr(host, key, value) {
	if (value == null || value === false) {
		host.removeAttribute(key);
		return;
	}
	if (value === true) {
		host.setAttribute(key, '');
		return;
	}
	host.setAttribute(key, String(value));
}
export function readHostAttr(host, key, defaultValue) {
	if (typeof defaultValue === 'boolean') {
		return host.hasAttribute(key);
	}
	const rawValue = host.getAttribute(key);
	if (rawValue == null) {
		return defaultValue;
	}
	if (typeof defaultValue === 'number') {
		return Number(rawValue);
	}
	return rawValue;
}
/**
 * Stateless handler shared by every attrs proxy — the `{ host, schema }` the
 * traps need rides the proxy TARGET, not per-instance closures (mirrors
 * dom/refs.js REFS_HANDLER). One handler object for the whole app instead of a
 * fresh handler + 5 trap closures per component construct.
 */
class AttrsProxyHandler {
	static instance = new AttrsProxyHandler();
	get(target, key) {
		const schema = target.schema;
		if (typeof key === 'symbol' || !(key in schema)) {
			return undefined;
		}
		/*
		 * Reactive read: during render tracking, subscribe this spot to the
		 * attribute so `attributeChangedCallback` re-patches it. No-op otherwise.
		 */
		trackAttrRead(target.host, key);
		return readHostAttr(target.host, key, schema[key]);
	}
	set(target, key, value) {
		if (typeof key === 'symbol' || !(key in target.schema)) {
			return true;
		}
		writeHostAttr(target.host, key, value);
		return true;
	}
	has(target, key) {
		return key in target.schema;
	}
	ownKeys(target) {
		return Object.keys(target.schema);
	}
	getOwnPropertyDescriptor(target, key) {
		if (key in target.schema) {
			return {
				configurable: true,
				enumerable: true,
			};
		}
		return undefined;
	}
}
/*
 * The common case is `static attrs = {}` (no declared attributes): every trap
 * would no-op on the empty schema without ever touching `host`, so one shared
 * proxy serves every attr-less component — zero per-instance allocation.
 */
const EMPTY_ATTRS_PROXY = new Proxy({
	host: null,
	schema: {},
}, AttrsProxyHandler.instance);
export function makeAttrsProxy(host, schema) {
	if (!schema || !hasAnyKey(schema)) {
		return EMPTY_ATTRS_PROXY;
	}
	return new Proxy({
		host,
		schema,
	}, AttrsProxyHandler.instance);
}
