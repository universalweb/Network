import {
	defineInstanceTool,
	getComponentId,
	getTools,
	registerComponent,
	unregisterComponent,
} from './registry.js';
import { describeComponent, sanitize } from './descriptors.js';
import {
	getDirectChildren,
	getNameForComponent,
	getPathForComponent,
	pageOverview,
} from './paths.js';
import { LIFECYCLE_PROMISE } from '../lifecycle/lifecycle.js';
import { PHASE } from '../lifecycle/phase.js';
import { isFunction } from '../utilities.js';
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
	const parentHost = root instanceof ShadowRoot ? root.host : element.parentElement;
	if (parentHost && getComponentId(parentHost)) {
		return parentHost;
	}
	return null;
}
function collectAttrSnapshot(component) {
	const out = {};
	const list = component.attributes;
	for (let i = 0; i < list.length; i++) {
		out[list[i].name] = list[i].value;
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
	for (let i = 0; i < kids.length; i++) {
		visitor(kids[i]);
		walkSubtree(kids[i], visitor);
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
		return sanitize(this.globalState, 0);
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
function wrapAfter(target, hookName, after) {
	const original = target[hookName];
	target[hookName] = function aiAfterHook(...args) {
		let result;
		if (isFunction(original)) {
			result = original.apply(this, args);
		}
		after(this);
		return result;
	};
}
function wrapBefore(target, hookName, before) {
	const original = target[hookName];
	target[hookName] = function aiBeforeHook(...args) {
		before(this);
		if (isFunction(original)) {
			return original.apply(this, args);
		}
		return undefined;
	};
}
export function applyAiMixin(WebComponent, opts = {}) {
	if (!WebComponent || WebComponent[APPLIED]) {
		return;
	}
	const proto = WebComponent.prototype;
	Object.assign(proto, aiMethods);
	if (opts.autoRegister !== false) {
		wrapAfter(proto, 'connectedCallback', function aiAfterConnect(component) {
			component.aiRegister();
		});
		wrapBefore(proto, 'disconnectedCallback', function aiBeforeDisconnect(component) {
			component.aiUnregister();
		});
	}
	WebComponent[APPLIED] = true;
}
