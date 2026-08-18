/*
 * viewPort — shared IntersectionObserver pool for scroll-driven visibility.
 *
 * Two modes (also exposed as behaviors: view-paint, view-lazy):
 *
 *   paint (visual hide) — element stays in the DOM tree, layout size is
 *     reserved via contain-intrinsic-size, but the browser may skip paint /
 *     some style work for off-screen content (`content-visibility: auto`).
 *     Lightest ongoing cost once mounted.
 *
 *   lazy — element starts paint-suppressed (`content-visibility: hidden`)
 *     until it first intersects the root; then switches to paint mode and
 *     optionally invokes onReady (for host code that defers heavy work).
 *
 * Both modes share one IntersectionObserver per (root, rootMargin, threshold)
 * key so a gallery of hundreds of sections does not open hundreds of observers.
 */
const DEFAULT_ROOT_MARGIN = '200px 0px';
const DEFAULT_THRESHOLD = 0;
/** @type {Map<string, IntersectionObserver>} */
const observers = new Map();
/** @type {WeakMap<Element, { mode: string, onReady?: Function, once: boolean, ready: boolean }>} */
const metaByElement = new WeakMap();
function observerKey(root, rootMargin, threshold) {
	const rootId = root ? (root.id || 'root') : 'viewport';
	return `${rootId}|${rootMargin}|${threshold}`;
}
function dispatchEntries(entries) {
	const entryCount = entries.length;
	for (let index = 0; index < entryCount; index += 1) {
		const entry = entries[index];
		const element = entry.target;
		const meta = metaByElement.get(element);
		if (!meta) {
			continue;
		}
		if (entry.isIntersecting) {
			enterView(element, meta);
			if (meta.once === true) {
				unobserve(element);
			}
		} else if (meta.mode === 'paint' && meta.once !== true) {
			// paint mode stays content-visibility:auto — browser handles leave.
		}
	}
}
function getObserver(root, rootMargin, threshold) {
	const key = observerKey(root, rootMargin, threshold);
	let observer = observers.get(key);
	if (!observer) {
		observer = new IntersectionObserver(dispatchEntries, {
			root: root || null,
			rootMargin,
			threshold,
		});
		observers.set(key, observer);
	}
	return observer;
}
/**
 * Apply paint-only suppression: DOM + layout remain, paint can be skipped.
 * @param {Element} element - Target.
 * @param {string} [blockSize] - contain-intrinsic-block-size (e.g. 'auto 14rem').
 */
export function applyViewPaint(element, blockSize) {
	if (!element) {
		return;
	}
	element.style.contentVisibility = 'auto';
	element.style.containIntrinsicBlockSize = blockSize || 'auto 12rem';
	element.toggleAttribute('data-view-paint', true);
}
/**
 * Suppress paint until first in-view, then unlock to paint mode.
 * @param {Element} element - Target.
 * @param {string} [blockSize] - Placeholder block size while hidden.
 */
export function applyViewLazy(element, blockSize) {
	if (!element) {
		return;
	}
	element.style.contentVisibility = 'hidden';
	element.style.containIntrinsicBlockSize = blockSize || 'auto 12rem';
	element.toggleAttribute('data-view-lazy', true);
	element.toggleAttribute('data-view-ready', false);
}
function unlockLazy(element, meta) {
	element.style.contentVisibility = 'auto';
	element.toggleAttribute('data-view-ready', true);
	meta.ready = true;
	if (typeof meta.onReady === 'function') {
		meta.onReady(element);
	}
}
function enterView(element, meta) {
	if (meta.mode === 'lazy' && meta.ready !== true) {
		unlockLazy(element, meta);
	}
	if (typeof meta.onEnter === 'function') {
		meta.onEnter(element);
	}
}
/**
 * Observe an element for viewport (or scroll-root) entry.
 * @param {Element} element - Target.
 * @param {object} [options] - Options.
 * @param {Element|null} [options.root] - Scroll root (null = viewport).
 * @param {string} [options.rootMargin] - IO rootMargin.
 * @param {number} [options.threshold] - IO threshold.
 * @param {'paint'|'lazy'} [options.mode] - Visibility strategy.
 * @param {boolean} [options.once] - Unobserve after first enter.
 * @param {string} [options.blockSize] - contain-intrinsic-block-size.
 * @param {Function} [options.onReady] - Lazy unlock callback.
 * @param {Function} [options.onEnter] - Every enter (if not once).
 * @returns {Function} Unobserve disposer.
 */
export function observeInView(element, options) {
	if (!element || typeof IntersectionObserver !== 'function') {
		if (options?.mode === 'lazy' && element) {
			applyViewPaint(element, options.blockSize);
			options.onReady?.(element);
		}
		return function noopUnobserve() {};
	}
	const root = options?.root ?? null;
	const rootMargin = options?.rootMargin || DEFAULT_ROOT_MARGIN;
	const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
	const mode = options?.mode === 'lazy' ? 'lazy' : 'paint';
	const once = options?.once !== false;
	if (mode === 'lazy') {
		applyViewLazy(element, options?.blockSize);
	} else {
		applyViewPaint(element, options?.blockSize);
	}
	const meta = {
		mode,
		once,
		ready: mode !== 'lazy',
		onReady: options?.onReady,
		onEnter: options?.onEnter,
	};
	metaByElement.set(element, meta);
	const observer = getObserver(root, rootMargin, threshold);
	observer.observe(element);
	return function dispose() {
		unobserve(element);
	};
}
/**
 * Stop observing and clear meta (styles left as last applied).
 * @param {Element} element - Target.
 */
export function unobserve(element) {
	const meta = metaByElement.get(element);
	if (!meta) {
		return;
	}
	metaByElement.delete(element);
	// Best-effort unobserve on every live observer (element can only be on one).
	observers.forEach((observer) => {
		observer.unobserve(element);
	});
}
/**
 * Wire every matching descendant under `root` (default: element itself).
 * @param {Element} host - Root to query.
 * @param {string} selector - e.g. '.demo, .cat-section'.
 * @param {object} [options] - Passed to observeInView.
 * @returns {Function} Dispose all.
 */
export function observeAll(host, selector, options) {
	if (!host?.querySelectorAll) {
		return function noop() {};
	}
	const nodes = host.querySelectorAll(selector);
	const disposers = [];
	const nodeCount = nodes.length;
	for (let index = 0; index < nodeCount; index += 1) {
		disposers.push(observeInView(nodes[index], options));
	}
	return function disposeAll() {
		const count = disposers.length;
		for (let index = 0; index < count; index += 1) {
			disposers[index]();
		}
	};
}
