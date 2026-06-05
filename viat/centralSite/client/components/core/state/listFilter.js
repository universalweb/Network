/*
 * Pure predicate resolution for the `filter()` list helper. DOM-free leaf so it
 * unit-tests without a browser. `filter('key', Class, test)` keeps only the
 * items `test` admits: a function is the keep-predicate verbatim; a string names
 * a boolean flag whose TRUTH hides the item (`'hidden'` → keep unless hidden) —
 * the string is sugar for a keep-predicate, never a separate "exclude" mode, so
 * the model stays uniform. Anything else keeps every item.
 */
function keepEveryItem() {
	return true;
}
/**
 * Resolve a `filter()` test into a keep-predicate.
 * @param {string|Function} test - A keep-predicate `(item) => boolean`, or the
 * name of a boolean flag to hide on when truthy.
 * @returns {(item: any, index: number) => boolean} The keep-predicate.
 */
export function resolveListFilter(test) {
	if (typeof test === 'function') {
		return test;
	}
	if (typeof test === 'string') {
		return function keepUnlessFlag(item) {
			return !item?.[test];
		};
	}
	return keepEveryItem;
}
