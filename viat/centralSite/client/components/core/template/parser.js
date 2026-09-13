/* eslint-disable no-restricted-syntax */
/*
	Universal Web Components — template parser (extractor).
	Tokenizes the tagged-template strings + their interpolation contexts into an
	HTML string stamped with marker attributes/comments that the runtime planner
	reads back. Pure string→markup work — no reactivity, no Spot/patch knowledge.
	A one-way leaf: core imports buildHTML + the marker-name helpers; this module
	imports only the shared vocabulary, CONTENT_KIND, and the isBindingType guard
	(all from lower leaves — never from the runtime core).
*/
import { CONTENT_KIND, isBindingType } from '../state/binding.js';
import {
	ANCHOR_END_PREFIX,
	ANCHOR_START_PREFIX,
	BIND_MARKER,
	SPOT,
	SPOT_TYPE,
} from './constants.js';
const ATTR_NAME_RE = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;
function attrContext(templateString) {
	/*
	 * The name class includes `.` so a dotted PROPERTY path survives as a single
	 * token — `.state.size=` → sigil `.`, name `state.size`. That is the explicit
	 * deep-state channel the commit layer routes through `setValueAtPath`; without
	 * the dot the `.state` segment would split off and leak into the markup.
	 */
	const attrMatch = templateString.match(/([?.])?([\w.:-]+)=(["']?)$/);
	if (!attrMatch) {
		return null;
	}
	return {
		sigil: attrMatch[1] ?? null,
		name: attrMatch[2],
		quote: attrMatch[3],
	};
}
function eventContext(templateString) {
	/*
	 * `@click.stop.prevent=` — optional dotted modifiers between the event name
	 * and `=`. The name class excludes `.` so the trailing `(?:\.[\w]+)*` group
	 * captures the modifier chain (leading dots stripped + split below). Without
	 * this group a modifier chain falls through to attrContext and mis-parses as
	 * a `.stop=` PROPERTY spot — the event binding silently never wires.
	 */
	const eventMatch = templateString.match(/^(?<prefix>[\s\S]*?)@(?<eventName>[\w:-]+)(?<modifiers>(?:\.\w+)*)=["']?$/);
	if (eventMatch?.groups?.eventName) {
		const rawModifiers = eventMatch.groups.modifiers;
		return {
			eventName: eventMatch.groups.eventName,
			prefix: eventMatch.groups.prefix,
			modifiers: rawModifiers ? rawModifiers.slice(1).split('.') : null,
			deduceFromExpr: false,
		};
	}
	const shorthandMatch = templateString.match(/^(?<prefix>[\s\S]*?\s)@$/);
	if (shorthandMatch) {
		return {
			eventName: null,
			prefix: shorthandMatch.groups.prefix,
			deduceFromExpr: true,
		};
	}
	return null;
}
// @engram em:network/code/click-click-capture-collided-in-two-layers-parser-marker-att — the outer of the two layers; the EVENT_SPOTS keying in template.js is the inner
/*
 * The slot index is part of the NAME, not just the value: two spots for the same
 * event on one element (`@click` + `@click.capture`) would otherwise emit the
 * same attribute twice, and duplicate attributes are first-wins — the HTML parser
 * discards the second outright, so the planner finds no marker for it and drops
 * the spot silently. Indexing the name keeps them distinct, exactly as the
 * deduce-from-expr path already does with `data-uwc-evfn-${i}`.
 */
export function eventMarkerAttribute(eventName, slotIndex) {
	return `data-event-${String(eventName).toLowerCase().replace(/[^a-z0-9:-]/g, '-')}-${slotIndex}`;
}
export function bindMarkerAttribute(index) {
	return `${BIND_MARKER}-${index}`;
}
function bindContext(templateString) {
	const match = (/^(?<prefix>[\s\S]*?)@bind=["']?$/).exec(templateString);
	return match ? match.groups.prefix : null;
}
/*
 * `.methodName(${value})` — invoke a method on the element with the resolved
 * value as the sole argument. Detected ONLY inside an open tag (mirrors
 * `bareAttrContext`'s tag-position guard) so a literal `fn.call(${x})` sitting
 * in TEXT can never misfire as a call. The closing `)` lives at the head of the
 * NEXT static string; it is validated here and stripped on the next iteration.
 * Single argument only — a non-`)` follow is a multi-arg form we do not parse.
 */
const METHOD_CALL_RE = /\.([a-zA-Z_$][\w$]*)\($/;
const METHOD_CLOSE_RE = /^\s*\)/;
function methodCallContext(currentString, nextString, htmlSoFar) {
	const match = currentString.match(METHOD_CALL_RE);
	if (!match) {
		return null;
	}
	if (!METHOD_CLOSE_RE.test(nextString)) {
		return null;
	}
	/*
	 * Confirm the call sits INSIDE an open tag, not in text. The `<tagName`
	 * opener may live in an EARLIER static string (a multi-interpolation tag like
	 * `<x .a=${1} .grow(${2})>`), so test the full markup up to the match —
	 * accumulated html plus this string's prefix — for an unclosed `<`. A bare
	 * `fn.call(${x})` in text has a closed tag before it and is rejected.
	 */
	const markup = htmlSoFar + currentString.slice(0, match.index);
	if (markup.lastIndexOf('<') <= markup.lastIndexOf('>')) {
		return null;
	}
	return {
		method: match[1],
		prefix: currentString.slice(0, match.index),
	};
}
export function bareAttrMarkerAttribute(index) {
	return `data-attr-expr-${index}`;
}
export function multiAttrMarkerAttribute(index) {
	return `data-multi-attr-${index}`;
}
export function methodMarkerAttribute(index) {
	return `data-uwc-method-${index}`;
}
const ATTR_OPEN_RE = /([?.])?([\w:-]+)=(["'])([^"']*)$/;
function detectAttrOpen(currentString, nextString) {
	const match = ATTR_OPEN_RE.exec(currentString);
	if (!match) {
		return null;
	}
	const [
		, sigil,
		attrName,
		quote,
		prefix,
	] = match;
	if (prefix.length === 0 && nextString.startsWith(quote)) {
		return null;
	}
	if (sigil) {
		throw new SyntaxError(`${sigil}${attrName}="..." cannot have interpolated string content. Use ${sigil}${attrName}="\${expr}" with a single expression.`);
	}
	return {
		name: attrName,
		quote,
		prefix,
		totalLength: attrName.length + 2 + prefix.length,
	};
}
function bareAttrContext(currentString, nextString = '') {
	const lastOpen = currentString.lastIndexOf('<');
	const lastClose = currentString.lastIndexOf('>');
	if (lastOpen <= lastClose) {
		return false;
	}
	const trailingChar = currentString.at(-1);
	if (![
		' ',
		'\t',
		'\n',
		'\r',
	].includes(trailingChar)) {
		return false;
	}
	const leadingChar = nextString[0];
	if (leadingChar && ![
		' ',
		'\t',
		'\n',
		'\r',
		'/',
		'>',
	].includes(leadingChar)) {
		return false;
	}
	return true;
}
export function inferBareAttrName(expr) {
	if (!isBindingType(expr)) {
		return null;
	}
	const attrName = String(expr.key ?? '')
		.split('.')
		.pop()
		?.trim();
	if (attrName && ATTR_NAME_RE.test(attrName)) {
		return attrName;
	}
	return null;
}
/*
 * Text-position content sigils. A caret token in the literal IMMEDIATELY before
 * a text `${…}` declares the spot's CONTENT_KIND at parse time, so the patcher
 * is chosen ahead of any value classification — and, unlike a typed
 * `bind.text`/`bind.html`, the sigil reaches BARE reads (`^text${this.state.x}`)
 * whose StaticSpot otherwise carries no declared kind and re-scans every patch.
 *   ^text${x}  → TEXT  strict textContent; no `<`/`&` scan; never auto-upgrades
 *                       to innerHTML (the auto path's silent XSS footgun)
 *   ^html${x}  → HTML  innerHTML; TRUSTED rich content — the dev owns XSS here,
 *                       exactly like `bind.html`
 * The `^` must follow a tag close, whitespace, or start-of-content so a stray
 * caret in real text (`a^b`) or an unquoted attr (`x=^text`) can't be misread.
 */
const TEXT_SIGIL_RE = /(?:^|[\s>])\^(text|html)$/;
const TEXT_SIGIL_KINDS = {
	text: CONTENT_KIND.TEXT,
	html: CONTENT_KIND.HTML,
};
function detectTextSigil(currentString) {
	const match = TEXT_SIGIL_RE.exec(currentString);
	if (!match) {
		return null;
	}
	return {
		kind: TEXT_SIGIL_KINDS[match[1]],
		// `^` + the keyword — the span of chars to strip from the emitted markup.
		sigilLength: match[1].length + 1,
	};
}
/*
 * Void elements take no children; true HTML raw-text elements don't parse child
 * markup (comments become literal text), so a text spot inside them keeps its
 * wrapper. `select` / `option` / `optgroup` are NOT raw-text — they only accept
 * restricted children — and MUST stay off this list: putting them here forced a
 * `display:contents` <span> around `list()` options and a nested span around
 * each option label, which breaks Chromium's base-select picker face for some
 * entries (first pick doesn't stick / needs a second click). With them off the
 * list, the list spot elides or anchors onto <select> so <option> nodes are
 * direct children, and option labels elide onto the option as textContent.
 */
const VOID_ELEMENT_TAGS = new Set([
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
const RAW_TEXT_TAGS = new Set([
	'script', 'style', 'textarea', 'title',
]);
const TAG_NAME_TERMINATORS = new Set([
	' ', '>', '/', '\t', '\n', '\r',
]);
/**
 * Lowercased tag name of the open tag whose `<` sits at `openIndex`, scanning up
 * to `limit`. Shared by the elide / anchor predicates to classify the parent.
 */
function openTagName(markup, openIndex, limit) {
	let tagEnd = openIndex + 1;
	while (tagEnd < limit && !TAG_NAME_TERMINATORS.has(markup[tagEnd])) {
		tagEnd++;
	}
	return markup.slice(openIndex + 1, tagEnd).toLowerCase();
}
/**
 * True when a whole-content text spot can fold its marker onto the PARENT
 * element instead of emitting a wrapper <span> — i.e. the `${}` is the parent's
 * SOLE content (no static text, no sibling node). Requires, in order: the very
 * next literal is the parent's close tag (`nextString` starts `</`, which alone
 * rejects every trailing-text / sibling-element / sibling-comment / adjacent-
 * spot case), the parent's open tag just closed (`html` ends with a non-self-
 * closing `>`), and the last `<` in `html` opens a real, content-hostable
 * element (not a `</…>` close, not a `<!…` comment, not void / raw-text). When
 * all hold the spot OWNS the element outright → `spot.element = parent`, every
 * patcher works against the real element, and there is NO wrapper, NO
 * `display:contents`, NO `pointer-events:none` (so the text stays selectable).
 */
function canElideTextWrapper(markup, nextString) {
	if (!nextString.startsWith('</')) {
		return false;
	}
	const lastIndex = markup.length - 1;
	if (markup[lastIndex] !== '>' || markup[lastIndex - 1] === '/') {
		return false;
	}
	const openIndex = markup.lastIndexOf('<');
	if (openIndex === -1) {
		return false;
	}
	const afterOpen = markup[openIndex + 1];
	if (afterOpen === '/' || afterOpen === '!') {
		return false;
	}
	const tagName = openTagName(markup, openIndex, lastIndex);
	return !VOID_ELEMENT_TAGS.has(tagName) && !RAW_TEXT_TAGS.has(tagName);
}
/**
 * A PARTIAL text spot (canElide already returned false) uses comment anchors
 * UNLESS it sits inside a raw-text element, where the parser would render the
 * comments as literal text instead of nodes — there it falls back to the wrapper
 * <span>. If the last `<` is a close tag (`</`) or another comment (`<!`) we're
 * in normal flow (raw-text elements can't contain child elements/comments), so
 * anchors are safe. Only a still-open raw-text tag blocks them.
 */
function canAnchorTextSpot(markup) {
	const openIndex = markup.lastIndexOf('<');
	if (openIndex === -1) {
		/*
		 * Root-level spot (no enclosing element). Keep the wrapper <span>: comments
		 * alone add ZERO element children, and `templateHtmlElement` /
		 * `instantiateLightRow` require exactly one root element. Root-level partial
		 * text is rare, so staying non-zero-span here costs nothing.
		 */
		return false;
	}
	const afterOpen = markup[openIndex + 1];
	if (afterOpen === '/' || afterOpen === '!') {
		return true;
	}
	return !RAW_TEXT_TAGS.has(openTagName(markup, openIndex, markup.length));
}
export function buildHTML(strings, exprs) {
	let html = '';
	const meta = [];
	let attrAccum = null;
	let pendingMethodClose = false;
	const stringsLength = strings.length;
	for (let stringIndex = 0; stringIndex < stringsLength; stringIndex++) {
		let effectiveString = strings[stringIndex];
		const nextString = strings[stringIndex + 1] ?? '';
		/*
		 * The previous slot was a `.method(${value})` call; its closing `)` opens
		 * this static string. Strip it so the paren never reaches the markup.
		 */
		if (pendingMethodClose) {
			effectiveString = effectiveString.replace(METHOD_CLOSE_RE, '');
			pendingMethodClose = false;
		}
		if (attrAccum) {
			const closeIdx = effectiveString.indexOf(attrAccum.quote);
			if (closeIdx === -1) {
				if (effectiveString.length > 0) {
					attrAccum.parts.push({
						literal: effectiveString,
					});
				}
				if (stringIndex < exprs.length) {
					attrAccum.parts.push({
						exprIndex: stringIndex,
						expr: exprs[stringIndex],
					});
				}
				continue;
			}
			if (closeIdx > 0) {
				attrAccum.parts.push({
					literal: effectiveString.slice(0, closeIdx),
				});
			}
			meta.push({
				i: attrAccum.markerIdx,
				type: SPOT_TYPE.MULTI_ATTR,
				attr: attrAccum.name,
				parts: attrAccum.parts,
			});
			html += ` data-uwc ${multiAttrMarkerAttribute(attrAccum.markerIdx)}=""`;
			attrAccum = null;
			effectiveString = effectiveString.slice(closeIdx + 1);
		}
		const textSigil = detectTextSigil(effectiveString);
		if (textSigil) {
			effectiveString = effectiveString.slice(0, effectiveString.length - textSigil.sigilLength);
		}
		const attrOpen = detectAttrOpen(effectiveString, nextString);
		if (attrOpen) {
			const beforeOpener = effectiveString.slice(0, effectiveString.length - attrOpen.totalLength);
			html += beforeOpener;
			attrAccum = {
				name: attrOpen.name,
				quote: attrOpen.quote,
				parts: attrOpen.prefix.length > 0 ? [
					{
						literal: attrOpen.prefix,
					},
				] : [],
				markerIdx: stringIndex,
			};
			if (stringIndex < exprs.length) {
				attrAccum.parts.push({
					exprIndex: stringIndex,
					expr: exprs[stringIndex],
				});
			}
			continue;
		}
		const bindPrefix = bindContext(effectiveString);
		const eventBinding = bindPrefix === null ? eventContext(effectiveString) : null;
		const methodCall = bindPrefix === null && !eventBinding ? methodCallContext(effectiveString, nextString, html) : null;
		if (bindPrefix !== null) {
			html += bindPrefix;
		} else if (eventBinding) {
			html += eventBinding.prefix;
		} else if (methodCall) {
			html += methodCall.prefix;
		} else {
			html += effectiveString;
		}
		if (stringIndex >= exprs.length) {
			continue;
		}
		const expr = exprs[stringIndex];
		if (bindPrefix !== null) {
			html += `data-uwc ${bindMarkerAttribute(stringIndex)}=""`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.BIND,
				expr,
			});
			continue;
		}
		if (methodCall) {
			html += `data-uwc ${methodMarkerAttribute(stringIndex)}="expr${stringIndex}"`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.METHOD,
				method: methodCall.method,
				expr,
			});
			pendingMethodClose = true;
			continue;
		}
		if (eventBinding) {
			if (eventBinding.deduceFromExpr) {
				html += `data-uwc data-uwc-evfn-${stringIndex}=""`;
				meta.push({
					i: stringIndex,
					type: SPOT_TYPE.EVENT,
					eventName: null,
					deduceFromExpr: true,
					expr,
				});
			} else {
				html += `data-uwc ${eventMarkerAttribute(eventBinding.eventName, stringIndex)}="expr${stringIndex}"`;
				meta.push({
					i: stringIndex,
					type: SPOT_TYPE.EVENT,
					eventName: eventBinding.eventName,
					modifiers: eventBinding.modifiers,
					deduceFromExpr: false,
					expr,
				});
			}
			continue;
		}
		const attr = attrContext(effectiveString);
		if (attr) {
			html += attr.quote === '' ? `expr${stringIndex} data-uwc` : `expr${stringIndex}${attr.quote} data-uwc=${attr.quote}`;
			const baseMeta = {
				i: stringIndex,
				attr: attr.name,
				sigil: attr.sigil,
				expr,
			};
			if (attr.sigil === '?') {
				meta.push({
					...baseMeta,
					type: SPOT_TYPE.BOOL_ATTR,
				});
			} else if (attr.sigil === '.') {
				meta.push({
					...baseMeta,
					type: SPOT_TYPE.PROP,
				});
			} else {
				meta.push({
					...baseMeta,
					type: SPOT_TYPE.ATTR,
				});
			}
		} else if (bareAttrContext(effectiveString, nextString)) {
			const inferredAttr = inferBareAttrName(expr);
			if (inferredAttr) {
				html += `data-uwc ${bareAttrMarkerAttribute(stringIndex)}=""`;
				meta.push({
					i: stringIndex,
					type: SPOT_TYPE.BARE_ATTR,
					attr: inferredAttr,
					expr,
				});
				continue;
			}
		} else if (canElideTextWrapper(html, nextString)) {
			/**
			 * Whole-content spot — fold the marker onto the parent's open tag (drop
			 * the trailing `>`, re-add it after the marker). `spot.element` becomes the
			 * parent element itself: no wrapper node, no display/pointer-events hack.
			 */
			html = `${html.slice(0, html.length - 1)} data-uwc ${SPOT}="${stringIndex}">`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.TEXT,
				expr,
				declaredKind: textSigil ? textSigil.kind : null,
				elided: true,
			});
		} else if (canAnchorTextSpot(html)) {
			/*
			 * Partial spot — two comment anchors bound the dynamic range; static
			 * siblings on either side are untouched. No wrapper element.
			 */
			html += `<!--${ANCHOR_START_PREFIX}${stringIndex}--><!--${ANCHOR_END_PREFIX}${stringIndex}-->`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.TEXT,
				expr,
				declaredKind: textSigil ? textSigil.kind : null,
				anchored: true,
			});
		} else {
			html += `<span data-uwc ${SPOT}="${stringIndex}"></span>`;
			meta.push({
				i: stringIndex,
				type: SPOT_TYPE.TEXT,
				expr,
				declaredKind: textSigil ? textSigil.kind : null,
			});
		}
	}
	return {
		html,
		meta,
	};
}
