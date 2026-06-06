/*
 * `scroll-report` — a scroll container opts in (bare attribute) to publish
 * whether it is scrolled past a small threshold to `globalState.environment.scrolled`.
 *
 * Why a behavior + a global flag instead of one listener: `scroll` events are
 * `composed: false` and don't bubble, so they never leave the page's shadow —
 * a global/document listener can't see them. Each page's own scroller therefore
 * reports its state up to the shared flag, which the adaptive top bar binds to
 * drive its flat → float transition. Writes only on a threshold CROSSING, so a
 * continuous scroll gesture is one boolean flip, not a flood of sets.
 */
import { globalState } from '../state/globalState.js';
const SCROLL_THRESHOLD = 8;
export const scrollReport = {
	name: 'scroll-report',
	install(element) {
		let lastScrolled = null;
		function report() {
			const scrolled = element.scrollTop > SCROLL_THRESHOLD;
			if (scrolled !== lastScrolled) {
				lastScrolled = scrolled;
				globalState.set({
					'environment.scrolled': scrolled,
				});
			}
		}
		element.addEventListener('scroll', report, {
			passive: true,
		});
		requestAnimationFrame(report);
		return function uninstall() {
			element.removeEventListener('scroll', report);
		};
	},
};
