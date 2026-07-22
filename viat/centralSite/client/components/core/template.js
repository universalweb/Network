import { resolveStores } from './attrs/staticConfig.js';
import { behaviorAttrNames, BehaviorTeardown, getBehavior } from './behaviors/index.js';
import { defaultLogger, IS_PRODUCTION } from './debug/logger.js';
import { Perf } from './debug/perf.js';
import { projectPortals, removePortals } from './dom/portal.js';
import { captureLightChildren, projectLightChildren } from './dom/projection.js';
import { registerRef } from './dom/refs.js';
import { markSpotDirty } from './lifecycle/scheduler.js';
import {
	addDep,
	CONTENT_KIND,
	ensureRenderProxies,
	isBindingType,
	ListBinding,
	track,
} from './state/binding.js';
import { globalRealm, storeRealm } from './state/globalState.js';
import {
	ensureStateBus,
	linkStateCarrier,
	localRealm,
	STATE_PATH,
} from './state/state.js';
import { SPOT_KIND, SPOT_TYPE } from './template/constants.js';
import {
	isCustomElementConstructor,
	ListSpot,
	LiveList,
	patchListAnchored,
	patchListKind,
} from './template/list.js';
import { inferBareAttrName } from './template/parser.js';
import { getRecipe, resolveRecipeNodes } from './template/planner.js';
import {
	cleanupTemplateNode,
	clearRange,
	Spot,
	TEMPLATE_CLEANUP,
} from './template/spot.js';
import {
	clearUnsubs,
	disposeItem,
	eachArray,
	getValueAtPath,
	isArrayBuffer,
	isFunction,
	isMap,
	isNode,
	isPlainObject,
	isPromise,
	isSet,
	isString,
	setValueAtPath,
	syncSubsByDiff,
	toBase64Url,
} from './utilities.js';
/*
 * Public list surface re-exported from the list half of the split, so every
 * pre-split importer of template.js keeps its entry point.
 */
export {
	each, filter, html, list, LiveList,
} from './template/list.js';
const SUBEVENT_ATTRS = behaviorAttrNames();
/**
 * Behavior-attribute attribute application. The template extractor strips the
 * raw `tooltip="…"` / `hotkey="…"` etc. attributes; this function reflects the
 * (possibly dynamic) value to the behavior. If the behavior exposes an
 * `applyValue(element, value)` hook, it owns the update — typically by writing a
 * WeakMap registry instead of mutating the DOM (tooltip lives here). For
 * legacy behaviors with no hook the value is reflected into a sibling
 * `data-<name>` attribute that the behavior reads on demand.
 */
function applySubeventAttr(element, attrName, value) {
	if (!SUBEVENT_ATTRS.has(attrName)) {
		return false;
	}
	if (element.hasAttribute(attrName)) {
		element.removeAttribute(attrName);
	}
	const behavior = getBehavior(attrName);
	if (behavior && isFunction(behavior.applyValue)) {
		behavior.applyValue(element, value);
		return true;
	}
	const isEmpty = value == null || value === false || value === '';
	if (isEmpty) {
		element.removeAttribute(`data-${attrName}`);
		return true;
	}
	const next = value === true ? '' : String(value);
	element.setAttribute(`data-${attrName}`, next);
	return true;
}
export class ClassList {
	static isClassList(value) {
		return value instanceof ClassList;
	}
	isClassList = true;
	constructor(...items) {
		this.items = items;
	}
}
export function classList(...items) {
	return new ClassList(...items);
}
const STYLE_CAMEL_BOUNDARY = /[A-Z]/g;
function kebabStyleReplacer(match) {
	return `-${match.toLowerCase()}`;
}
function styleProp(prop) {
	if (prop.startsWith('--')) {
		return prop;
	}
	return prop.replace(STYLE_CAMEL_BOUNDARY, kebabStyleReplacer);
}
/**
 * Inline-style object → cssText, for `style=${...}` or `.style=${...}`. Keys are
 * kebab-cased automatically (`fontSize` → `font-size`); `--custom-prop` keys pass
 * through; null / undefined / false values drop the declaration. A pure helper —
 * no spot machinery — so reactivity comes from a thunk:
 * `style=${() => styles({ color: state.c })}`.
 * @param {object} styleObject - Map of CSS properties to values.
 * @returns {string} The serialized cssText (`prop:value;` joined).
 */
export function styles(styleObject) {
	if (!styleObject || typeof styleObject !== 'object') {
		return '';
	}
	let cssText = '';
	const keys = Object.keys(styleObject);
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index++) {
		const prop = keys[index];
		const value = styleObject[prop];
		if (value === null || value === undefined || value === false) {
			continue;
		}
		cssText += `${styleProp(prop)}:${value};`;
	}
	return cssText;
}
function addTokens(source, target) {
	if (!isString(source)) {
		return;
	}
	const tokens = source.split(/\s+/);
	const tokensLength = tokens.length;
	for (let index = 0; index < tokensLength; index++) {
		const token = tokens[index];
		if (token) {
			target.add(token);
		}
	}
}
function splitClassTokens(source) {
	const tokens = source.split(/\s+/);
	const filtered = [];
	const tokensLength = tokens.length;
	for (let index = 0; index < tokensLength; index++) {
		if (tokens[index]) {
			filtered.push(tokens[index]);
		}
	}
	return filtered;
}
function addTokenList(tokens, target) {
	const tokensLength = tokens.length;
	for (let index = 0; index < tokensLength; index++) {
		target.add(tokens[index]);
	}
}
function applyClassListItems(items, desired, deps, component) {
	const itemsLength = items.length;
	for (let index = 0; index < itemsLength; index++) {
		const item = items[index];
		if (isString(item)) {
			addTokens(item, desired);
			continue;
		}
		if (item == null || item === false) {
			continue;
		}
		if (isFunction(item)) {
			const evaluated = evaluateTrackedExpression(component, item);
			mergeDepMap(deps, evaluated.deps);
			const evalValue = evaluated.value;
			if (isString(evalValue)) {
				addTokens(evalValue, desired);
			} else if (evalValue) {
				applyClassListItems([evalValue], desired, deps, component);
			}
			continue;
		}
		if (isBindingType(item)) {
			/*
			 * One realm resolution serves BOTH the dep record and the read —
			 * the old shape resolved twice per Binding part per refresh.
			 */
			const keyRealm = realmForBinding(item, component);
			addDep(deps, keyRealm.realm, keyRealm.path);
			const value = keyRealm.realm.read(keyRealm.path);
			if (isString(value)) {
				addTokens(value, desired);
			} else if (value) {
				applyClassListItems([value], desired, deps, component);
			}
			continue;
		}
		if (isSet(item)) {
			for (const token of item) {
				if (isString(token)) {
					desired.add(token);
				}
			}
			const carrier = item[STATE_PATH];
			if (carrier) {
				addDep(deps, carrier.realm, carrier.path);
			}
			continue;
		}
		if (Array.isArray(item)) {
			applyClassListItems(item, desired, deps, component);
			const carrier = item[STATE_PATH];
			if (carrier) {
				addDep(deps, carrier.realm, carrier.path);
			}
			continue;
		}
		if (isMap(item)) {
			for (const [
				token,
				enabled,
			] of item) {
				if (enabled && isString(token)) {
					desired.add(token);
				}
			}
			const carrier = item[STATE_PATH];
			if (carrier) {
				addDep(deps, carrier.realm, carrier.path);
			}
			continue;
		}
		const keys = Object.keys(item);
		const keysLength = keys.length;
		for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
			const key = keys[keyIndex];
			const value = item[key];
			let resolved = value;
			if (isFunction(value)) {
				if (component) {
					const evaluated = evaluateTrackedExpression(component, value);
					mergeDepMap(deps, evaluated.deps);
					resolved = evaluated.value;
				} else {
					resolved = value();
				}
			}
			if (resolved) {
				desired.add(key);
			}
		}
	}
}
function diffClassList(element, current, desired) {
	for (const token of current) {
		if (!desired.has(token)) {
			element.classList.remove(token);
		}
	}
	for (const token of desired) {
		if (!current.has(token)) {
			element.classList.add(token);
		}
	}
}
const BINDABLE_TAGS = new Set([
	'INPUT', 'SELECT', 'TEXTAREA',
]);
const BINDABLE_ATTRS = new Set(['value', 'checked']);
class ComponentBinding {
	constructor(value) {
		this.value = value;
	}
	static is(source) {
		return source instanceof ComponentBinding;
	}
}
export function comp(value) {
	return new ComponentBinding(value);
}
/*
 * Sync hand-off from a ComputedSpot refresh to an evaluating ifThen thunk.
 * The branch-node cache must live on the SPOT: every render pass re-runs
 * `${ifThen(...)}` and mints a fresh thunk, so closure-held cache state dies
 * with it — after any full re-render the next condition flip would
 * re-instantiate its branch component (lifecycle churn + lost branch state).
 * Tracking windows are synchronous, so a module slot set for the duration of
 * one evaluation cannot interleave; evaluateTrackedExpression resets it on
 * every entry, so a throwing expression cannot leak a stale spot into a
 * later evaluation.
 */
let ifThenHostSpot = null;
/* Resolve an `ifThen` branch to a value the content-kind dispatch understands. A
   value passes straight through (text/empty, equality-guarded by patchTextStrict);
   a component class is instantiated ONCE and cached, so a re-evaluation that did
   NOT flip returns the SAME node and `patchComponentKind` no-ops — no rebuild, no
   lifecycle churn. Only an actual flip swaps the subtree. Defined before `ifThen`
   so the factory references a hoisted leaf. */
function resolveIfThenBranch(branch, branchNodes) {
	if (branch === null || branch === undefined) {
		return null;
	}
	if (isString(branch) || typeof branch === 'number' || typeof branch === 'boolean') {
		return branch;
	}
	if (isCustomElementConstructor(branch)) {
		let node = branchNodes.get(branch);
		if (!node) {
			const BranchComponent = branch;
			node = new BranchComponent();
			branchNodes.set(branch, node);
		}
		return node;
	}
	if (isNode(branch) || ComponentBinding.is(branch) || LiveList.isLiveList(branch)) {
		return branch;
	}
	throw new TypeError('ifThen() branch must be a value (string/number/boolean/null), a component class, or built content (Node/comp()/list). For reactive branch markup, use a component class — a raw inline html`` block is not a reactive branch.');
}
// True when an ifThen branch resolves to node-kind content (vs a plain value).
function isNodeBranch(branch) {
	return isCustomElementConstructor(branch) || isNode(branch) ||
		ComponentBinding.is(branch) || LiveList.isLiveList(branch);
}
/**
 * `ifThen(condition, thenBranch, elseBranch?)` — fine-reactive conditional (named
 * `ifThen` because `when` shadows the `window.when` browser global). Returns a
 * thunk the engine installs as a per-spot `ComputedSpot` (NO whole-component
 * re-render): it tracks only what `condition` reads and patches just this spot
 * when the result flips.
 *
 *   condition  — a state-key STRING (truthy `state[key]`) OR a fn (`() => cond`,
 *                called with the component as `this`).
 *   then/else  — a VALUE (string / number / boolean / null → text or empty,
 *                equality-guarded) OR a component CLASS (instantiated on first
 *                activation, then cached + reused; the component owns its own
 *                reactive graph, so its inner content updates independently). A
 *                pre-built Node / `comp()` / list value is also passed through.
 *
 * A flip mounts the entering branch and unmounts the leaving one — a correct
 * disconnect/reconnect, NOT churn. A raw inline `` html`` `` block is NOT a
 * reactive branch: it is a value-only `LightTemplate` with no per-spot graph (it
 * would go stale or rebuild wholesale). Use a component class for reactive markup.
 * @param {string|Function} condition - State-key, or a boolean-returning fn.
 * @param {*} thenBranch - Branch shown when the condition is truthy.
 * @param {*} [elseBranch] - Branch shown otherwise (default: render nothing).
 * @returns {Function} A thunk to interpolate in a content position: `${ifThen(...)}`.
 */
