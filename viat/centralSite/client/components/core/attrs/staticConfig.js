import {
	assign,
	deepMerge,
	getProto,
	hasOwn,
	isFunction,
	isObject,
	isPlainObject,
} from '../utilities.js';
import { inferStateSchema } from './inferTypes.js';
export function collectClassChain(ComponentClass) {
	const chain = [];
	let current = ComponentClass;
	while (current && current !== HTMLElement) {
		chain.push(current);
		current = getProto(current);
	}
	chain.reverse();
	return chain;
}
function computeMerged(ComponentClass, fieldName) {
	const parentClass = getProto(ComponentClass);
	if (parentClass !== null && getProto(parentClass) === HTMLElement) {
		return hasOwn(ComponentClass, fieldName) ? {
			...ComponentClass[fieldName],
		} : {};
	}
	const chain = collectClassChain(ComponentClass);
	const merged = {};
	const chainLength = chain.length;
	for (let index = 0; index < chainLength; index++) {
		const classRef = chain[index];
		if (hasOwn(classRef, fieldName)) {
			assign(merged, classRef[fieldName]);
		}
	}
	return merged;
}
function ensureMerged(ComponentClass, fieldName, cacheName) {
	if (hasOwn(ComponentClass, cacheName)) {
		return ComponentClass[cacheName];
	}
	const merged = computeMerged(ComponentClass, fieldName);
	Object.defineProperty(ComponentClass, cacheName, {
		value: merged,
		configurable: true,
		writable: true,
	});
	return merged;
}
/**
 * Chain-merged `static stores` table for a class (root → leaf, leaf wins),
 * cached on the class as `mergedStores`. A subclass inherits its ancestors'
 * named stores and may add or override entries — the store-merge-on-extension
 * the named-store design calls for. Reuses the generic `ensureMerged` machinery
 * that backs `static properties`.
 * @param {Function} ComponentClass - The component class.
 * @returns {object} The merged { storeName: Store } table.
 */
export function resolveStores(ComponentClass) {
	return ensureMerged(ComponentClass, 'stores', 'mergedStores');
}
/**
 * Config-aware static state merger. Walks the class chain root → leaf and folds
 * each ancestor's `static state` into an accumulator. Behavior switches on the
 * class's merged `static config` knobs:
 *   - `static config = { mergeState: false }` → no chain merge; uses only the
 *     current class's own `static state` (parents ignored entirely)
 *   - `static config = { mergeObjects: true }` → container values (plain objects,
 *     arrays, Sets, Maps) deep-merge through the chain; otherwise the newer
 *     class's value replaces the accumulator at that key
 * Caches the result on the class under `mergedState`. The knobs are read from the
 * class's merged config (`ensureMergedConfig`), so subclass overrides are honored.
 * Accessor descriptors (`get foo()` / `set foo()`) survive the merge intact
 * — they're transferred via `Object.defineProperty` and later collected into
 * the class's propertyIndex (getters/setters Maps) so the state proxies
 * dispatch them via `.call(component)` rather than per-instance `.bind`.
 */
function copyDescriptor(target, key, descriptor) {
	Object.defineProperty(target, key, descriptor);
}
function foldStateSource(merged, source, mergeObjects) {
	const descriptors = Object.getOwnPropertyDescriptors(source);
	const keys = Object.keys(descriptors);
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index++) {
		const key = keys[index];
		const descriptor = descriptors[key];
		if (descriptor.get || descriptor.set) {
			copyDescriptor(merged, key, descriptor);
			continue;
		}
		if (!mergeObjects) {
			copyDescriptor(merged, key, descriptor);
			continue;
		}
		const priorDescriptor = Object.getOwnPropertyDescriptor(merged, key);
		const priorValue = priorDescriptor && !priorDescriptor.get && !priorDescriptor.set ? priorDescriptor.value : undefined;
		copyDescriptor(merged, key, {
			value: deepMerge(priorValue, descriptor.value),
			writable: true,
			enumerable: true,
			configurable: true,
		});
	}
}
/**
 * A `static state` declared as a FUNCTION is invoked once here — at merge time, when the
 * chain-merged template is first built and cached on the class — and its return value is
 * folded as the source. Per-instance freshness still comes from the constructor's
 * smartClone of this template, so the function form is for a class that prefers to COMPUTE
 * its defaults (or hold them in a closure) over a literal. A non-object return is treated
 * as an empty contribution rather than throwing the descriptor walk in `foldStateSource`.
 * @param {object|Function} stateSource - A class's `static state`.
 * @returns {object} The foldable state object.
 */
