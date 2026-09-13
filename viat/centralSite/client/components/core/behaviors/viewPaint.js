/*
 * `view-paint` — content-visibility: auto (visual hide / paint skip).
 * Element stays in the DOM with reserved size; off-screen paint is deferred.
 * Optional attribute value = contain-intrinsic-block-size (default auto 12rem).
 */
import { applyViewPaint, observeInView, unobserve } from '../dom/viewPort.js';
class ViewPaintBehavior {
	name = 'view-paint';
	install(element, value) {
		const blockSize = (typeof value === 'string' && value.trim()) ? value.trim() : 'auto 12rem';
		// Paint mode is CSS-driven; observeInView applies content-visibility:auto.
		observeInView(element, {
			mode: 'paint',
			once: false,
			blockSize,
		});
	}
	uninstall(element) {
		unobserve(element);
		element.style.contentVisibility = '';
		element.style.containIntrinsicBlockSize = '';
		element.removeAttribute('data-view-paint');
	}
}
export const viewPaint = new ViewPaintBehavior();
// Keep applyViewPaint available for non-behavior callers.
export { applyViewPaint };