export function ifThen(condition, thenBranch, elseBranch = null) {
	const conditionIsKey = isString(condition);
	/*
	 * Lazy — the closure cache only serves evaluations with NO host spot (see
	 * below); minting it eagerly allocated a dead Map per render pass once a
	 * host spot existed (the common case).
	 */
	let branchNodes = null;
	/*
	 * MIXED ifThen (one branch node-kind, the other a plain value): the spot's
	 * content patcher locks to COMPONENT on first patch, and a later primitive
	 * would crash appendChild (or, flipped, a node would stringify through the
	 * TEXT patcher). Coerce value branches to CACHED Text nodes so the spot is
	 * node-kind from its first evaluation — identity-stable, so the component
	 * short-circuit still no-ops when nothing flipped. Value-only ifThens keep
	 * the plain TEXT path (equality-guarded by patchTextStrict).
	 */
	const mixedBranches = isNodeBranch(thenBranch) || isNodeBranch(elseBranch);
	return function ifThenSpot() {
		/*
		 * Prefer the host spot's cache — it survives the per-render thunk
		 * replacement (updateSpot swaps `spot.expr` for every fresh render's
		 * thunk). The closure Map only serves evaluations with no host spot.
		 */
		const cache = ifThenHostSpot ? (ifThenHostSpot.branchNodes ??= new Map()) : (branchNodes ??= new Map());
		const active = conditionIsKey ? Boolean(getValueAtPath(this.state, condition)) : Boolean(condition.call(this));
		const resolved = resolveIfThenBranch(active ? thenBranch : elseBranch, cache);
		if (mixedBranches && resolved !== null && !isNode(resolved) &&
			!ComponentBinding.is(resolved) && !LiveList.isLiveList(resolved)) {
			let valueNode = cache.get(resolved);
			if (!valueNode) {
				valueNode = document.createTextNode(String(resolved));
				cache.set(resolved, valueNode);
			}
			return valueNode;
		}
		return resolved;
	};
}
function clearSubscriptions(subscriptions = []) {
	eachArray(subscriptions, disposeItem);
	return [];
}
function resolveBindingValue(component, bindingKey) {
	const resolved = realmForKey(bindingKey, component);
	return resolved.realm.read(resolved.path);
}
function evaluateTrackedExpression(component, expr, hostSpot = null) {
	/*
	 * Reset-on-entry (not just clear-on-exit): a throwing expression skips the
	 * inline clear below, and the next evaluation of ANY expression must not
	 * inherit the stale ifThen host.
	 */
	ifThenHostSpot = hostSpot;
	ensureRenderProxies(component);
	const previousRenderTracking = component.renderTracking;
	component.renderTracking = true;
	const result = track(expr, component);
	component.renderTracking = previousRenderTracking;
	ifThenHostSpot = null;
	return result;
}
function subscribeStatePath(component, statePath, handler, target) {
	return ensureStateBus(component).subscribe(statePath, handler, target);
}
/**
 * Resolve the realm + bare path for a keyed binding. The `global.` prefix is
 * the only string parsed (authoring-time origin), and only at spot setup — the
 * returned realm object then carries bus / read / write so nothing downstream
 * re-parses.
 */
function realmForKey(key, component) {
	if (key.startsWith('global.')) {
		return {
			realm: globalRealm,
			path: key.slice(7),
		};
	}
	return {
		realm: localRealm(component),
		path: key,
	};
}
/*
 * Channel-carry realm resolution for a Binding — the read-side twin of
 * `parseBindingChannel` in the Binding constructor. The channel was resolved
 * ONCE at authoring into `.global` / `.storeName` + a BARE `.key`, so the realm
 * comes from the carried data; downstream never re-parses the key string (using
 * `realmForKey` on a binding's bare key would silently resolve it LOCAL). A
 * `stores.<name>.` binding resolves the Store instance against the component
 * CLASS's merged `static stores` table here, at spot install — an undeclared
 * name is an authoring error and throws with the offending key.
 */
// Exported for the list half of the split (ListSpot's install-time realm cache).
export function realmForBinding(binding, component) {
	if (binding.storeName !== null) {
		const store = resolveStores(component.constructor)[binding.storeName];
		if (!store) {
			throw new Error(`<${component.localName}> binds "stores.${binding.storeName}.${binding.key}" but declares no store "${binding.storeName}" in static stores.`);
		}
		return {
			realm: storeRealm(store),
			path: binding.key,
		};
	}
	return {
		realm: binding.global ? globalRealm : localRealm(component),
		path: binding.key,
	};
}
// Exported for the list half of the split (ListSpot.refresh) — see template/list.js.
export function resolveBindingValueForBinding(component, binding) {
	const resolved = realmForBinding(binding, component);
	return resolved.realm.read(resolved.path);
}
// A one-entry dependency Map<realm, Set<path>> for a single keyed binding.
function singleDepMap(realm, path) {
	const depMap = new Map();
	depMap.set(realm, new Set([path]));
	return depMap;
}
/**
 * One-entry dep Map straight from a Binding + component (bind / list spots whose
 * single key is fixed at install). Flag-aware — routes a global bind to the
 * global realm even though the key string is prefix-stripped.
 */
function bindingDepMap(binding, component) {
	const resolved = realmForBinding(binding, component);
	return singleDepMap(resolved.realm, resolved.path);
}
/**
 * If a dep Map<realm, Set<path>> holds EXACTLY ONE path total, return its
 * {realm, path}; else null. Used by two-way inference (a single unambiguous dep
 * makes the expression a valid bind source).
 */
function singleDepOf(depMap) {
	let found = null;
	let count = 0;
	for (const [
		realm,
		paths,
	] of depMap) {
		for (const path of paths) {
			count += 1;
			if (count > 1) {
				return null;
			}
			found = {
				realm,
				path,
			};
		}
	}
	return count === 1 ? found : null;
}
// Fold one Map<realm, Set<path>> into another (computed-spot / classList merge).
function mergeDepMap(target, source) {
	for (const [
		realm,
		paths,
	] of source) {
		for (const path of paths) {
			addDep(target, realm, path);
		}
	}
}
/**
 * Subscribe one bare path to its realm's bus, dispatching `spot.handle` (a
 * shared prototype method — no per-spot closure). `ctx` carries the realm (its
 * bus) and the spot (bus target). Routing is by realm reference, no parsing.
 * LIST spots subscribe `multiPath` so the flush delivers every overlapping
 * changed path (a batch of sibling `items.N.x` mutations), not just the first —
 * `Spot.handle` accumulates them and `ListSpot.drain` replays per path.
 */
function subscribeRealmSpotDep(path, ctx) {
	return ctx.realm.bus.subscribe(path, ctx.spot.handle, ctx.spot, ctx.spot.kind === SPOT_KIND.LIST);
}
/**
 * `deps` is a Map<realm, Set<path>>; `spot.depMap` is the 2-level unsub store
 * Map<realm, Map<path, unsub>>. Diff each realm's paths against its own submap,
 * disposing realms that vanished from this evaluation.
 */
function syncSpotSubscriptions(spot, deps) {
	let store = spot.depMap;
	if (!store) {
		store = new Map();
		spot.depMap = store;
	}
	if (store.size) {
		const realms = [...store.keys()];
		const realmsLength = realms.length;
		for (let realmIndex = 0; realmIndex < realmsLength; realmIndex++) {
			const realm = realms[realmIndex];
			if (!deps.has(realm)) {
				clearUnsubs(store.get(realm));
				store.delete(realm);
			}
		}
	}
	for (const [
		realm,
		paths,
	] of deps) {
		let submap = store.get(realm);
		if (!submap) {
			submap = new Map();
			store.set(realm, submap);
		}
		syncSubsByDiff(submap, paths, subscribeRealmSpotDep, {
			realm,
			spot,
		});
	}
}
/**
 * Text-position spots cache a specialized patcher in spot.patch so subsequent
 * patches skip kind detection. Hot path is one virtual call per patch.
 */
function patchComponentKind(spot, value) {
	const node = ComponentBinding.is(value) ? value.value : value;
	if (spot.element.firstChild === node) {
		return;
	}
	spot.element.textContent = '';
	if (node) {
		spot.element.appendChild(node);
	}
}
function patchHtmlKind(spot, value) {
	spot.element.innerHTML = String(value ?? '');
}
/*
 * JSON-for-display replacer: BigInt-safe (stringified — wallet amounts survive)
 * and circular-safe (`[Circular]`), so an object/array spot never throws. The
 * `seen` set lives at module scope (reset per `jsonDisplay` call) so the
 * replacer stays a first-class declaration with no per-call closure.
 */
let jsonDisplaySeen = null;
function jsonDisplayReplacer(replacerKey, replacerValue) {
	if (typeof replacerValue === 'bigint') {
		return String(replacerValue);
	}
	if (replacerValue !== null && typeof replacerValue === 'object') {
		if (jsonDisplaySeen.has(replacerValue)) {
			return '[Circular]';
		}
		jsonDisplaySeen.add(replacerValue);
	}
	return replacerValue;
}
function jsonDisplay(value) {
	jsonDisplaySeen = new WeakSet();
	const result = JSON.stringify(value, jsonDisplayReplacer) ?? '';
	jsonDisplaySeen = null;
	return result;
}
/**
 * Render any non-HTML value as a plain display string for textContent:
 *   number / bigint / boolean / (string)  → String()
 *   TypedArray / DataView / ArrayBuffer    → base64url (display form)
 *   plain object / array                   → JSON (BigInt- & circular-safe)
 */
function valueToText(value) {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value !== 'object') {
		return String(value);
	}
	if (ArrayBuffer.isView(value) || isArrayBuffer(value)) {
		return toBase64Url(value);
	}
	return jsonDisplay(value);
}
/*
 * Migration / safety net (dev-only). A text-position spot that receives a
 * markup-bearing STRING now renders it as escaped textContent — the safe,
 * fast default (see classifyContentKind below). If the author intended HTML
 * they must opt in (`^html` / bind.html / `static properties {kind:'html'}`).
 * Warn ONCE per spot (WeakSet dedup — keeps the Spot shape monomorphic and a
 * list render loop can't flood the console) and only on a TAG-LIKE string
 * (`/<[a-z!/]/i` ignores lone `<` in prose like "1 < 2"). Hard-noop in
 * production: `AUDIT_TEXT_HTML` is a build-time false there, so the guarded
 * call folds away and never pays the scan.
 */
