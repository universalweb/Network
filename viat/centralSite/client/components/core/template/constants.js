/*
	Universal Web Components — template vocabulary.
	Pure-data constants shared between the template parser (extractor) and the
	runtime core (planner / Spot classes / patch dispatch). No logic, no deps —
	the leaf both sides import, so the marker/type vocabulary has one home and the
	parser↔core boundary stays a clean one-way edge.
*/
/**
 * Spot type vocabulary. Single source of truth for every `spot.type` /
 * `plan.type` / `entry.type` literal the template runtime reads or writes.
 * Use `SPOT_TYPE.X` everywhere — never a bare string literal. The parser
 * (extractor) emits these on entries, the planner copies them into plans,
 * and the Spot subclasses store them for the patch dispatch in `patchSpot` /
 * `updateSpot` / `updateTemplateSpots`.
 */
export const SPOT_TYPE = Object.freeze({
	TEXT: 'text',
	BARE_ATTR: 'bare-attr',
	ATTR: 'attr',
	BOOL_ATTR: 'bool-attr',
	PROP: 'prop',
	MULTI_ATTR: 'multi-attr',
	CLASS_LIST: 'class-list',
	EVENT: 'event',
	BIND: 'bind',
});
/**
 * Spot kind vocabulary. Identifies the Spot subclass family — set in each
 * subclass constructor, read by `Spot.handle` to gate list-only bookkeeping
 * (the only cross-class branch on kind today). Cleared to `null` by the
 * non-reactive one-shot path in `installBindingSpot`.
 */
export const SPOT_KIND = Object.freeze({
	BINDING: 'binding',
	LIST: 'list',
	COMPUTED: 'computed',
	MULTI: 'multi',
	CLASS: 'class',
});
/* Marker attribute the extractor stamps on an element carrying a spot expression. */
export const SPOT = 'data-expr';
/* Marker attribute for a two-way `@bind` / `$attr=` binding spot. */
export const BIND_MARKER = 'data-bind-expr';
/*
 * Comment-anchor markers for a PARTIAL text spot (static siblings present, so it
 * can't fold onto the parent). The HTML parser turns `<!--uwc:N-->` into a real
 * comment node that survives as a parse-stable position anchor (Lit's trick) —
 * no element, no layout/style, text stays selectable. Two comments bound the
 * spot's range so insert/clear is O(1): `<!--uwc:N-->`(start) `<!--uwc/N-->`(end).
 */
export const ANCHOR_START_PREFIX = 'uwc:';
export const ANCHOR_END_PREFIX = 'uwc/';
