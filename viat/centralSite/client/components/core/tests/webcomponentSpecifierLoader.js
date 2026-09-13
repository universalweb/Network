/*
 * Node ESM loader hook for the bare `webcomponent` importmap specifier.
 * Paired with webcomponentSpecifierShim.js — do not import this file from
 * tests; import the shim (it registers this hook).
 */
const CORE_INDEX = new URL('../index.js', import.meta.url).href;
export function resolve(specifier, context, nextResolve) {
	if (specifier === 'webcomponent') {
		return {
			shortCircuit: true,
			url: CORE_INDEX,
		};
	}
	return nextResolve(specifier, context);
}