const AUDIT_TEXT_HTML = !IS_PRODUCTION;
const HTML_TAGLIKE_RE = /<[a-z!/]/i;
const htmlInTextWarned = new WeakSet();
function formatHtmlInTextWarning(spot, value) {
	const tag = spot.component?.tagName ?? 'text-spot';
	return `[${tag}] markup string rendered as TEXT (escaped). If HTML is intended use ^html / bind.html / static properties {kind:'html'}. value="${value.slice(0, 80)}"`;
}
function warnHtmlInText(spot, value) {
	if (spot.declaredKind || !isString(value) || htmlInTextWarned.has(spot)) {
		return;
	}
	if (!HTML_TAGLIKE_RE.test(value)) {
		return;
	}
	htmlInTextWarned.add(spot);
	defaultLogger.warn('template', formatHtmlInTextWarning, spot, value);
}
/**
 * The text patcher — straight textContent (via `valueToText`), no markup scan.
 * The DEFAULT for every text-position string (XSS-safe, ~2.7–10.9× faster than
 * innerHTML — measured), plus numbers / bigints / buffers / objects and any
 * spot DECLARED `text` (`^text` / `static properties` `kind:'text'` / bind.text).
 * HTML is reached only by an explicit `html` declaration. Equality-guarded so an
 * unchanged value short-circuits.
 */
function patchTextStrict(spot, value) {
	if (AUDIT_TEXT_HTML) {
		warnHtmlInText(spot, value);
	}
	const str = valueToText(value);
	if (spot.element.textContent !== str) {
		spot.element.textContent = str;
	}
}
/**
 * ── Content-kind classification ──────────────────────────────────────
 * classifyContentKind() is the SINGLE decision point that answers
 * "what kind of content is this ${…}?". Every text-position value
 * resolves to exactly one CONTENT_KIND (defined in binding.js);
 * CONTENT_PATCHERS maps each kind to its patch routine. To add a kind:
 * extend CONTENT_KIND, this function, and CONTENT_PATCHERS.
 *
 *   EMPTY      null | undefined | ''          → cleared via patchTextStrict
 *   LIST       a LiveList (each() / list())   → patchListKind     keyed diff
 *   COMPONENT  a comp() binding or a Node     → patchComponentKind  adopt node
 *   TEXT       string / number / non-object   → patchTextStrict   textContent (DEFAULT)
 *   HTML       only via explicit declaration  → patchHtmlKind     innerHTML
 * ─────────────────────────────────────────────────────────────────────
 */
function classifyContentKind(value) {
	if (value === null || value === undefined || value === '') {
		return CONTENT_KIND.EMPTY;
	}
	if (LiveList.isLiveList(value)) {
		return CONTENT_KIND.LIST;
	}
	if (ComponentBinding.is(value) || isNode(value)) {
		return CONTENT_KIND.COMPONENT;
	}
	/*
	 * Strings DEFAULT to textContent (TEXT) — XSS-safe, correct for arbitrary
	 * text (no `<`/`&` mangling), and ~2.7–10.9× faster than innerHTML (measured).
	 * HTML is NEVER auto-classified: render markup only by opting IN per-spot via
	 * `^html` / bind.html / `static properties {kind:'html'}` (→ spot.declaredKind,
	 * which short-circuits this function in bindSpotKind). The dev-only
	 * `warnHtmlInText` net flags any markup string that slips through undeclared.
	 */
	return CONTENT_KIND.TEXT;
}
/*
 * Kind → patcher. EMPTY and TEXT (the string default + numbers / bigints /
 * non-strings) use the strict textContent patcher; HTML (declared-only) uses
 * innerHTML. No auto / self-correcting path — `bindSpotKind` dispatches straight
 * through this table.
 */
const CONTENT_PATCHERS = {
	[CONTENT_KIND.EMPTY]: patchTextStrict,
	[CONTENT_KIND.TEXT]: patchTextStrict,
	[CONTENT_KIND.HTML]: patchHtmlKind,
	[CONTENT_KIND.COMPONENT]: patchComponentKind,
	[CONTENT_KIND.LIST]: patchListKind,
};
/**
 * Anchored mirror of CONTENT_PATCHERS. Every routine operates on the comment-
 * bounded range (startComment … endComment) inside a parent shared with static
 * siblings — so it NEVER reads/writes the parent's whole textContent/innerHTML.
 * `spot.textNode` caches the single managed text node for the hot TEXT path.
 */
function patchTextAnchored(spot, value) {
	const str = valueToText(value);
	const textNode = spot.textNode;
	// Fast path: our text node still solely occupies the range — mutate its data.
	if (textNode !== null && textNode.parentNode !== null &&
		textNode.previousSibling === spot.startComment && textNode.nextSibling === spot.endComment) {
		if (textNode.data !== str) {
			textNode.data = str;
		}
		return;
	}
	// Range held other content (or first patch) — clear it, drop in a fresh node.
	clearRange(spot.startComment, spot.endComment);
	const fresh = document.createTextNode(str);
	spot.textNode = fresh;
	spot.startComment.parentNode.insertBefore(fresh, spot.endComment);
}
function patchHtmlAnchored(spot, value) {
	clearRange(spot.startComment, spot.endComment);
	spot.textNode = null;
	const str = String(value ?? '');
	if (str === '') {
		return;
	}
	/*
	 * Parse via an INERT <template> — script-inert, matching the wrapper path's
	 * `element.innerHTML` semantics. NOT `Range.createContextualFragment`, which is an
	 * XSS sink that EXECUTES embedded <script>. Then splice the parsed nodes into
	 * the comment-bounded range. (Also drops the per-patch Range allocation.)
	 */
	const parsed = document.createElement('template');
	parsed.innerHTML = str;
	spot.startComment.parentNode.insertBefore(parsed.content, spot.endComment);
}
function patchComponentAnchored(spot, value) {
	const node = ComponentBinding.is(value) ? value.value : value;
	if (spot.startComment.nextSibling === node &&
		(node === null || node.nextSibling === spot.endComment)) {
		return;
	}
	clearRange(spot.startComment, spot.endComment);
	spot.textNode = null;
	if (node) {
		spot.startComment.parentNode.insertBefore(node, spot.endComment);
	}
}
const CONTENT_PATCHERS_ANCHORED = {
	[CONTENT_KIND.EMPTY]: patchTextAnchored,
	[CONTENT_KIND.TEXT]: patchTextAnchored,
	[CONTENT_KIND.HTML]: patchHtmlAnchored,
	[CONTENT_KIND.COMPONENT]: patchComponentAnchored,
	[CONTENT_KIND.LIST]: patchListAnchored,
};
/**
 * A spot's contents-wrapper stays hit-testable only when it holds real
 * elements (a list, a component, or markup with tags). Pure text and
 * entity-only HTML opt out so the wrapper never intercepts pointer events.
 */
function spotKeepsInteractive(kind, value) {
	if (kind === CONTENT_KIND.LIST || kind === CONTENT_KIND.COMPONENT) {
		return true;
	}
	if (kind === CONTENT_KIND.HTML) {
		return String(value ?? '').includes('<');
	}
	return false;
}
/**
 * Resolve and cache the patcher for a text-position spot. `spot.declaredKind`
 * (set from a typed bind or `static properties`) short-circuits classification.
 */
function bindSpotKind(spot, value) {
	let kind = spot.declaredKind ?? classifyContentKind(value);
	/**
	 * A declared HTML kind means "a STRING here is trusted markup" — but the same
	 * slot may also receive a Node / LiveList (e.g. Panel's `renderBody` returns a
	 * markup string OR an `htmlElement` element, depending on the subclass).
	 * Forcing innerHTML on those would stringify them to "[object HTMLDivElement]"
	 * or defeat keyed list-diffing, so a NON-string value at a declared-HTML spot
	 * falls back to normal classification (COMPONENT adopts the node, LIST diffs).
	 * The common case — a string at a declared-HTML spot — skips this branch and
	 * stays on the fast cached path with no re-classification.
	 */
	if (kind === CONTENT_KIND.HTML && value !== null && value !== undefined && !isString(value)) {
		kind = classifyContentKind(value);
	}
	spot.contentKind = kind;
	/*
	 * No auto-detection: each kind maps straight to its patcher. A string is
	 * TEXT (textContent — the safe default), HTML is reached only via an explicit
	 * `^html` / bind.html / `static properties {kind:'html'}` declaration on
	 * `spot.declaredKind` above (and even then only strings render as innerHTML —
	 * see the polymorphic-slot guard immediately above).
	 */
	spot.patch = (spot.anchored ? CONTENT_PATCHERS_ANCHORED : CONTENT_PATCHERS)[kind];
	if (!spot.elided && !spot.anchored) {
		/*
		 * Wrapper <span> only: a folded marker (elided) or a comment range
		 * (anchored) lives on/around a real element whose pointer behavior
		 * belongs to the app — never force it (keeps text selectable / copyable,
		 * fixes the unclickable `<button>${x}</button>`).
		 */
		spot.element.style.pointerEvents = spotKeepsInteractive(kind, value) ? '' : 'none';
	}
}
/**
 * Named rejection converter for async spot values. Returns a sentinel so
 * `patchSpotBodyPromise` (deliberately unawaited) never rejects — the old
 * bare `await value` re-threw after the report, so every failed async spot
 * still surfaced as an unhandledrejection.
 */
const ASYNC_SPOT_FAILED = Symbol('asyncSpotFailed');
function reportAsyncSpotError(error) {
	defaultLogger.error('template', 'async spot error', error);
	return ASYNC_SPOT_FAILED;
}
/**
 * Apply an object-valued `style=${{...}}` binding (styleMap parity) per-property
 * instead of stringifying it to `[object Object]`. Dashed (`background-color`)
 * and custom (`--gap`) keys go through `setProperty`; camelCase / single-word
 * keys assign directly (`style.color`). `null` / `undefined` / `false` values
 * drop the property. Keys present last patch but absent now are removed, so the
 * binding is diff-driven across updates. `spot.prevStyleKeys` tracks the applied
 * set on the spot (no per-element WeakMap needed — one spot owns one style attr).
 * Called from BOTH value-application paths: first render / BindingSpot drain
 * (patchSpotBody) and the patch-pass re-render (updateSpot's ATTR branch).
 * @param {object} spot - The ATTR spot whose element receives the styles.
 * @param {object} value - The plain-object style map.
 */
