import { LIFECYCLE_PROMISE } from '../lifecycle/lifecycle.js';
import { PHASE } from '../lifecycle/phase.js';
import { isFunction, isShadowRoot } from '../utilities.js';
import { describeComponent, sanitize } from './descriptors.js';
import {
	getDirectChildren,
	getNameForComponent,
	getPathForComponent,
	invalidatePathIndex,
	pageOverview,
} from './paths.js';
import {
	defineInstanceTool,
	getComponentId,
	getTools,
	registerComponent,
	suppressNotifications,
	unregisterComponent,
} from './registry.js';
import { textPageMap } from './visual.js';
const APPLIED = Symbol('viat-ai-mixin-applied');
/*
 * Awaitable lifecycle phases for `aiWaitFor`. No `disconnected` entry —
 * disconnect is not a promise (a recurring transition; observe it via the
 * `onDisconnect` hook / `isDisconnected` / native `disconnectedCallback`).
 * `destroyed` stays (it IS a one-shot promise via `destroy()`).
 */
const WHEN_BY_PHASE = {
	[PHASE.CONNECTED]: LIFECYCLE_PROMISE.CONNECTED,
	[PHASE.RENDERED]: LIFECYCLE_PROMISE.RENDERED,
	[PHASE.MOUNTED]: LIFECYCLE_PROMISE.MOUNTED,
	[PHASE.LIVE]: LIFECYCLE_PROMISE.LIVE,
	visible: LIFECYCLE_PROMISE.VISIBLE,
	[PHASE.DESTROYED]: LIFECYCLE_PROMISE.DESTROYED,
};
function findAiAncestor(element) {
	const root = element.getRootNode();
	const parentHost = isShadowRoot(root) ? root.host : element.parentElement;
	if (parentHost && getComponentId(parentHost)) {
		return parentHost;
	}
	return null;
}
function collectAttrSnapshot(component) {
	const out = {};
	const list = component.attributes;
	const listLength = list.length;
	for (let index = 0; index < listLength; index++) {
		out[list[index].name] = list[index].value;
	}
	return out;
}
function collectBounds(component) {
	if (!component.isConnected) {
		return null;
	}
	const rect = component.getBoundingClientRect();
	const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < globalThis.innerHeight && rect.left < globalThis.innerWidth;
	return {
		x: Math.round(rect.x),
		y: Math.round(rect.y),
		w: Math.round(rect.width),
		h: Math.round(rect.height),
		visible: rect.width > 0 && rect.height > 0,
		inViewport,
	};
}
function walkSubtree(component, visitor) {
	const kids = getDirectChildren(component);
	const kidsLength = kids.length;
	for (let index = 0; index < kidsLength; index++) {
		visitor(kids[index]);
		walkSubtree(kids[index], visitor);
	}
}
function makeMatcher(filter) {
	if (isFunction(filter)) {
		return filter;
	}
	if (!filter || typeof filter !== 'object') {
		return null;
	}
	const tagFilter = filter.tag ? String(filter.tag).toLowerCase() : null;
	const roleFilter = filter.role ?? null;
	const labelFilter = filter.label ? String(filter.label).toLowerCase() : null;
	const pathPrefix = filter.pathStartsWith ? String(filter.pathStartsWith) : null;
	return (candidate) => {
		if (tagFilter && candidate.tagName.toLowerCase() !== tagFilter) {
			return false;
		}
		if (roleFilter) {
			const compRole = candidate.constructor.aiRole ?? candidate.getAttribute('role');
			if (compRole !== roleFilter) {
				return false;
			}
		}
		if (labelFilter) {
			const ariaLabel = (candidate.getAttribute('aria-label') ?? candidate.constructor.aiLabel ?? '').toLowerCase();
			const desc = (candidate.constructor.aiDescription ?? '').toLowerCase();
			if (!ariaLabel.includes(labelFilter) && !desc.includes(labelFilter)) {
				return false;
			}
		}
		if (pathPrefix) {
			const path = getPathForComponent(candidate) ?? '';
			if (!path.startsWith(pathPrefix)) {
				return false;
			}
		}
		return true;
	};
}
export const aiMethods = {
	aiRegister(parentComponent) {
		const resolvedParent = parentComponent === undefined ? findAiAncestor(this) : parentComponent;
		return registerComponent(this, resolvedParent ?? null);
	},
	aiUnregister() {
		return unregisterComponent(this);
	},
	aiId() {
		return getComponentId(this);
	},
	aiPath() {
		return getPathForComponent(this);
	},
	aiSegment() {
		return getNameForComponent(this);
	},
	aiChildren() {
		return getDirectChildren(this);
	},
	aiOverview(opts) {
		return pageOverview({
			...opts,
			root: this,
		});
	},
	aiMap(opts) {
		return textPageMap({
			...opts,
			root: this,
		});
	},
	aiDescribe(opts) {
		return describeComponent(this, opts);
	},
	aiTools() {
		return getTools(this);
	},
	aiDefineTool(toolLabel, def) {
		return defineInstanceTool(this, toolLabel, def);
	},
	aiPhase() {
		return this.phase ?? null;
	},
	aiState() {
		const projector = isFunction(this.constructor.aiState) ? this.constructor.aiState : null;
		const raw = projector ? projector(this) : this.STATE;
		return sanitize(raw, 0);
	},
	aiAttrs() {
		return collectAttrSnapshot(this);
	},
	aiBounds() {
		return collectBounds(this);
	},
	aiVisibility() {
		return {
			phase: this.phase ?? null,
			isConnected: this.isConnected,
			isRendered: this.isRendered === true,
			isMounted: this.isMounted === true,
			isLive: this.isLive === true,
			isVisible: this.isVisible === true,
			isIntersecting: this.isIntersecting === true,
			isIntersected: this.isIntersected === true,
		};
	},
	aiRefs() {
		if (!this.refsMap) {
			return [];
		}
		return [...this.refsMap.keys()];
	},
	aiRef(refLabel) {
		return isFunction(this.getRef) ? this.getRef(refLabel) : null;
	},
	aiText(maxLen = 240) {
		const root = this.shadowRoot ?? this;
		const text = root.textContent?.trim() ?? '';
		if (!text) {
			return '';
		}
		const condensed = text.replace(/\s+/g, ' ');
		return condensed.length > maxLen ? `${condensed.slice(0, maxLen)}…` : condensed;
	},
	aiEmit(eventLabel, data) {
		if (!isFunction(this.emit)) {
			return null;
		}
		return this.emit(eventLabel, data);
	},
	aiGlobalState() {
		return sanitize(this.global, 0);
	},
	aiWaitFor(phaseName) {
		const promiseKey = WHEN_BY_PHASE[phaseName];
		if (!promiseKey) {
			return Promise.reject(new Error(`aiWaitFor: unknown phase "${phaseName}"`));
		}
		return this[promiseKey] ?? Promise.resolve();
	},
	aiQuery(filter) {
		const out = [];
		const match = makeMatcher(filter);
		if (!match) {
			walkSubtree(this, (candidate) => {
				return out.push(candidate);
			});
			return out;
		}
		walkSubtree(this, (candidate) => {
			if (match(candidate)) {
				out.push(candidate);
			}
		});
		return out;
	},
	aiFind(filter) {
		const match = makeMatcher(filter);
		if (!match) {
			return getDirectChildren(this)[0] ?? null;
		}
		let found = null;
		walkSubtree(this, (candidate) => {
			if (found) {
				return;
			}
			if (match(candidate)) {
				found = candidate;
			}
		});
		return found;
	},
};
/*
 * Auto register/unregister is driven natively by the framework lifecycle:
 * `handleConnect` calls `this.aiRegister?.()` and `handleDisconnect` calls
 * `this.aiUnregister?.()` — both OPTIONAL-CHAINED, so until the mixin is applied
 * they are genuine no-ops and every component connects/disconnects with ZERO
 * AI-registry cost. The mixin is NOT applied at load; `enableAiFor` arms it on
 * demand (see `enableAi` in the core barrel). This is the lazy replacement for
 * the former unconditional `applyAiMixin(WebComponent)` at the index barrel,
 * which had defeated the optional-chaining by making the methods always present.
 */
