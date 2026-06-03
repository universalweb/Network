/*
 * Scoped dependency injection (provide / inject) — Lit-context semantics.
 *
 *   ancestor:   this.provide('theme', value)
 *   descendant: const theme = this.inject('theme', fallback)
 *
 * Coarse-reactive by design: re-providing a CHANGED value (`provide` with a new
 * reference) kicks every consumer of that key to re-render. That is exactly Lit
 * context — granular reactivity comes from providing an independently-reactive
 * value, NOT from the injection. Most DI (services, controllers, config) is
 * provided once and never kicks.
 *
 * Lifecycle is the load-bearing part, not the notify:
 *   - inject RE-WALKS the ancestor chain every call (never caches a provider),
 *     so a consumer that reconnects under a different ancestor resolves anew.
 *   - a consumer registers in the provider's per-key consumer Set and records a
 *     WeakRef link; on disconnect it deregisters, so a provider never retains or
 *     kicks a dead consumer (no leak, no kick-after-teardown).
 *   - `provided` survives disconnect (it is the component's declared context,
 *     like state) so a reconnecting provider keeps serving without re-providing.
 *
 * A component's own `provide` is NOT visible to its own `inject` (the walk starts
 * one step UP the DOM); nearest ancestor wins, so keys shadow correctly.
 */
import { isPromiseLike, queueAsyncError } from '../utilities.js';
/**
 * Expose `value` to descendants under `key`. Replacing the value with a new
 * reference kicks every consumer of `key` to re-render; an unchanged value
 * (same reference) is a no-op.
 * @param {string} key - The context key.
 * @param {*} value - The provided value (service, config, or reactive container).
 * @returns {*} The provided value.
 */
export function provide(key, value) {
	const provided = this.provided ??= new Map();
	const had = provided.has(key);
	const prev = provided.get(key);
	provided.set(key, value);
	if (had && prev === value) {
		return value;
	}
	const consumers = this.providedConsumers?.get(key);
	if (consumers && consumers.size) {
		/* Snapshot — a consumer's re-render can re-inject and mutate the Set. */
		const snapshot = [...consumers];
		for (let index = 0; index < snapshot.length; index++) {
			snapshot[index].receiveContextUpdate();
		}
	}
	return value;
}
/**
 * One step up the real DOM ancestry: parent element, hopping a ShadowRoot to its
 * host, stopping at the document. Robust where `parentComponent` is not — it
 * crosses wrapper elements and shadow boundaries alike, so a light-DOM consumer
 * nested under plain `<div>`s still finds its provider.
 * @param {Node} node - The node to ascend from.
 * @returns {Element|null} The next element ancestor, or null at the top.
 */
function ascend(node) {
	const ancestor = node.parentNode;
	if (!ancestor) {
		return null;
	}
	if (ancestor.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
		return ancestor.host ?? null;
	}
	return ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : null;
}
function findProvider(component, key) {
	let node = ascend(component);
	while (node) {
		if (node.isWebComponent && node.provided?.has(key)) {
			return node;
		}
		node = ascend(node);
	}
	return null;
}
function registerConsumer(provider, key, consumer) {
	const consumersByKey = provider.providedConsumers ??= new Map();
	let consumers = consumersByKey.get(key);
	if (!consumers) {
		consumers = new Set();
		consumersByKey.set(key, consumers);
	}
	if (consumers.has(consumer)) {
		return;
	}
	consumers.add(consumer);
	(consumer.injectLinks ??= new Set()).add({
		providerRef: new WeakRef(provider),
		key,
	});
}
/**
 * Resolve `key` from the nearest ancestor provider, registering this component as
 * a consumer so a later `provide` of a new value re-renders it. Re-walks every
 * call. Returns `fallback` when no provider supplies the key.
 * @param {string} key - The context key to resolve.
 * @param {*} [fallback] - Returned when no ancestor provides `key`.
 * @returns {*} The provided value, or `fallback`.
 */
export function inject(key, fallback) {
	const provider = findProvider(this, key);
	if (!provider) {
		return fallback;
	}
	registerConsumer(provider, key, this);
	return provider.provided.get(key);
}
/**
 * Provider→consumer kick — force a template REBUILD so every `inject(...)` is
 * re-read. A patch pass is not enough: `inject` returns a plain value with no
 * reactive dep, so its computed spot is subscription-empty and `updateSpot`
 * early-returns on the thunk (template.js) without re-evaluating. Clearing
 * tplState (via cleanupTemplate, which also tears down the old spots) makes the
 * next render re-instantiate the template. Context changes are rare, so the
 * rebuild cost is acceptable; patch-level granularity would need a context realm.
 * No-op when the consumer is detached.
 */
export function receiveContextUpdate() {
	if (!this.isConnected) {
		return;
	}
	this.cleanupTemplate();
	this.templateBuilt = false;
	const result = this.updateView();
	if (isPromiseLike(result)) {
		result.catch(queueAsyncError);
	}
}
function disposeInjectLink(link) {
	/* `this` is the consumer (forEach thisArg). */
	const provider = link.providerRef.deref();
	if (!provider) {
		return;
	}
	provider.providedConsumers?.get(link.key)?.delete(this);
}
/**
 * Disconnect sweep — remove this consumer from every provider Set it joined, so
 * no provider retains or later kicks a dead component.
 */
export function clearInjectLinks() {
	if (!this.injectLinks) {
		return;
	}
	this.injectLinks.forEach(disposeInjectLink, this);
	this.injectLinks.clear();
}