function applyStyleObject(spot, value) {
	const elementStyle = spot.element.style;
	/*
	 * Mixed-form binding (string last patch, object now): the string apply
	 * replaced the WHOLE attribute, so its properties aren't in prevStyleKeys and
	 * would linger under per-key diffing. Wipe the inline styles first — the
	 * string already clobbered any externally-set inline styles, so the wipe
	 * loses nothing the binding didn't already own.
	 */
	if (spot.styleWasString) {
		elementStyle.cssText = '';
		spot.styleWasString = false;
	}
	const previousKeys = spot.prevStyleKeys;
	const nextKeys = new Set();
	const keys = Object.keys(value);
	const keysLength = keys.length;
	for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
		const styleKey = keys[keyIndex];
		const styleValue = value[styleKey];
		if (styleValue === null || styleValue === undefined || styleValue === false) {
			continue;
		}
		nextKeys.add(styleKey);
		if (styleKey.includes('-')) {
			elementStyle.setProperty(styleKey, String(styleValue));
		} else {
			elementStyle[styleKey] = styleValue;
		}
	}
	if (previousKeys) {
		const staleKeys = [...previousKeys];
		const staleKeysLength = staleKeys.length;
		for (let staleIndex = 0; staleIndex < staleKeysLength; staleIndex++) {
			const staleKey = staleKeys[staleIndex];
			if (nextKeys.has(staleKey)) {
				continue;
			}
			if (staleKey.includes('-')) {
				elementStyle.removeProperty(staleKey);
			} else {
				elementStyle[staleKey] = '';
			}
		}
	}
	spot.prevStyleKeys = nextKeys;
}
async function patchSpotBodyPromise(value, spot, token) {
	const item = await value.then(undefined, reportAsyncSpotError);
	if (item === ASYNC_SPOT_FAILED || spot.patchToken !== token) {
		return;
	}
	patchSpot(spot, item);
}
function patchSpotBody(spot, value) {
	if (isPromise(value)) {
		const token = (spot.patchToken ?? 0) + 1;
		spot.patchToken = token;
		patchSpotBodyPromise(value, spot, token);
		return;
	}
	if (spot.type === SPOT_TYPE.TEXT) {
		if (spot.keyMap && !LiveList.isLiveList(value)) {
			spot.keyMap.forEach(cleanupTemplateNode);
			spot.keyMap = null;
			spot.prevItemMap = null;
			spot.patch = null;
			if (spot.anchored) {
				// No follow-up parent-wipe to detach the old rows — clear the range.
				clearRange(spot.startComment, spot.endComment);
				spot.textNode = null;
			}
		}
		if (!spot.patch) {
			/*
			 * Undeclared + still empty (null/undefined/''): clear, but DON'T lock
			 * a patcher yet — the kind (string→HTML vs number→text) isn't known
			 * until a real value arrives, so defer classification to the next
			 * patch. Without this a spot whose state inits to '' would lock to
			 * textContent and then render later HTML strings as inert text.
			 */
			if (!spot.declaredKind && (value === null || value === undefined || value === '')) {
				if (spot.anchored) {
					if (spot.startComment.nextSibling !== spot.endComment) {
						clearRange(spot.startComment, spot.endComment);
					}
					spot.textNode = null;
				} else if (spot.element.textContent !== '') {
					spot.element.textContent = '';
				}
				return;
			}
			bindSpotKind(spot, value);
		}
		spot.patch(spot, value);
		return;
	}
	if (spot.type === SPOT_TYPE.BARE_ATTR) {
		if (applySubeventAttr(spot.element, spot.attr, value)) {
			return;
		}
		if (value === false || value === null || value === undefined || value === '') {
			if (spot.element.hasAttribute(spot.attr)) {
				spot.element.removeAttribute(spot.attr);
			}
			return;
		}
		if (value === true) {
			if (!spot.element.hasAttribute(spot.attr)) {
				spot.element.setAttribute(spot.attr, '');
			}
			return;
		}
		const bareStr = String(value);
		if (spot.element.getAttribute(spot.attr) !== bareStr) {
			spot.element.setAttribute(spot.attr, bareStr);
		}
		return;
	}
	if (spot.type === SPOT_TYPE.BOOL_ATTR) {
		const has = spot.element.hasAttribute(spot.attr);
		if (value && !has) {
			spot.element.setAttribute(spot.attr, '');
		} else if (!value && has) {
			spot.element.removeAttribute(spot.attr);
		}
		return;
	}
	if (spot.type === SPOT_TYPE.PROP) {
		/*
		 * `.state=` on a child component MERGES through the child's own
		 * `assignState` instead of REPLACING through its `set state` →
		 * replaceState. Replace rebuilt the child's STATE from only the passed
		 * keys, so any post-upgrade re-application of the binding (e.g. a modal
		 * whose parent re-renders) silently wiped the child's own `static state`
		 * chain defaults — e.g. ui-modal's `classes: Set(['modal'])` that styles
		 * the dialog, leaving a bare white, top-anchored native <dialog> plus a
		 * throw on close. Merge preserves those defaults and matches the keyed-
		 * list path, which already feeds retained component rows via assignState.
		 * `assignState` no-ops on a non-object value, so non-object `.state=` is
		 * safe; every other property still assigns directly.
		 */
		if (spot.attr === 'state' && isFunction(spot.element.assignState)) {
			const childElement = spot.element;
			childElement.assignState(value);
			/*
			 * `.state=` carry-down. When the passed value is a SHARED reactive
			 * proxy, a deep mutation made through the owner's proxy notifies only
			 * the OWNER's bus — the child holds the same object by reference but
			 * its own bus never hears the deep path, so the shallow merge above
			 * no-ops and nothing below re-reads. Bridge the child's bus to the
			 * source realm so each deep change is re-delivered as a child-relative
			 * path. A plain literal carries no realm, so it is left as a one-shot.
			 */
			if (isStateProxyValue(value)) {
				linkStateCarrier(childElement, value[STATE_PATH]);
			}
			return;
		}
		/*
		 * `.state.path=` is the explicit deep-state channel — the one sanctioned
		 * way a parent writes into a child's reactive state. Writing through the
		 * child's state proxy (not a bare element property) routes the assignment
		 * to the proxy set trap so the nested key notifies and re-patches. The
		 * proxy already no-ops an unchanged leaf, so no extra arg-diff is needed.
		 */
		if (spot.element.state && spot.attr.startsWith('state.')) {
			setValueAtPath(spot.element.state, spot.attr.slice(6), value);
			return;
		}
		if (spot.element[spot.attr] !== value) {
			spot.element[spot.attr] = value;
		}
		return;
	}
	if (spot.type === SPOT_TYPE.METHOD) {
		/*
		 * `.method(${value})` — invoke the element method with the resolved arg.
		 * Skip an unchanged arg after the first call so a side-effecting method
		 * does not fire on every unrelated patch pass (mirrors the PROP guard).
		 * A non-function name is a silent no-op rather than a throw.
		 */
		if (spot.methodCalled === true && value === spot.lastMethodArg) {
			return;
		}
		spot.methodCalled = true;
		spot.lastMethodArg = value;
		if (isFunction(spot.element[spot.attr])) {
			spot.element[spot.attr](value);
		}
		return;
	}
	if (applySubeventAttr(spot.element, spot.attr, value)) {
		return;
	}
	if (value === '' || value === null || value === undefined || value === false) {
		if (spot.element.hasAttribute(spot.attr)) {
			spot.element.removeAttribute(spot.attr);
		}
		return;
	}
	if (spot.attr === 'style' && isPlainObject(value)) {
		applyStyleObject(spot, value);
		return;
	}
	/*
	 * A ClassList can never reach the ATTR tail: install routes `class=` to
	 * installClassListSpot and BARE_ATTR returns earlier — the old defensive
	 * branch here was provably dead (and was applyClassListItems' only
	 * null-component caller).
	 */
	const str = String(value ?? '');
	if (spot.attr === 'style') {
		/* String apply replaces the whole attribute — reset the object-key
		 * tracking and mark so the next object apply wipes string residue. */
		spot.prevStyleKeys = null;
		spot.styleWasString = true;
	}
	if (spot.element.getAttribute(spot.attr) !== str) {
		spot.element.setAttribute(spot.attr, str);
	}
}
// Exported for the list half of the split (ListSpot / light rows) — see template/list.js.
export function patchSpot(spot, value) {
	const perfMark = Perf.mark('patch');
	const result = patchSpotBody(spot, value);
	Perf.measure('patch', perfMark);
	return result;
}
const EVENT_SPOTS = new WeakMap();
// @engram em:network/code/click-click-capture-collided-in-two-layers-parser-marker-att — the inner layer; the parser marker name in template/parser.js is the outer
/*
 * One element can carry both an `@click` and an `@click.capture` spot — two
 * native registrations that differ only by capture phase. The per-element map is
 * therefore keyed by phase as well as name; keying by name alone let the second
 * spot overwrite the first while both registrations stayed live, so the survivor
 * fired on both phases and the other never ran at all.
 */
function eventSpotKey(eventName, capture) {
	return `${eventName}|${capture}`;
}
function dispatchEventSpot(host, domEvent, capture) {
	const map = EVENT_SPOTS.get(host);
	if (!map) {
		return undefined;
	}
	const spot = map.get(eventSpotKey(domEvent.type, capture));
	if (!spot) {
		return undefined;
	}
	/*
	 * `.self` — fire only when the event originated on THIS element (the listener
	 * host = currentTarget), not bubbled up from a descendant.
	 */
	if (spot.modSelf && domEvent.target !== host) {
		return undefined;
	}
	if (spot.modStop) {
		domEvent.stopPropagation();
	}
	if (spot.modPrevent) {
		domEvent.preventDefault();
	}
	const result = spot.component.runEventHandler(spot.expr, domEvent, host, domEvent.type);
	/*
	 * `.once` — detach after the first dispatch. Done manually (not native
	 * `{ once: true }`) so the EVENT_SPOTS map entry is removed in lockstep with
	 * the listener; a native once would strand the map entry.
	 */
	if (spot.modOnce) {
		spot.unsubscribe();
	}
	return result;
}
/*
 * Two dispatchers rather than one, because a listener cannot recover the capture
 * flag it was registered with: at the target element both the capturing and the
 * bubbling registration report AT_TARGET, so the phase is genuinely ambiguous.
 * Binding the flag to the listener IDENTITY resolves it — each dispatcher is a
 * module-level function that hands its own fixed flag to the shared body, and
 * addEventListener/removeEventListener key on that same identity.
 */
function dispatchEventSpotCapture(domEvent) {
	return dispatchEventSpot(this, domEvent, true);
}
function dispatchEventSpotBubble(domEvent) {
	return dispatchEventSpot(this, domEvent, false);
}
function eventSpotDispatcher(capture) {
	if (capture) {
		return dispatchEventSpotCapture;
	}
	return dispatchEventSpotBubble;
}
/**
 * One-way state-path watcher. `this.bind('foo')` / `${this.state.foo}` /
 * any `${bindingExpr}` whose expr resolves to a single state path.
 */
class BindingSpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, component, bindingKey, declaredKind) {
		super();
		this.kind = SPOT_KIND.BINDING;
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.declaredKind = declaredKind;
		/*
		 * The binding's realm is callsite-constant (updateSpot swaps `expr` only
		 * for an identically-keyed binding), so resolve it ONCE at install —
		 * refresh was re-running the store lookup + realm object build per call.
		 */
		if (component && isBindingType(expr)) {
			const keyRealm = realmForBinding(expr, component);
			this.realm = keyRealm.realm;
			this.realmPath = keyRealm.path;
		} else {
			this.realm = null;
			this.realmPath = null;
		}
		this.contentKind = null;
		this.patch = null;
		this.pendingValue = undefined;
		/*
		 * true when the marker is folded onto a real parent element (no wrapper);
		 * `bindSpotKind` then leaves pointer-events/display untouched.
		 */
		this.elided = false;
		// anchored partial: comment-bounded range in a parent shared with statics.
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
	}
	/** A BindingSpot subscribes to EXACTLY `bindingKey`, so the value the bus
	 *  hands us is provably identical to re-reading the path — capture it and
	 *  skip the redundant getValueAtPath walk at drain time. Measured 1.28x
	 *  faster than the re-read + task-dispatch path (see _batcherBench). */
	handle(nextValue) {
		this.pendingValue = nextValue;
		markSpotDirty(this);
	}
	drain() {
		const pendingValue = this.pendingValue;
		/*
		 * Release the captured value once patched — holding it until the next
		 * handle() pinned a possibly-large object for the spot's lifetime.
		 */
		this.pendingValue = undefined;
		patchSpot(this, pendingValue);
	}
	refresh() {
		const realm = this.realm;
		if (realm !== null) {
			patchSpot(this, realm.read(this.realmPath));
			return;
		}
		patchSpot(this, resolveBindingValueForBinding(this.component, this.expr));
	}
}
/**
 * Function-valued expression with auto-tracked deps — `${() => …}` and
 * `bind.text(() => …)`. Re-evaluates inside a tracking session every
 * refresh so deps stay accurate.
 */
class ComputedSpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, component, declaredKind) {
		super();
		this.kind = SPOT_KIND.COMPUTED;
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.declaredKind = declaredKind;
		this.contentKind = null;
		this.patch = null;
		this.elided = false;
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
		// ifThen branch-node cache (lazy) — survives per-render thunk swaps.
		this.branchNodes = null;
	}
	refresh() {
		const {
			value,
			deps,
		} = evaluateTrackedExpression(this.component, this.expr, this);
		patchSpot(this, value);
		syncSpotSubscriptions(this, deps);
	}
}
/** Multi-interpolation attribute: `<div data-x="a${b}c${d}e">`. */
class MultiAttrSpot extends Spot {
	constructor(element, slotIndex, attr, parts, component) {
		super();
		this.kind = SPOT_KIND.MULTI;
		this.type = SPOT_TYPE.MULTI_ATTR;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.parts = parts;
		this.component = component;
	}
	refresh() {
		const component = this.component;
		const parts = this.parts;
		const allDeps = new Map();
		let result = '';
		const partsLength = parts.length;
		for (let partIndex = 0; partIndex < partsLength; partIndex++) {
			const part = parts[partIndex];
			if (part.literal !== undefined) {
				result += part.literal;
				continue;
			}
			const expr = part.expr;
			if (isBindingType(expr)) {
				const keyRealm = realmForBinding(expr, component);
				addDep(allDeps, keyRealm.realm, keyRealm.path);
				result += keyRealm.realm.read(keyRealm.path) ?? '';
				continue;
			}
			if (isFunction(expr)) {
				const evaluated = evaluateTrackedExpression(component, expr);
				mergeDepMap(allDeps, evaluated.deps);
				result += evaluated.value ?? '';
				continue;
			}
			result += expr ?? '';
		}
		if (!applySubeventAttr(this.element, this.attr, result)) {
			if (this.element.getAttribute(this.attr) !== result) {
				this.element.setAttribute(this.attr, result);
			}
		}
		syncSpotSubscriptions(this, allDeps);
	}
}
/** `class=` binding — token-level diff via `applyClassListItems`. */
class ClassListSpot extends Spot {
	constructor(element, slotIndex, parts, component) {
		super();
		this.kind = SPOT_KIND.CLASS;
		this.type = SPOT_TYPE.CLASS_LIST;
		this.attr = 'class';
		this.element = element;
		this.slotIndex = slotIndex;
		this.parts = parts;
		this.component = component;
		this.classListCurrent = null;
		/*
		 * Static literals never change — split them into token arrays ONCE here
		 * instead of regex-splitting the same strings on every refresh.
		 */
		const partsLength = parts.length;
		const literalTokens = new Array(partsLength);
		for (let partIndex = 0; partIndex < partsLength; partIndex++) {
			const literal = parts[partIndex].literal;
			literalTokens[partIndex] = literal === undefined ? null : splitClassTokens(literal);
		}
		this.literalTokens = literalTokens;
	}
	refresh() {
		const component = this.component;
		const parts = this.parts;
		const desired = new Set();
		const deps = new Map();
		const partsLength = parts.length;
		for (let partIndex = 0; partIndex < partsLength; partIndex++) {
			const part = parts[partIndex];
			if (part.literal !== undefined) {
				addTokenList(this.literalTokens[partIndex], desired);
				continue;
			}
			const expr = part.expr;
			if (ClassList.isClassList(expr)) {
				applyClassListItems(expr.items, desired, deps, component);
				continue;
			}
			applyClassListItems([expr], desired, deps, component);
		}
		const current = this.classListCurrent ?? new Set();
		diffClassList(this.element, current, desired);
		this.classListCurrent = desired;
		syncSpotSubscriptions(this, deps);
	}
}
/**
 * DOM event handler spot (`@click=${fn}` / `@${namedFn}`). No bus
 * subscription — the WeakMap-keyed listener pattern dispatches through
 * `dispatchEventSpotCapture`/`dispatchEventSpotBubble`, looking up the spot by
 * element + event type + capture phase.
 */
class EventSpot extends Spot {
	constructor(element, slotIndex, eventName, expr, component, modifiers) {
		super();
		this.type = SPOT_TYPE.EVENT;
		this.element = element;
		this.slotIndex = slotIndex;
		this.eventName = eventName;
		this.expr = expr;
		this.component = component;
		/*
		 * `@click.stop.prevent.once.self.capture.passive` modifiers, resolved once
		 * to boolean fields read on the dispatch hot path. `capture` and `passive`
		 * are native addEventListener options (capture also keys add/remove — see
		 * unsubscribe); `stop`/`prevent`/`self`/`once` are applied at dispatch.
		 * `mod`-prefixed so the field never reads as a global (`stop`/`self`).
		 */
		this.modifiers = modifiers ?? null;
		this.modStop = false;
		this.modPrevent = false;
		this.modSelf = false;
		this.modOnce = false;
		this.modCapture = false;
		this.modPassive = false;
		if (modifiers) {
			const modifiersLength = modifiers.length;
			for (let modIndex = 0; modIndex < modifiersLength; modIndex++) {
				const modifier = modifiers[modIndex];
				if (modifier === 'stop') {
					this.modStop = true;
				} else if (modifier === 'prevent') {
					this.modPrevent = true;
				} else if (modifier === 'self') {
					this.modSelf = true;
				} else if (modifier === 'once') {
					this.modOnce = true;
				} else if (modifier === 'capture') {
					this.modCapture = true;
				} else if (modifier === 'passive') {
					this.modPassive = true;
				} else if (defaultLogger.debugOn) {
					defaultLogger.debug('Template EventSpot', `[event] unknown @${eventName} modifier ".${modifier}" — ignored`);
				}
			}
		}
	}
	/**
	 * Native addEventListener options. `undefined` for the common no-modifier
	 * spot so the listener is registered exactly as before. `capture`/`passive`
	 * only ride here; `once` is handled manually in the dispatcher (the shared
	 * listener must stay consistent with the EVENT_SPOTS map).
	 * @returns {AddEventListenerOptions|undefined} Listener options or undefined.
	 */
	listenerOptions() {
		if (!this.modifiers) {
			return undefined;
		}
		return {
			capture: this.modCapture,
			passive: this.modPassive,
		};
	}
	unsubscribe() {
		const map = EVENT_SPOTS.get(this.element);
		if (map) {
			map.delete(eventSpotKey(this.eventName, this.modCapture));
		}
		/*
		 * removeEventListener matches on (type, listener, capture) — every one of
		 * the three must be what add time used, or the removal silently no-ops and
		 * the listener leaks. `modCapture` is the source of truth for both the
		 * dispatcher identity and the flag; `listenerOptions()` is not, since it
		 * collapses to undefined on the no-modifier path.
		 */
		this.element.removeEventListener(this.eventName, eventSpotDispatcher(this.modCapture), this.modCapture);
		super.unsubscribe();
	}
}
function installBindingSpot(plan, element, expr, component) {
	const bindingKey = expr.key;
	if (ListBinding.isListBinding(expr)) {
		const listSpot = new ListSpot(element, plan.slotIndex, plan.type, expr, component, bindingKey, expr.renderFn, expr.keyFn, expr.filterFn);
		listSpot.refresh(null);
		syncSpotSubscriptions(listSpot, bindingDepMap(expr, component));
		return listSpot;
	}
	const propertyIndex = component.propertyIndex;
	/*
	 * Precedence: a `^text`/`^html` sigil on the spot (explicit at the call site)
	 * beats a typed bind's own kind, which beats the inferred `static properties`
	 * kind for the path.
	 */
	const declaredKind = plan.declaredKind ?? expr.kind ?? propertyIndex?.kinds.get(bindingKey) ?? null;
	const spot = new BindingSpot(element, plan.slotIndex, plan.type, plan.attr, expr, component, bindingKey, declaredKind);
	spot.elided = plan.elided === true;
	/*
	 * A path declared `react: false` in `static properties` is a static one-shot —
	 * patch once now, never subscribe.
	 */
	if (propertyIndex?.hasNonReactive && propertyIndex.nonReactivePaths.has(bindingKey)) {
		spot.kind = null;
		spot.refresh();
		return spot;
	}
	spot.refresh();
	syncSpotSubscriptions(spot, bindingDepMap(expr, component));
	return spot;
}
function installComputedSpot(plan, element, expr, component) {
	/*
	 * A `^text`/`^html` sigil on the spot wins; else a typed bind given a
	 * function (`this.bind.text(() => …)`) tags it with a content kind; a plain
	 * `${() => …}` leaves it undefined → auto-classified at patch time.
	 */
	const declaredKind = plan.declaredKind ?? expr.contentKind ?? null;
	const spot = new ComputedSpot(element, plan.slotIndex, plan.type, plan.attr, expr, component, declaredKind);
	spot.elided = plan.elided === true;
	spot.refresh();
	return spot;
}
function installClassListSpot(plan, element, parts, component) {
	const spot = new ClassListSpot(element, plan.slotIndex, parts, component);
	spot.refresh();
	return spot;
}
function installMultiAttrSpot(plan, element, parts, component) {
	const spot = new MultiAttrSpot(element, plan.slotIndex, plan.attr, parts, component);
	spot.refresh();
	return spot;
}
function installEventSpot(plan, element, eventName, expr, component) {
	const spot = new EventSpot(element, plan.slotIndex, eventName, expr, component, plan.modifiers);
	let map = EVENT_SPOTS.get(element);
	if (!map) {
		map = new Map();
		EVENT_SPOTS.set(element, map);
	}
	map.set(eventSpotKey(eventName, spot.modCapture), spot);
	element.addEventListener(eventName, eventSpotDispatcher(spot.modCapture), spot.listenerOptions());
	return spot;
}
/**
 * Inert spot — used for `text`/`bare-attr`/`attr`/`bool-attr`/`prop`
 * positions whose expression is a literal value (no Binding, no function).
 * Patched once on install and again from `updateTemplateSpots` on re-render
 * if the expr changes; never subscribes to state. `unsubscribe()` inherits
 * the base behavior (no-op for empty unsubs/depMap).
 */
class StaticSpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, declaredKind) {
		super();
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		/*
		 * Set only by a `^text`/`^html` sigil on a bare-read text spot — read by
		 * `bindSpotKind` to skip content classification. null = auto-classify.
		 */
		this.declaredKind = declaredKind ?? null;
		this.contentKind = null;
		this.patch = null;
		this.elided = false;
		this.anchored = false;
		this.startComment = null;
		this.endComment = null;
		this.textNode = null;
	}
}
function domAttrForElement(element) {
	if (element.type === 'checkbox' || element.type === 'radio') {
		return 'checked';
	}
	if (element.tagName === 'SELECT') {
		return 'selectedIndex';
	}
	return 'value';
}
function readDomProp(element, attr) {
	if (attr === 'checked') {
		return element.checked;
	}
	if (attr === 'selectedIndex') {
		return element.selectedIndex;
	}
	return element.value;
}
function setDomProp(element, attr, value) {
	if (attr === 'checked') {
		element.checked = Boolean(value);
	} else if (attr === 'selectedIndex') {
		element.selectedIndex = Number(value ?? -1);
	} else {
		element.value = String(value ?? '');
	}
}
function domInputEvent(element) {
	if (element.tagName === 'SELECT' || element.type === 'checkbox' || element.type === 'radio') {
		return 'change';
	}
	return 'input';
}
function writeBoundValue(component, key, value) {
	const resolved = realmForKey(key, component);
	resolved.realm.write(resolved.path, value);
}
const TWO_WAY_SPOTS = new WeakMap();
function dispatchTwoWayInput(domEvent) {
	const map = TWO_WAY_SPOTS.get(this);
	if (!map) {
		return;
	}
	/*
	 * Key off the event that actually fired (`this` is the DOM element, the
	 * listener target), falling back across both channels so a single-spot
	 * element still resolves regardless of which channel it registered.
	 */
	const spot = map.get(domEvent.type) ?? map.get('input') ?? map.get('change');
	if (!spot) {
		return;
	}
	writeBoundValue(spot.component, spot.bindingKey, readDomProp(this, spot.twoWayAttr));
}
/**
 * Two-way `<input>`/`<select>`/`<textarea>` binding. `handle(value)` is the
 * bus callback — a direct DOM write, no scheduling (write is synchronous and
 * idempotent). The DOM-side `input`/`change` listener stays as the module-
 * scope `dispatchTwoWayInput` dispatched via the `TWO_WAY_SPOTS` WeakMap.
 */
class TwoWaySpot extends Spot {
	constructor(element, slotIndex, spotType, attr, expr, component, bindingKey, twoWayAttr, twoWayEvent) {
		super();
		this.type = spotType;
		this.attr = attr;
		this.element = element;
		this.slotIndex = slotIndex;
		this.expr = expr;
		this.component = component;
		this.bindingKey = bindingKey;
		this.twoWayAttr = twoWayAttr;
		this.twoWayEvent = twoWayEvent;
	}
	handle(nextValue) {
		setDomProp(this.element, this.twoWayAttr, nextValue);
	}
	unsubscribe() {
		const map = TWO_WAY_SPOTS.get(this.element);
		if (map) {
			map.delete(this.twoWayEvent);
		}
		this.element.removeEventListener(this.twoWayEvent, dispatchTwoWayInput);
		super.unsubscribe();
	}
}
function installTwoWaySpot(plan, element, expr, component, explicitKey) {
	const key = explicitKey ?? expr.key;
	const attr = plan.attr ?? domAttrForElement(element);
	const eventType = domInputEvent(element);
	const spot = new TwoWaySpot(element, plan.slotIndex, plan.type, attr, expr, component, key, attr, eventType);
	setDomProp(element, attr, resolveBindingValue(component, key));
	if (element.hasAttribute('value')) {
		element.removeAttribute('value');
	}
	if (element.hasAttribute('checked')) {
		element.removeAttribute('checked');
	}
	const boundRealm = realmForKey(key, component);
	(spot.unsubs ??= []).push(boundRealm.realm.bus.subscribe(boundRealm.path, TwoWaySpot.prototype.handle, spot));
	let map = TWO_WAY_SPOTS.get(element);
	if (!map) {
		map = new Map();
		TWO_WAY_SPOTS.set(element, map);
	}
	map.set(eventType, spot);
	element.addEventListener(eventType, dispatchTwoWayInput);
	return spot;
}
const DATA_BIND_SPOTS = new WeakMap();
function dispatchDataBindInput() {
	const spot = DATA_BIND_SPOTS.get(this);
	if (!spot) {
		return;
	}
	if (spot.isCheck) {
		setValueAtPath(spot.component.stateProxy, spot.bindingKey, this.checked);
		return;
	}
	let domValue = this.value;
	if (spot.modTrim) {
		domValue = domValue.trim();
	}
	if (spot.modNumber) {
		// `.number` — coerce to a float; keep the raw string on NaN (Vue parity).
		const parsed = parseFloat(domValue);
		domValue = Number.isNaN(parsed) ? domValue : parsed;
	}
	setValueAtPath(spot.component.stateProxy, spot.bindingKey, domValue);
}
/**
 * `data-bind="key"` HTML-attribute two-way binding (cousin of TwoWaySpot —
 * activated by markup, not by template interpolation). Lives outside the
 * `tplState.spots` array; pushed directly into the template's `unsubs` array
 * because it is its own Disposable. `handle(value)` writes the next value
 * into the DOM property; `unsubscribe()` tears down both the bus
 * subscription (already an `unsubs` entry) and the WeakMap / DOM listener.
 */
class DataBindSpot {
	constructor(element, stateKey, component, modifiers) {
		this.element = element;
		this.component = component;
		this.bindingKey = stateKey;
		this.isCheck = element.type === 'checkbox' || element.type === 'radio';
		/*
		 * `$value` modifiers: `.number`/`.trim` transform the DOM→state write
		 * (dispatchDataBindInput); `.lazy` listens on `change` instead of `input`
		 * so state updates on blur/commit, not per keystroke.
		 */
		this.modNumber = false;
		this.modTrim = false;
		let lazy = false;
		if (modifiers) {
			const modifiersLength = modifiers.length;
			for (let modIndex = 0; modIndex < modifiersLength; modIndex++) {
				const modifier = modifiers[modIndex];
				if (modifier === 'number') {
					this.modNumber = true;
				} else if (modifier === 'trim') {
					this.modTrim = true;
				} else if (modifier === 'lazy') {
					lazy = true;
				} else if (defaultLogger.debugOn) {
					defaultLogger.debug('Template DataBindSpot', `[databind] unknown $-bind modifier ".${modifier}" on "${stateKey}" — ignored`);
				}
			}
		}
		this.eventType = lazy ? 'change' : domInputEvent(element);
		this.busSubscription = null;
	}
	handle(nextValue) {
		if (this.isCheck) {
			this.element.checked = Boolean(nextValue);
		} else {
			this.element.value = String(nextValue ?? '');
		}
	}
	unsubscribe() {
		DATA_BIND_SPOTS.delete(this.element);
		this.element.removeEventListener(this.eventType, dispatchDataBindInput);
		if (this.busSubscription) {
			this.busSubscription.unsubscribe();
			this.busSubscription = null;
		}
	}
}
function installDataBind(element, stateKey, component, unsubs, modifiers) {
	const spot = new DataBindSpot(element, stateKey, component, modifiers);
	DATA_BIND_SPOTS.set(element, spot);
	element.addEventListener(spot.eventType, dispatchDataBindInput);
	spot.busSubscription = subscribeStatePath(component, stateKey, DataBindSpot.prototype.handle, spot);
	unsubs.push(spot);
	const currentValue = getValueAtPath(component.STATE, stateKey);
	if (currentValue !== undefined) {
		spot.handle(currentValue);
	}
}
function buildMultiParts(planParts, exprs) {
	const parts = new Array(planParts.length);
	const planPartsLength = planParts.length;
	for (let partIndex = 0; partIndex < planPartsLength; partIndex++) {
		const part = planParts[partIndex];
		if (part.literal === undefined) {
			parts[partIndex] = {
				exprIndex: part.exprIndex,
				expr: exprs[part.exprIndex],
			};
		} else {
			parts[partIndex] = {
				literal: part.literal,
			};
		}
	}
	return parts;
}
function deduceEventName(plan, expr) {
	if (!plan.deduceFromExpr) {
		return plan.eventName;
	}
	if (!isFunction(expr)) {
		throw new TypeError('Template event handler must be a function.');
	}
	const fnName = expr.name;
	if (!fnName || fnName.startsWith('bound ')) {
		throw new TypeError(`@\${fn} requires a named function reference; got "${fnName || 'anonymous'}". Pass a class method, named function, or class arrow field; not an anonymous arrow or .bind() result.`);
	}
	return fnName;
}
function inferTwoWayBindingKey(component, expr, type, element, attr) {
	const isBindableField = (type === SPOT_TYPE.ATTR || type === SPOT_TYPE.BARE_ATTR) &&
		BINDABLE_TAGS.has(element.tagName) &&
		BINDABLE_ATTRS.has(attr);
	if (!isBindableField) {
		return null;
	}
	const evaluated = evaluateTrackedExpression(component, expr);
	const single = singleDepOf(evaluated.deps);
	if (!single) {
		return null;
	}
	const inferredKey = single.realm.global ? `global.${single.path}` : single.path;
	const sourceValue = resolveBindingValue(component, inferredKey);
	return sourceValue === evaluated.value ? inferredKey : null;
}
function markAnchored(spot, startComment, endComment) {
	spot.anchored = true;
	spot.startComment = startComment;
	spot.endComment = endComment;
	spot.textNode = null;
}
/**
 * Install path for a PARTIAL (anchored) text spot. Mirrors the text-position
 * branch of installSpotFromPlan (list-binding / binding / function / static) but
 * resolves the two comment markers and flags the spot anchored BEFORE its first
 * patch, so every refresh dispatches through CONTENT_PATCHERS_ANCHORED and never
 * touches the parent's whole content. Kept separate so the hot tier-1 / wrapper
 * install stays byte-identical.
 */
