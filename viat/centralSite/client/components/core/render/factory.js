import { isFunction } from '../utilities.js';
import { registry } from '../dom/registry.js';
export function getById(key) {
	return registry[key] ?? null;
}
export async function preRender(element, mount, options = {}) {
	const duration = options.duration ?? 240;
	const easing = options.easing ?? 'cubic-bezier(0.4,0,0.2,1)';
	element.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity';
	if (isFunction(mount)) {
		mount(element);
	} else if (mount instanceof HTMLElement) {
		mount.appendChild(element);
		console.log('Pre-render Appended element to mount point', mount);
	}
	if (element.isWebComponent) {
		await element.lifecycle.whenLive;
	}
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
	element.style.opacity = '';
	element.style.pointerEvents = '';
	element.style.willChange = '';
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