export function applyAiMixin(WebComponent) {
	if (!WebComponent || WebComponent[APPLIED]) {
		return false;
	}
	Object.assign(WebComponent.prototype, aiMethods);
	WebComponent[APPLIED] = true;
	return true;
}
function registerElementTree(collection) {
	const total = collection.length;
	for (let index = 0; index < total; index += 1) {
		registerElementSubtree(collection[index]);
	}
}
/*
 * PRE-ORDER: register the node BEFORE descending, so a parent always has its id
 * before a child's `findAiAncestor` looks it up — register children first and
 * they resolve no ancestor and become false roots. Walk the shadow tree (the
 * component's rendered children) then the light tree (slotted children); the
 * `componentIds` guard in registerComponent makes any overlap a cheap no-op.
 */
function registerElementSubtree(node) {
	if (isFunction(node.aiRegister)) {
		node.aiRegister();
	}
	const shadow = node.shadowRoot;
	if (shadow) {
		registerElementTree(shadow.children);
	}
	registerElementTree(node.children);
}
/*
 * One-time backfill run when AI arms mid-session: components that mounted before
 * arming are absent from the registry, so an agent connecting now would see an
 * empty page. Walk the live DOM once and register the whole tree (notifications
 * suppressed for the bulk pass — see registry.js), then invalidate the path index
 * so the next lookup rebuilds against the freshly-populated tree.
 */
export function backfillAiRegistry() {
	const body = globalThis.document?.body;
	if (!body) {
		return;
	}
	suppressNotifications(true);
	try {
		registerElementTree(body.children);
	} finally {
		suppressNotifications(false);
	}
	invalidatePathIndex();
}
/*
 * Arm AI for a component class: apply the mixin once, then backfill the live tree
 * ONLY on the first arm (applyAiMixin returns false thereafter, so repeated calls
 * are cheap no-ops — later mounts/unmounts keep the registry current through the
 * normal lifecycle). Class-parameterized to keep this module decoupled from base.js;
 * the core barrel binds it to `WebComponent` as the no-arg `enableAi()`.
 */
export function enableAiFor(WebComponentClass) {
	if (applyAiMixin(WebComponentClass)) {
		backfillAiRegistry();
	}
}