function installAnchoredTextSpot(plan, resolved, exprs, component) {
	const startComment = resolved.startComment;
	const endComment = resolved.endComment;
	if (!startComment || !endComment) {
		return null;
	}
	const parentEl = startComment.parentNode;
	const expr = exprs[plan.slotIndex];
	if (ListBinding.isListBinding(expr)) {
		const listSpot = new ListSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, expr, component, expr.key, expr.renderFn, expr.keyFn, expr.filterFn);
		markAnchored(listSpot, startComment, endComment);
		listSpot.refresh(null);
		syncSpotSubscriptions(listSpot, bindingDepMap(expr, component));
		return listSpot;
	}
	if (isBindingType(expr)) {
		const bindingKey = expr.key;
		const propertyIndex = component?.propertyIndex;
		const declaredKind = plan.declaredKind ?? expr.kind ?? propertyIndex?.kinds.get(bindingKey) ?? null;
		const spot = new BindingSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, undefined, expr, component, bindingKey, declaredKind);
		markAnchored(spot, startComment, endComment);
		if (propertyIndex?.hasNonReactive && propertyIndex.nonReactivePaths.has(bindingKey)) {
			spot.kind = null;
			spot.refresh();
			return spot;
		}
		spot.refresh();
		syncSpotSubscriptions(spot, bindingDepMap(expr, component));
		return spot;
	}
	if (isFunction(expr)) {
		const declaredKind = plan.declaredKind ?? expr.contentKind ?? null;
		const spot = new ComputedSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, undefined, expr, component, declaredKind);
		markAnchored(spot, startComment, endComment);
		spot.refresh();
		return spot;
	}
	const staticSpot = new StaticSpot(parentEl, plan.slotIndex, SPOT_TYPE.TEXT, undefined, expr, plan.declaredKind);
	markAnchored(staticSpot, startComment, endComment);
	patchSpot(staticSpot, expr);
	return staticSpot;
}
// Exported for the list half of the split (light-row instantiation) — see template/list.js.
export function installSpotFromPlan(plan, resolved, exprs, component) {
	if (plan.anchored) {
		return installAnchoredTextSpot(plan, resolved, exprs, component);
	}
	const element = resolved;
	if (!element) {
		return null;
	}
	if (plan.type === SPOT_TYPE.MULTI_ATTR) {
		const parts = buildMultiParts(plan.parts, exprs);
		/**
		 * `class=` always uses the class-list spot so updates diff individual
		 * tokens (preserving any class added externally), and every input
		 * type — string, function, ClassList, Set, Array, Map, Binding — is
		 * handled by the same machinery in `applyClassListItems`.
		 */
		if (plan.attr === 'class') {
			return installClassListSpot(plan, element, parts, component);
		}
		return installMultiAttrSpot(plan, element, parts, component);
	}
	const expr = exprs[plan.slotIndex];
	if (plan.type === SPOT_TYPE.BIND) {
		if (!isBindingType(expr)) {
			return null;
		}
		return installTwoWaySpot(plan, element, expr, component);
	}
	if (plan.type === SPOT_TYPE.EVENT) {
		if (plan.deduceFromExpr && (expr === undefined || expr === null || expr === false)) {
			return null;
		}
		const eventName = deduceEventName(plan, expr);
		return installEventSpot(plan, element, eventName, expr, component);
	}
	const resolvedType = plan.type;
	let resolvedAttr = plan.attr;
	if (plan.type === SPOT_TYPE.TEXT) {
		// `text`/`bare-attr` etc. flow through below — text starts with no attr.
	} else if (plan.type === SPOT_TYPE.BARE_ATTR) {
		const inferredAttr = inferBareAttrName(expr);
		if (!inferredAttr) {
			return null;
		}
		resolvedAttr = inferredAttr;
	} else if (plan.type === SPOT_TYPE.ATTR) {
		if (plan.attr === 'class') {
			const singletonParts = [
				{
					exprIndex: plan.slotIndex,
					expr,
				},
			];
			return installClassListSpot(plan, element, singletonParts, component);
		}
	} else if (plan.type === SPOT_TYPE.BOOL_ATTR || plan.type === SPOT_TYPE.PROP || plan.type === SPOT_TYPE.METHOD) {
		/*
		 * METHOD rides the same binding/computed/static dispatch as PROP — a static
		 * arg calls once and repatches on re-render, a `bind()` arg re-calls
		 * surgically, a `() =>` arg re-calls on dep change. Only the patch step
		 * differs (call vs assign), keyed off `resolvedType`.
		 */
	} else {
		return null;
	}
	const resolvedPlan = resolvedAttr === plan.attr ? plan : {
		...plan,
		attr: resolvedAttr,
	};
	if (isBindingType(expr)) {
		const autoTwoWay = (resolvedType === SPOT_TYPE.ATTR || resolvedType === SPOT_TYPE.BARE_ATTR) &&
			BINDABLE_TAGS.has(element.tagName) &&
			BINDABLE_ATTRS.has(resolvedAttr);
		if (autoTwoWay) {
			return installTwoWaySpot(resolvedPlan, element, expr, component);
		}
		return installBindingSpot(resolvedPlan, element, expr, component);
	}
	if (isFunction(expr)) {
		const inferredKey = inferTwoWayBindingKey(component, expr, resolvedType, element, resolvedAttr);
		if (inferredKey) {
			return installTwoWaySpot(resolvedPlan, element, expr, component, inferredKey);
		}
		return installComputedSpot(resolvedPlan, element, expr, component);
	}
	/*
	 * Static literal value — patch once now; updateTemplateSpots will repatch
	 * on re-render if the expr changes.
	 */
	const staticSpot = new StaticSpot(element, plan.slotIndex, resolvedType, resolvedAttr, expr, plan.declaredKind);
	staticSpot.elided = plan.elided === true;
	if (resolvedType === SPOT_TYPE.TEXT) {
		if (ListBinding.isListBinding(expr)) {
			staticSpot.patch = patchListKind;
			if (!staticSpot.elided) {
				element.style.pointerEvents = '';
			}
		} else if (ComponentBinding.is(expr)) {
			staticSpot.patch = patchComponentKind;
			if (!staticSpot.elided) {
				element.style.pointerEvents = '';
			}
		}
	}
	patchSpot(staticSpot, expr);
	return staticSpot;
}
function cleanupSpots(spots) {
	if (!spots || !spots.length) {
		return;
	}
	const spotsLength = spots.length;
	for (let spotIndex = 0; spotIndex < spotsLength; spotIndex++) {
		spots[spotIndex].unsubscribe();
	}
}
function collectBoundKeys(spots, dataBindPlans) {
	const keys = new Set();
	const spotsLength = spots.length;
	for (let spotIndex = 0; spotIndex < spotsLength; spotIndex++) {
		const spot = spots[spotIndex];
		if (spot.type === SPOT_TYPE.MULTI_ATTR || spot.type === SPOT_TYPE.CLASS_LIST) {
			const partsLength = spot.parts.length;
			for (let partIndex = 0; partIndex < partsLength; partIndex++) {
				const part = spot.parts[partIndex];
				if (isBindingType(part.expr)) {
					keys.add(part.expr.key);
				}
			}
			continue;
		}
		if (spot.bindingKey) {
			keys.add(spot.bindingKey);
			continue;
		}
		if (isBindingType(spot.expr)) {
			keys.add(spot.expr.key);
		}
	}
	if (dataBindPlans) {
		const dataBindPlansLength = dataBindPlans.length;
		for (let planIndex = 0; planIndex < dataBindPlansLength; planIndex++) {
			const plan = dataBindPlans[planIndex];
			if (plan.key) {
				keys.add(plan.key);
			}
		}
	}
	return keys;
}
const EMPTY_SPOTS = Object.freeze([]);
const EMPTY_UNSUBS = Object.freeze([]);
const EMPTY_KEYS = new Set();
function instantiateRecipe(recipe, exprs, component) {
	if (recipe.isStatic) {
		return {
			fragment: recipe.fragment.cloneNode(true),
			spots: EMPTY_SPOTS,
			unsubs: EMPTY_UNSUBS,
			boundKeys: EMPTY_KEYS,
		};
	}
	const instantiateMark = Perf.mark('instantiate');
	const fragment = recipe.fragment.cloneNode(true);
	const spots = [];
	const unsubs = [];
	const spotPlans = recipe.spotPlans;
	const dataBindPlans = recipe.dataBindPlans;
	const subeventPlans = recipe.subeventPlans;
	const refPlans = recipe.refPlans;
	/*
	 * PHASE 1 — resolve every plan's node(s) on the PRISTINE clone, before any
	 * install runs. An anchored spot install inserts content between its comment
	 * markers, shifting the child indices of every later marker; capturing all
	 * references up front keeps paths valid. Phase 2 only moves captured refs.
	 */
	const spotInstallMark = Perf.mark('spotInstall');
	/*
	 * One TreeWalker sweep resolves every plan family's nodes by pre-order slot
	 * (see planner.js resolveRecipeNodes) — no per-plan root walks.
	 */
	const resolvedNodes = resolveRecipeNodes(fragment, recipe.resolveTargets);
	const spotResolved = new Array(spotPlans.length);
	const spotPlansLength = spotPlans.length;
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		const plan = spotPlans[spotIndex];
		if (plan.anchored) {
			spotResolved[spotIndex] = {
				startComment: resolvedNodes[plan.startSlot],
				endComment: resolvedNodes[plan.endSlot],
			};
		} else {
			spotResolved[spotIndex] = resolvedNodes[plan.nodeSlot];
		}
	}
	const dataBindEls = new Array(dataBindPlans.length);
	const dataBindPlansLength = dataBindPlans.length;
	for (let bindIndex = 0; bindIndex < dataBindPlansLength; bindIndex++) {
		dataBindEls[bindIndex] = resolvedNodes[dataBindPlans[bindIndex].nodeSlot];
	}
	const subeventEls = subeventPlans ? new Array(subeventPlans.length) : null;
	if (subeventPlans) {
		const subeventPlansLength = subeventPlans.length;
		for (let subeventIndex = 0; subeventIndex < subeventPlansLength; subeventIndex++) {
			subeventEls[subeventIndex] = resolvedNodes[subeventPlans[subeventIndex].nodeSlot];
		}
	}
	const refEls = refPlans ? new Array(refPlans.length) : null;
	if (refPlans) {
		const refPlansLength = refPlans.length;
		for (let refIndex = 0; refIndex < refPlansLength; refIndex++) {
			refEls[refIndex] = resolvedNodes[refPlans[refIndex].nodeSlot];
		}
	}
	// PHASE 2 — install. Anchored insertions are now safe (every node captured).
	for (let spotIndex = 0; spotIndex < spotPlansLength; spotIndex++) {
		const spot = installSpotFromPlan(spotPlans[spotIndex], spotResolved[spotIndex], exprs, component);
		if (spot) {
			spots.push(spot);
		}
	}
	Perf.measure('spotInstall', spotInstallMark);
	for (let bindIndex = 0; bindIndex < dataBindPlansLength; bindIndex++) {
		const element = dataBindEls[bindIndex];
		if (!element) {
			continue;
		}
		installDataBind(element, dataBindPlans[bindIndex].key, component, unsubs, dataBindPlans[bindIndex].modifiers);
	}
	if (subeventPlans) {
		const subeventPlansLength = subeventPlans.length;
		for (let subeventIndex = 0; subeventIndex < subeventPlansLength; subeventIndex++) {
			const element = subeventEls[subeventIndex];
			if (!element) {
				continue;
			}
			/*
			 * Behavior install owns the initial value end-to-end — passed as the
			 * `value` arg directly. The tooltip behavior stores `value` in a
			 * WeakMap; legacy behaviors only need it at install time. Dynamic
			 * updates flow through `applySubeventAttr` → `behavior.applyValue`.
			 */
			const plan = subeventPlans[subeventIndex];
			const behavior = getBehavior(plan.attrName);
			if (behavior?.install) {
				behavior.install(element, plan.value, component);
				if (behavior.uninstall) {
					unsubs.push(new BehaviorTeardown(behavior, element));
				}
			}
		}
	}
	if (refPlans) {
		const refPlansLength = refPlans.length;
		for (let refIndex = 0; refIndex < refPlansLength; refIndex++) {
			const element = refEls[refIndex];
			if (!element) {
				continue;
			}
			unsubs.push(registerRef(component, refPlans[refIndex].name, element));
		}
	}
	const instance = {
		fragment,
		spots,
		unsubs,
		boundKeys: collectBoundKeys(spots, recipe.dataBindPlans),
	};
	Perf.measure('instantiate', instantiateMark);
	return instance;
}
function updateSpot(spot, newExpr, component) {
	if (spot.type === SPOT_TYPE.EVENT) {
		spot.expr = newExpr;
		return;
	}
	if (spot.type === SPOT_TYPE.BIND) {
		return;
	}
	if (isBindingType(newExpr) || isFunction(newExpr)) {
		spot.expr = newExpr;
		return;
	}
	/*
	 * ATTR routes through patchSpot like every other patchable type — the old
	 * inline ATTR copy here DRIFTED from patchSpotBody (String()-ified falsy
	 * values first render removes, fed subevent behaviors the stringified value
	 * instead of the raw one, clobbered style objects). One application path =
	 * parity with first render by construction.
	 */
	if (
		spot.type === SPOT_TYPE.TEXT ||
		spot.type === SPOT_TYPE.ATTR ||
		spot.type === SPOT_TYPE.BARE_ATTR ||
		spot.type === SPOT_TYPE.BOOL_ATTR ||
		spot.type === SPOT_TYPE.PROP ||
		spot.type === SPOT_TYPE.METHOD
	) {
		patchSpot(spot, newExpr);
		spot.expr = newExpr;
	}
}
function isStateProxyValue(value) {
	/*
	 * Both `StateProxyHandler` and `TrackingProxyHandler` answer the
	 * `STATE_PATH` symbol with a non-undefined dotted path. Plain objects
	 * return undefined because symbols can only be looked up by identity.
	 * We use this to distinguish "a value that may have mutated in place"
	 * (state proxy whose underlying object got patched) from a true static
	 * value, so `updateTemplateSpots` knows not to bail on the same-
	 * reference skip for the proxy case.
	 */
	return value !== null && typeof value === 'object' && value[STATE_PATH] !== undefined;
}
/**
 * Shared between MULTI_ATTR and CLASS_LIST spot re-render paths. Walks the
 * spot's `parts` array, updates any expression slots whose value changed
 * against the latest `newExprs`, and returns whether any slot changed. Pure
 * indexed for-loop, no per-call closure — was previously two near-identical
 * `eachArray(spot.parts, (part) => {…})` blocks allocating an arrow per
 * multi/class spot per re-render.
 */