function resolveStateSource(stateSource) {
	if (!isFunction(stateSource)) {
		return stateSource;
	}
	const computed = stateSource();
	return isPlainObject(computed) ? computed : {};
}
function computeMergedState(ComponentClass) {
	const mergedConfig = ensureMergedConfig(ComponentClass);
	const mergeStateOff = mergedConfig.mergeState === false;
	const mergeObjects = mergedConfig.mergeObjects === true;
	const merged = {};
	if (mergeStateOff) {
		if (hasOwn(ComponentClass, 'state')) {
			foldStateSource(merged, resolveStateSource(ComponentClass.state), false);
		}
		return merged;
	}
	const chain = collectClassChain(ComponentClass);
	const chainLength = chain.length;
	for (let index = 0; index < chainLength; index++) {
		const classRef = chain[index];
		if (!hasOwn(classRef, 'state')) {
			continue;
		}
		foldStateSource(merged, resolveStateSource(classRef.state), mergeObjects);
	}
	return merged;
}
export function ensureMergedState(ComponentClass) {
	if (hasOwn(ComponentClass, 'mergedState')) {
		return ComponentClass.mergedState;
	}
	const merged = computeMergedState(ComponentClass);
	Object.defineProperty(ComponentClass, 'mergedState', {
		value: merged,
		configurable: true,
		writable: true,
	});
	return merged;
}
/**
 * Per-class fold plan for `foldStaticStateTemplate`. Precomputes the data-only
 * key/value arrays (accessor descriptors filtered out once) plus a parallel
 * clone-flag array, so per-instance state materialization is a flat indexed
 * loop instead of a fresh `getOwnPropertyDescriptors` bag + accessor scan on
 * every construct. Cached on the class like `mergedState`; the merged template
 * is stable, so the derived plan is too. `values` holds references into the
 * shared template — always `smartClone`d before entering instance STATE, so the
 * template is never mutated.
 * @param {typeof WebComponent} ComponentClass - The class to plan for.
 * @returns {{keys: string[], values: unknown[], clone: boolean[]}} The fold plan.
 */
export function ensureStateFoldPlan(ComponentClass) {
	if (hasOwn(ComponentClass, 'stateFoldPlan')) {
		return ComponentClass.stateFoldPlan;
	}
	const mergedState = ensureMergedState(ComponentClass);
	const descriptors = Object.getOwnPropertyDescriptors(mergedState);
	const allKeys = Object.getOwnPropertyNames(descriptors);
	const keys = [];
	const values = [];
	const clone = [];
	const allKeysLength = allKeys.length;
	for (let index = 0; index < allKeysLength; index++) {
		const key = allKeys[index];
		const descriptor = descriptors[key];
		if (descriptor.get || descriptor.set) {
			continue;
		}
		const value = descriptor.value;
		keys.push(key);
		values.push(value);
		clone.push(isObject(value));
	}
	const plan = {
		keys,
		values,
		clone,
	};
	Object.defineProperty(ComponentClass, 'stateFoldPlan', {
		value: plan,
		configurable: true,
		writable: true,
	});
	return plan;
}
export function ensureMergedAttrs(ComponentClass) {
	return ensureMerged(ComponentClass, 'attrs', 'mergedAttrs');
}
export function ensureMergedConfig(ComponentClass) {
	return ensureMerged(ComponentClass, 'config', 'mergedConfig');
}
/*
 * The fully RESOLVED per-class config: the framework knob defaults with the
 * chain-merged `static config` folded over them — frozen, and shared by every
 * instance constructed without a ctor-arg config (the dominant list-row case),
 * so construction allocates no per-instance config object. The freeze turns a
 * future post-construct `this.config.x =` write into a loud TypeError instead
 * of silent cross-instance bleed; nothing writes instance config after
 * construction today (grep-verified).
 */
