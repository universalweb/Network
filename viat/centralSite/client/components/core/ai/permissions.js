import { isFunction } from '../utilities.js';
const granted = new Set();
let policy = null;
let prompt = null;
let defaultMutatingPolicy = 'prompt';
function key(sessionId, tool, componentId) {
	return `${sessionId}|${componentId ?? '*'}|${tool}`;
}
export function setPolicy(fn) {
	policy = isFunction(fn) ? fn : null;
}
export function setPrompt(fn) {
	prompt = isFunction(fn) ? fn : null;
}
export function setDefaultMutatingPolicy(value) {
	if (value === 'allow' || value === 'deny' || value === 'prompt') {
		defaultMutatingPolicy = value;
	}
}
export async function check(action, ctx) {
	const decision = policy ? await policy(action, ctx) : null;
	if (decision === 'allow' || decision === true) {
		return true;
	}
	if (decision === 'deny' || decision === false) {
		return false;
	}
	if (!action.mutating) {
		return true;
	}
	if (defaultMutatingPolicy === 'allow') {
		return true;
	}
	if (defaultMutatingPolicy === 'deny') {
		return false;
	}
	const grantKey = key(ctx.sessionId, action.tool, action.componentId);
	if (granted.has(grantKey)) {
		return true;
	}
	if (!prompt) {
		return false;
	}
	const ok = await prompt(action, ctx);
	if (ok) {
		granted.add(grantKey);
	}
	return ok === true;
}
export function grant(sessionId, tool, componentId) {
	granted.add(key(sessionId, tool, componentId));
}
export function revoke(sessionId, tool, componentId) {
	granted.delete(key(sessionId, tool, componentId));
}
export function reset() {
	granted.clear();
}