function syncSpotParts(parts, newExprs) {
	let changed = false;
	const partsLength = parts.length;
	for (let partIndex = 0; partIndex < partsLength; partIndex++) {
		const part = parts[partIndex];
		if (part.exprIndex === undefined) {
			continue;
		}
		const partVal = newExprs[part.exprIndex];
		if (part.expr !== partVal) {
			part.expr = partVal;
			changed = true;
		}
	}
	return changed;
}
// Exported for the list half of the split (light-row repatch) — see template/list.js.
export function updateTemplateSpots(state, newExprs, component) {
	const {
		spots, prevExprs,
	} = state;
	const spotsLength = spots.length;
	for (let spotIndex = 0; spotIndex < spotsLength; spotIndex++) {
		const spot = spots[spotIndex];
		if (spot.type === SPOT_TYPE.MULTI_ATTR) {
			if (syncSpotParts(spot.parts, newExprs)) {
				spot.refresh();
			}
			continue;
		}
		if (spot.type === SPOT_TYPE.CLASS_LIST) {
			if (syncSpotParts(spot.parts, newExprs)) {
				spot.refresh();
			}
			continue;
		}
		const slotIndex = spot.slotIndex;
		if (slotIndex === undefined) {
			continue;
		}
		const newVal = newExprs[slotIndex];
		const prevVal = prevExprs[slotIndex];
		/*
		 * The reference-equality skip is correct for static values and
		 * function refs (computed spots own their own subscription path).
		 * It is INCORRECT for a live state proxy: the proxy reference is
		 * cached per underlying object, so `parent.state.foo` returns the
		 * same proxy across renders even when the underlying object's
		 * properties have mutated. Bailing here would freeze any child
		 * `.state=${this.state.foo}` binding on the first render's
		 * snapshot. Detect the proxy and let `updateSpot` patch through —
		 * the child's `replaceState` does its own plainEqual check, so
		 * genuinely unchanged proxies still cost only a deep compare.
		 */
		if (newVal === prevVal && !isStateProxyValue(newVal)) {
			continue;
		}
		updateSpot(spot, newVal, component);
	}
	/*
	 * Retain the exprs array directly — no copy. Every caller on the patch path
	 * (templateHtml / templateHtmlElement / patchLightRow) passes a freshly minted
	 * single-use array and returns before any instantiate, and prevExprs is only
	 * ever read — so there is nothing to alias against. (The INSTALL sites still
	 * `.slice()` because there the array is shared with instantiateRecipe.)
	 */
	state.prevExprs = newExprs;
}
/**
 * Per-instance template runtime: plain fields, no closures. All template
 * methods are first-class functions on WebComponent.prototype so the JIT can
 * monomorphize them across every component instance. `tplCleanupNodes` is the
 * only set of nodes we must visit on teardown — populated by templateHtmlElement.
 * Other DOM nodes' WeakMap entries (HTML_ELEMENT_INSTANCES) auto-clean on GC
 * once `replaceChildren` detaches them; we don't pay for a full subtree walk.
 */
export function initTemplateRuntime(component) {
	/*
	 * All four containers are lazy (`??=` at their single write sites): a leaf
	 * component with no unsubs / htmlElement calls pays zero allocations here —
	 * this runs once per construct, 500× on a big list mount.
	 * `htmlElementCache` (allocated in templateHtmlElement) is keyed by the
	 * tagged-template strings array so re-entering the same call site returns
	 * the same root element with its spots patched in place — without it,
	 * patterns like `${this.renderBody}` (computed spot → `htmlElement`) would
	 * mint a fresh subtree on every dep change, ripping focus out of any
	 * focused input every time the user typed.
	 */
	component.tplUnsubs = null;
	component.tplState = null;
	component.tplBoundKeys = null;
	component.tplCleanupNodes = null;
	component.htmlElementCache = null;
}
function runCleanupOnNode(node) {
	cleanupTemplateNode(node);
}
function runTemplateCleanup(component) {
	/* Detach relocated <portal> wrappers first — fires on rebuild (before
	 * re-projection) AND disconnect (cleanupTemplate), so a portal never outlives
	 * its owner. A patch pass skips this path, leaving moved content to patch in place. */
	removePortals(component);
	if (component.tplState) {
		cleanupSpots(component.tplState.spots);
	}
	if (component.tplUnsubs) {
		eachArray(component.tplUnsubs, disposeItem);
		component.tplUnsubs = null;
	}
	if (component.tplCleanupNodes?.size) {
		component.tplCleanupNodes.forEach(runCleanupOnNode);
		component.tplCleanupNodes.clear();
	}
	component.tplState = null;
	component.tplBoundKeys = null;
	component.htmlElementCache?.clear();
}
export function templateCleanup() {
	runTemplateCleanup(this);
}
export function templateHtml(strings, ...exprs) {
	const state = this.tplState;
	if (state && state.strings === strings) {
		updateTemplateSpots(state, exprs, this);
		this.templateBuilt = true;
		return;
	}
	runTemplateCleanup(this);
	const recipe = getRecipe(strings);
	const instance = instantiateRecipe(recipe, exprs, this);
	this.tplUnsubs = instance.unsubs;
	this.tplBoundKeys = instance.boundKeys;
	const renderRoot = this.shadowRoot ?? this;
	/*
	 * Light DOM (renderRoot === this): capture the host's authored children before
	 * replaceChildren detaches them, then redistribute into the template's <slot>
	 * markers. Shadow DOM projects natively — skipped. Both helpers self-guard, so
	 * a light component with no authored children pays only a WeakMap lookup.
	 */
	if (renderRoot === this) {
		captureLightChildren(this);
	}
	renderRoot.replaceChildren(instance.fragment);
	if (renderRoot === this) {
		projectLightChildren(this);
	}
	/* Relocate any <portal> markers AFTER mount — both shadow and light, since a
	 * portal escapes the render root in either mode. Gated on the recipe flag so
	 * portal-free templates skip the query; spots already point at the moved nodes,
	 * so reactivity follows for free. */
	if (recipe.hasPortal) {
		projectPortals(this, renderRoot);
	}
	this.templateBuilt = true;
	this.tplState = {
		strings,
		spots: instance.spots,
		prevExprs: exprs.slice(),
	};
}
const HTML_ELEMENT_INSTANCES = new WeakMap();
function cleanupHtmlElementInstance(node) {
	const instance = HTML_ELEMENT_INSTANCES.get(node);
	if (!instance) {
		return;
	}
	HTML_ELEMENT_INSTANCES.delete(node);
	cleanupSpots(instance.spots);
	clearSubscriptions(instance.unsubs);
}
export function templateHtmlElement(strings, ...exprs) {
	/*
	 * Stable identity across calls from the same site: the tagged-template
	 * `strings` array is a per-call-site singleton, so we cache the root
	 * element + tplState there. Repeated calls (e.g. a `${this.renderBody}`
	 * computed spot refreshing on every typed character) patch the existing
	 * subtree's spots in place via `updateTemplateSpots` and return the
	 * same root, which lets `patchComponentKind`'s `firstChild === node`
	 * short-circuit fire and leaves focus, selection, and IME state alone.
	 */
	const cache = this.htmlElementCache ??= new Map();
	const cached = cache.get(strings);
	if (cached) {
		updateTemplateSpots(cached.tplState, exprs, this);
		return cached.element;
	}
	const recipe = getRecipe(strings);
	const instance = instantiateRecipe(recipe, exprs, this);
	if (instance.fragment.children.length !== 1) {
		cleanupSpots(instance.spots);
		clearSubscriptions(instance.unsubs);
		throw new TypeError('htmlElement requires exactly one root element.');
	}
	const element = instance.fragment.firstElementChild;
	HTML_ELEMENT_INSTANCES.set(element, instance);
	element[TEMPLATE_CLEANUP] = cleanupHtmlElementInstance;
	(this.tplCleanupNodes ??= new Set()).add(element);
	cache.set(strings, {
		element,
		tplState: {
			strings,
			spots: instance.spots,
			prevExprs: exprs.slice(),
		},
	});
	return element;
}
