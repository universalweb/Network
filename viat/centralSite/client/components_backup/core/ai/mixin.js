import { isFunction } from '../utilities.js';
import { describeComponent } from './descriptors.js';
import {
	defineInstanceTool,
	getComponentId,
	getTools,
	registerComponent,
	unregisterComponent,
} from './registry.js';
const APPLIED = Symbol('viat-ai-mixin-applied');
function findAiAncestor(element) {
	const root = element.getRootNode();
	const parentHost = root instanceof ShadowRoot ? root.host : element.parentElement;
	if (parentHost && getComponentId(parentHost)) {
		return parentHost;
	}
	return null;
}
export const aiMethods = {
	aiRegister(parent) {
		const resolvedParent = parent === undefined ? findAiAncestor(this) : parent;
		return registerComponent(this, resolvedParent ?? null);
	},
	aiUnregister() {
		return unregisterComponent(this);
	},
	aiId() {
		return getComponentId(this);
	},
	aiDescribe(opts) {
		return describeComponent(this, opts);
	},
	aiTools() {
		return getTools(this);
	},
	aiDefineTool(name, def) {
		return defineInstanceTool(this, name, def);
	},
};
function wrapAfter(target, hookName, after) {
	const original = target[hookName];
	target[hookName] = function aiAfterHook(...args) {
		let result;
		if (isFunction(original)) {
			result = original.apply(this, args);
		}
		after.call(this);
		return result;
	};
}
function wrapBefore(target, hookName, before) {
	const original = target[hookName];
	target[hookName] = function aiBeforeHook(...args) {
		before.call(this);
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
		wrapAfter(proto, 'connectedCallback', function aiAfterConnect() {
			this.aiRegister();
		});
		wrapBefore(proto, 'disconnectedCallback', function aiBeforeDisconnect() {
			this.aiUnregister();
		});
	}
	WebComponent[APPLIED] = true;
}