const CONFIG_KNOB_DEFAULTS = {
	mergeObjects: false,
	mergeState: true,
	skipStaticState: false,
};
export function ensureResolvedConfig(ComponentClass) {
	if (hasOwn(ComponentClass, 'resolvedConfig')) {
		return ComponentClass.resolvedConfig;
	}
	const resolved = Object.freeze(assign({}, CONFIG_KNOB_DEFAULTS, ensureMergedConfig(ComponentClass)));
	Object.defineProperty(ComponentClass, 'resolvedConfig', {
		value: resolved,
		configurable: true,
		writable: true,
	});
	return resolved;
}
/**
 * `static properties` — the per-path state schema. Shallow chain-merge (it is
 * a flat, path-keyed object: `{ 'a.b.c': { kind, react } }`), exactly like
 * `static attrs`. Accessor descriptors (`get foo()` / `set foo()`) on `static
 * state` are separately collected into the same propertyIndex via the
 * mergedState walk in `ensurePropertyIndex`.
 */
export function ensureMergedProperties(ComponentClass) {
	return ensureMerged(ComponentClass, 'properties', 'mergedProperties');
}
function collectAccessors(mergedState, getters, setters) {
	const descriptors = Object.getOwnPropertyDescriptors(mergedState);
	const keys = Object.getOwnPropertyNames(descriptors);
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index++) {
		const key = keys[index];
		const descriptor = descriptors[key];
		if (descriptor.get) {
			getters.set(key, descriptor.get);
		}
		if (descriptor.set) {
			setters.set(key, descriptor.set);
		}
	}
}
/**
 * Derive the fast-lookup index from compile-time inference over `static state`,
 * the merged `static properties`, and accessor descriptors on `static state` —
 * cached on the class. `hasProperties` / `hasNonReactive` / `hasKinds` /
 * `hasTypes` / `hasAccessors` are coarse booleans so the proxy + compiler hot
 * paths short-circuit with a single check when a feature is unused.
 *   types            — path → STATE_TYPE (inferred JS type; compiler/sigil oracle)
 *   nonReactivePaths — paths declared `react: false` (skip notify + tracking)
 *   kinds            — path → CONTENT_KIND (skip content classification); seeded
 *                      from inference for TEXT-safe primitives, then OVERRIDDEN
 *                      by any explicit `static properties` `kind`
 *   getters          — top-level key → getter fn (dispatched via .call(component))
 *   setters          — top-level key → setter fn (dispatched via .call(component, value))
 *
 */
export function ensurePropertyIndex(ComponentClass) {
	if (hasOwn(ComponentClass, 'mergedPropertyIndex')) {
		return ComponentClass.mergedPropertyIndex;
	}
	const merged = ensureMergedProperties(ComponentClass);
	const mergedState = ensureMergedState(ComponentClass);
	/*
	 * One walk over `static state` seeds the type oracle and the auto kinds.
	 * Explicit `static properties` `kind` declarations below override inference.
	 */
	const inferred = inferStateSchema(mergedState);
	const types = inferred.types;
	const kinds = inferred.kinds;
	const paths = Object.keys(merged);
	const nonReactivePaths = new Set();
	const getters = new Map();
	const setters = new Map();
	const pathsLength = paths.length;
	for (let index = 0; index < pathsLength; index++) {
		const path = paths[index];
		const descriptor = merged[path];
		if (!descriptor) {
			continue;
		}
		if (descriptor.react === false) {
			nonReactivePaths.add(path);
		}
		if (descriptor.kind) {
			kinds.set(path, descriptor.kind);
		}
	}
	collectAccessors(mergedState, getters, setters);
	const propertyIndex = {
		hasProperties: paths.length > 0,
		hasNonReactive: nonReactivePaths.size > 0,
		hasKinds: kinds.size > 0,
		hasTypes: types.size > 0,
		hasAccessors: getters.size > 0 || setters.size > 0,
		nonReactivePaths,
		kinds,
		types,
		getters,
		setters,
	};
	Object.defineProperty(ComponentClass, 'mergedPropertyIndex', {
		value: propertyIndex,
		configurable: true,
		writable: true,
	});
	return propertyIndex;
}
