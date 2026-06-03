/*
 * Adds `is-revealed` class the first time the element scrolls into view.
 * Use with CSS to animate (`opacity`, `transform`). Optional value is the
 * IntersectionObserver root margin (defaults to "0px 0px -10% 0px").
 */
let observer = null;
const elements = new WeakMap();
function getObserver() {
	if (observer) {
		return observer;
	}
	observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				return;
			}
			const meta = elements.get(entry.target);
			if (!meta) {
				return;
			}
			entry.target.classList.add('is-revealed');
			observer.unobserve(entry.target);
			elements.delete(entry.target);
		});
	}, {
		rootMargin: '0px 0px -10% 0px',
	});
	return observer;
}
export const reveal = {
	name: 'reveal',
	install(element, value) {
		const obs = getObserver();
		elements.set(element, {
			rootMargin: value || null,
		});
		obs.observe(element);
		return function uninstall() {
			obs.unobserve(element);
			elements.delete(element);
		};
	},
};
