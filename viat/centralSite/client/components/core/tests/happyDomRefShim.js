/*
	Test-only repair for a happy-dom parser defect.
	happy-dom's HTML parser silently DROPS a leading `#` from attribute names:
	`<span #list>` parses to an attribute literally named `list`. It preserves
	`@click`, `.state.a` and `?hidden` — only `#` is affected — and
	`setAttribute('#list', '')` keeps it, so the loss is exclusive to the parse
	path. Chrome (and the HTML spec) keep the `#`, so this is a harness defect,
	NOT a framework or production bug.
	Without this shim `extractRefPlans` (template/planner.js) — which matches on
	`attrName.charCodeAt(0) !== 35` — never fires, `component.refsMap` stays null,
	and EVERY `this.refs.*` reads `undefined` under test. Ref-dependent assertions
	do not fail loudly; they quietly test nothing.
	The `#` is gone by the time the parsed attribute could be inspected, and a
	stripped `#list` is indistinguishable from a genuine `list` attribute — so the
	only recoverable hook is to rewrite the markup BEFORE it is parsed and restore
	the names afterwards through setAttribute, which happy-dom handles correctly.
	Import once, after GlobalRegistrator.register().
*/
/*
 * Prefixed with `x-` so it can never collide with a real attribute, and with a
 * double dash so it cannot collide with a real `x-hashref` custom attribute.
 */
const SENTINEL = 'x-hashref--';
const SENTINEL_LENGTH = SENTINEL.length;
// The framework's own ref-name grammar (dom/refs.js#isValidRefName).
const REF_NAME = /^[a-z_][a-z0-9_]*$/;
let installed = false;
function isWhitespace(character) {
	return character === ' ' || character === '\t' || character === '\n' || character === '\r' || character === '\f';
}
/* An attribute name ends at whitespace, `=`, `/` or `>`; anything else means
   this `#` was not an attribute name and must be left untouched. */
function isNameBoundary(character) {
	return character === undefined || isWhitespace(character) || character === '=' || character === '/' || character === '>';
}
/**
 * Rewrite `#name` attribute names to `SENTINEL + name` so they survive parsing.
 * Scans character-wise while tracking tag and quote state — a regex cannot tell
 * an attribute-name `#` from one inside `class="a #b"`, `href="#top"` or body
 * text, and corrupting those would be far worse than the bug being fixed.
 * @returns {string} markup safe to hand to the parser.
 */
function encodeHashRefs(markup) {
	if (markup.indexOf('#') === -1) {
		return markup;
	}
	const markupLength = markup.length;
	let output = '';
	let chunkStart = 0;
	let index = 0;
	let inTag = false;
	let quote = '';
	while (index < markupLength) {
		const character = markup[index];
		if (inTag) {
			if (quote) {
				if (character === quote) {
					quote = '';
				}
			} else if (character === '"' || character === '\'') {
				quote = character;
			} else if (character === '>') {
				inTag = false;
			} else if (character === '#' && isWhitespace(markup[index - 1])) {
				let end = index + 1;
				while (end < markupLength && !isNameBoundary(markup[end])) {
					end += 1;
				}
				const refName = markup.slice(index + 1, end);
				if (REF_NAME.test(refName)) {
					output += markup.slice(chunkStart, index) + SENTINEL + refName;
					index = end;
					chunkStart = index;
					continue;
				}
			}
		} else if (character === '<') {
			// Comments and CDATA are not tags; their contents must stay verbatim.
			if (markup.startsWith('<!--', index)) {
				const commentEnd = markup.indexOf('-->', index + 4);
				index = commentEnd === -1 ? markupLength : commentEnd + 3;
				continue;
			}
			inTag = true;
		}
		index += 1;
	}
	return chunkStart === 0 ? markup : output + markup.slice(chunkStart);
}
/**
 * Rename every sentinel attribute back to its `#name` form. Deliberately strict:
 * the remainder must still match the ref grammar, so a literal `x-hashref--`
 * attribute authored in real markup is left alone.
 */
function decodeHashRefs(root) {
	if (!root) {
		return;
	}
	const elements = root.querySelectorAll('*');
	const elementCount = elements.length;
	for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
		const element = elements[elementIndex];
		const attributes = element.attributes;
		const renames = [];
		const attributeCount = attributes.length;
		for (let attributeIndex = 0; attributeIndex < attributeCount; attributeIndex++) {
			const attribute = attributes[attributeIndex];
			const attributeName = attribute.name;
			if (!attributeName.startsWith(SENTINEL)) {
				continue;
			}
			const refName = attributeName.slice(SENTINEL_LENGTH);
			if (REF_NAME.test(refName)) {
				renames.push(attributeName, refName, attribute.value);
			}
		}
		// Collected first: renaming mid-iteration mutates the live attribute list.
		const renameCount = renames.length;
		for (let renameIndex = 0; renameIndex < renameCount; renameIndex += 3) {
			element.removeAttribute(renames[renameIndex]);
			element.setAttribute(`#${renames[renameIndex + 1]}`, renames[renameIndex + 2]);
		}
	}
}
/* A patched setter has to route parsed content back through the decoder, and
   `template.innerHTML` fills `.content` rather than the element itself. */
function patchPrototype(prototype) {
	if (!prototype) {
		return;
	}
	const descriptor = Object.getOwnPropertyDescriptor(prototype, 'innerHTML');
	if (!descriptor?.set) {
		return;
	}
	const originalSet = descriptor.set;
	Object.defineProperty(prototype, 'innerHTML', {
		configurable: true,
		enumerable: descriptor.enumerable,
		get: descriptor.get,
		set: function setInnerHTML(value) {
			originalSet.call(this, encodeHashRefs(String(value ?? '')));
			decodeHashRefs(this.content ?? this);
		},
	});
}
/**
 * Install the shim. Idempotent, so importing it from several test files is safe.
 * HTMLTemplateElement owns its OWN innerHTML descriptor which shadows Element's,
 * so both must be patched — patching Element alone silently misses every
 * `template.innerHTML` write, which is exactly where the framework compiles its
 * recipes and extracts ref plans.
 */
export function installHashRefShim() {
	if (installed) {
		return;
	}
	installed = true;
	patchPrototype(globalThis.HTMLTemplateElement?.prototype);
	patchPrototype(globalThis.Element?.prototype);
}
installHashRefShim();
