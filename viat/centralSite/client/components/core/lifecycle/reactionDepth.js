/*
 * Nesting depth of native custom-element reactions currently on the JS stack.
 * connectedCallback / disconnectedCallback / connectedMoveCallback /
 * attributeChangedCallback increment this for the duration of their
 * synchronous body — including the sync prefix of the async handler they
 * kick off (handleConnect until its first await).
 *
 * Chromium rejects showPopover during that window even when isConnected is
 * already true. A depth counter, not a boolean: a parent reaction is still
 * live while a child's connectedCallback runs inside replaceChildren.
 */
let customElementReactionDepth = 0;
export function inCustomElementReaction() {
	return customElementReactionDepth > 0;
}
export function enterCustomElementReaction() {
	customElementReactionDepth += 1;
}
export function leaveCustomElementReaction() {
	customElementReactionDepth -= 1;
}
