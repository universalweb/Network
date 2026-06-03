/*
	DESCRIPTION: Compile-time state TYPE inference. Walks a class's merged
	`static state` once and derives a per-path JS-type map plus an auto
	CONTENT_KIND for the text-position-unambiguous primitive fields.

	The type map is the oracle the template compiler (`.compile`) and the sigil
	parser read to pick a patch strategy ahead of time — e.g. a `number` field
	bound in a text position is emitted as a strict `textContent` write with no
	per-patch markup classification. Explicit `static properties` declarations
	always OVERRIDE what is inferred here (the caller folds them in last).

	Off-DOM by construction — imports only `CONTENT_KIND` (a frozen vocab) and
	pure type predicates, so the walker is unit-testable under Bun/Node without
	a document.
*/
import { CONTENT_KIND } from '../state/binding.js';
import { isArray, isMap, isPlainObject, isSet } from '../utilities.js';

/**
 * JS-type vocabulary emitted per state path. Single source of truth — the
 * compiler and the sigil parser branch on `STATE_TYPE.X`, never a bare literal.
 * The primitive members deliberately equal their `typeof` strings so
 * `classifyValueType` can pass them through untouched.
 */
export const STATE_TYPE = Object.freeze({
	STRING: 'string',
	NUMBER: 'number',
	BOOLEAN: 'boolean',
	BIGINT: 'bigint',
	SYMBOL: 'symbol',
	FUNCTION: 'function',
	UNDEFINED: 'undefined',
	ARRAY: 'array',
	MAP: 'map',
	SET: 'set',
	OBJECT: 'object',
	NULL: 'null',
});

/*
 * Primitive types whose text-position stringification is markup-free, so a TEXT
 * spot bound to such a field can use the strict `textContent` patcher and skip
 * the per-patch `<` / `&` scan. Strings are EXCLUDED — they may legitimately
 * carry markup (→ HTML kind), which only the sigil parser / dev disambiguates.
 */
const TEXT_SAFE_TYPES = new Set([
	STATE_TYPE.NUMBER,
	STATE_TYPE.BOOLEAN,
	STATE_TYPE.BIGINT,
]);

/*
 * Recursion ceiling — guards pathological deep / cyclic static state. Real
 * component state nests a handful of levels at most.
 */
const MAX_INFER_DEPTH = 8;

function classifyValueType(value) {
	if (value === null) {
		return STATE_TYPE.NULL;
	}
	if (isArray(value)) {
		return STATE_TYPE.ARRAY;
	}
	if (isMap(value)) {
		return STATE_TYPE.MAP;
	}
	if (isSet(value)) {
		return STATE_TYPE.SET;
	}
	const valueType = typeof value;
	if (valueType === 'object') {
		return STATE_TYPE.OBJECT;
	}
	/*
	 * `typeof` already yields the exact STATE_TYPE string for every primitive
	 * (string / number / boolean / bigint / symbol / function / undefined).
	 */
	return valueType;
}

/**
 * Recurse ONLY into plain objects — their key shape is stable and safely
 * path-addressable. Arrays / Maps / Sets / Nodes / class instances record their
 * container type and stop; their element shape is runtime-variable and not
 * inferable at compile time. Accessor descriptors (`get foo()`) are skipped —
 * their return type is unknown until they run.
 */
function walkStateLevel(source, prefix, types, kinds, depth) {
	const keys = Object.keys(source);
	for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
		const fieldKey = keys[keyIndex];
		const descriptor = Object.getOwnPropertyDescriptor(source, fieldKey);
		if (!descriptor || descriptor.get || descriptor.set) {
			continue;
		}
		const value = descriptor.value;
		const path = prefix ? `${prefix}.${fieldKey}` : fieldKey;
		const valueType = classifyValueType(value);
		types.set(path, valueType);
		if (TEXT_SAFE_TYPES.has(valueType)) {
			kinds.set(path, CONTENT_KIND.TEXT);
			continue;
		}
		if (valueType === STATE_TYPE.OBJECT && depth < MAX_INFER_DEPTH && isPlainObject(value)) {
			walkStateLevel(value, path, types, kinds, depth + 1);
		}
	}
}

/**
 * Walk the merged `static state` once → `{ types, kinds }`.
 *   types — Map<dotPath, STATE_TYPE>   every own non-accessor leaf + container
 *   kinds — Map<dotPath, CONTENT_KIND> for the TEXT-safe primitive fields only
 * Both maps key on the same dot-path the render proxy / `bind()` register as a
 * dependency key, so a consumer resolves a spot's bound path straight to a type.
 */
export function inferStateSchema(mergedState) {
	const types = new Map();
	const kinds = new Map();
	if (mergedState) {
		walkStateLevel(mergedState, '', types, kinds, 0);
	}
	return {
		types,
		kinds,
	};
}
