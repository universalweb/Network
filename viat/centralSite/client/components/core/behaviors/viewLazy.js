/*
 * `view-lazy` — content-visibility: hidden until first intersection, then
 * unlocks to `auto` (same paint path as view-paint). Use when construction is
 * already done but you want a hard paint gate until near the viewport, or pair
 * with host onReady via observeInView({ mode:'lazy', onReady }).
 *
 * Attribute value = contain-intrinsic-block-size (default auto 12rem).
 */
import { applyViewLazy, observeInView, unobserve } from '../dom/viewPort.js';
class ViewLazyBehavior {
	name = 'view-lazy';
	install(element, value) {
		const blockSize = (typeof value === 'string' && value.trim()) ? value.trim() : 'auto 12rem';
		observeInView(element, {
			mode: 'lazy',
			once: true,
			blockSize,
		});
	}
	uninstall(element) {
		unobserve(element);
		element.style.contentVisibility = '';
		element.style.containIntrinsicBlockSize = '';
		element.removeAttribute('data-view-lazy');
		element.removeAttribute('data-view-ready');
	}
}
export const viewLazy = new ViewLazyBehavior();
export { applyViewLazy };
