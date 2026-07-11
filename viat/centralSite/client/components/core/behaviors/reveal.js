/*
 * Adds `is-revealed` class the first time the element scrolls into view.
 * Use with CSS to animate (`opacity`, `transform`). Optional value is the
 * IntersectionObserver root margin (defaults to "0px 0px -10% 0px").
 *
 * One shared observer per distinct root margin (in practice: one). The
 * element → observer WeakMap doubles as the membership check and gives
 * `uninstall` its unobserve target without a per-install closure.
 */
const DEFAULT_ROOT_MARGIN = '0px 0px -10% 0px';
const observersByMargin = new Map();
const observerByElement = new WeakMap();
/*
 * The shared observers' dispatch — a first-class module function; reveal is
 * one-shot per element, so a fired entry unobserves and forgets itself.
 */
function revealIntersectedEntries(entries, sourceObserver) {
	const entriesLength = entries.length;
	for (let index = 0; index < entriesLength; index++) {
		const entry = entries[index];
		if (!entry.isIntersecting) {
			continue;
		}
		if (!observerByElement.has(entry.target)) {
			continue;
		}
		entry.target.classList.add('is-revealed');
		sourceObserver.unobserve(entry.target);
		observerByElement.delete(entry.target);
	}
}
function getObserver(rootMargin) {
	let sharedObserver = observersByMargin.get(rootMargin);
	if (!sharedObserver) {
		sharedObserver = new IntersectionObserver(revealIntersectedEntries, {
			rootMargin,
		});
		observersByMargin.set(rootMargin, sharedObserver);
	}
	return sharedObserver;
}
class RevealBehavior {
	name = 'reveal';
	install(element, value) {
		const sharedObserver = getObserver(value || DEFAULT_ROOT_MARGIN);
		observerByElement.set(element, sharedObserver);
		sharedObserver.observe(element);
	}
	uninstall(element) {
		const sharedObserver = observerByElement.get(element);
		if (sharedObserver) {
			sharedObserver.unobserve(element);
			observerByElement.delete(element);
		}
	}
}
export const reveal = new RevealBehavior();
