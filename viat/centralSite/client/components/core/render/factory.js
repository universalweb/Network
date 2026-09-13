import { registry } from '../dom/registry.js';
import { isFunction, isHTMLElement } from '../utilities.js';
export function getById(key) {
	return registry[key] ?? null;
}
/**
 * Append `element` to `mount`, await WebComponent `whenLive`, optionally fade in.
 * Under a boot splash use `{ fade: false }` (or `duration: 0`) so the splash
 * owns the reveal — avoids a competing opacity animation while still hidden.
 * @param {HTMLElement} element
 * @param {HTMLElement|Function} mount - Parent node, or `(el) => void` appender.
 * @param {{ duration?: number, easing?: string, fade?: boolean }} [options]
 * @returns {Promise<HTMLElement>}
 */
export async function preRender(element, mount, options = {}) {
	const fade = options.fade !== false;
	const duration = fade ? (options.duration ?? 240) : 0;
	const easing = options.easing ?? 'cubic-bezier(0.4,0,0.2,1)';
	element.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity';
	if (isFunction(mount)) {
		mount(element);
	} else if (isHTMLElement(mount)) {
		mount.appendChild(element);
	}
	if (element.isWebComponent) {
		await element.lifecycle.whenLive;
	}
	if (duration > 0) {
		const animation = element.animate(
			[
				{
					opacity: 0,
				},
				{
					opacity: 1,
				},
			],
			{
				duration,
				easing,
			}
		);
		await animation.finished;
		animation.commitStyles();
		animation.cancel();
	}
	element.style.opacity = '';
	element.style.pointerEvents = '';
	element.style.willChange = '';
	if (element.isWebComponent) {
		element.debug('Pre-render', mount);
	}
	return element;
}
/**
 * Single-bag factory: `{ Source, state, config }` → instance. Useful when the
 * component class is selected per-item from a config-driven list rather than
 * known at the call site.
 * @param {{Source: typeof WebComponent, state?: object, config?: object}} [spec] - The component class plus its construction args.
 * @returns {Promise<WebComponent>} The constructed instance.
 */
export async function createBound(spec = {}) {
	const { Source } = spec;
	return Source.create(spec.state, spec.config);
}
