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
 *
 * One shared `EventListener`-object singleton serves every installed scroller;
 * the per-element crossing latch lives in a WeakMap, not a closure.
 */
import { globalState } from '../state/globalState.js';
const SCROLL_THRESHOLD = 8;
const lastScrolledByElement = new WeakMap();
function reportScroll(element) {
	const scrolled = element.scrollTop > SCROLL_THRESHOLD;
	if (scrolled !== lastScrolledByElement.get(element)) {
		lastScrolledByElement.set(element, scrolled);
		globalState.set({
			'environment.scrolled': scrolled,
		});
	}
}
const scrollListener = {
	handleEvent(scrollEvent) {
		reportScroll(scrollEvent.currentTarget);
	},
};
/*
 * Initial report waits a frame (layout must settle before scrollTop means
 * anything). Installs within the same frame share ONE rAF via this queue.
 */
const pendingInitialReport = [];
function flushInitialReport() {
	const pendingLength = pendingInitialReport.length;
	for (let index = 0; index < pendingLength; index++) {
		const element = pendingInitialReport[index];
		if (element.isConnected) {
			reportScroll(element);
		}
	}
	pendingInitialReport.length = 0;
}
class ScrollReportBehavior {
	name = 'scroll-report';
	install(element) {
		element.addEventListener('scroll', scrollListener, {
			passive: true,
		});
		if (pendingInitialReport.push(element) === 1) {
			requestAnimationFrame(flushInitialReport);
		}
	}
	uninstall(element) {
		element.removeEventListener('scroll', scrollListener);
		lastScrolledByElement.delete(element);
	}
}
export const scrollReport = new ScrollReportBehavior();
