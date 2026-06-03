/*
 * Light-DOM content projection — the <slot> mechanism for no-shadow components.
 * Shadow components project natively; a light component renders its template
 * INTO itself (template.js replaceChildren), which would otherwise destroy any
 * authored children. This captures those children ONCE, then redistributes them
 * into <slot> / <slot name="x"> markers after each full (re)build.
 *
 * Captured nodes are MOVED, never cloned — identity, listeners, and (for child
 * components) state survive every re-projection. The capture lives in a WeakMap:
 * it persists across disconnect (so a reconnect re-projects the SAME nodes) and
 * releases when the component is GC'd, so there is no explicit teardown. Capture
 * is once-ever (the WeakMap guard), which is also what stops a reconnect rebuild
 * from mistaking the previously-mounted template for fresh authored content.
 *
 * CONSTRAINT: a <slot> must be a STANDALONE element. TEXT / ^html / list() spots
 * write the whole element (textContent= / innerHTML=), so a <slot> that shares a
 * parent with such a spot loses its projected content on the next patch. Keep
 * slots in their own container and dynamic spots elsewhere.
 *
 * Matching: default slot = nodes with no `slot` attribute (plus text/comment
 * nodes); named slot = elements whose `slot="x"` equals the slot's `name`. A slot
 * with no matched content shows its own children as fallback. The <slot> marker
 * is unwrapped either way, so the final light DOM is plain HTML with no residue.
 *
 * Capture happens at first render, which the connect pipeline defers past
 * connectedCallback — so declaratively-authored and programmatically-appended
 * children are present. A streaming HTML parse that appends children AFTER first
 * render is the one boundary this does not catch (define-after-parse is fine).
 */
const capturedChildren = new WeakMap();
/**
 * Record a light component's original child nodes once, before the first
 * template mount detaches them. No-op on every later render (WeakMap guard), so
 * a re-render never re-captures the mounted template as authored content.
 * @param {WebComponent} component - The light-DOM component being rendered.
 */
export function captureLightChildren(component) {
	if (capturedChildren.has(component)) {
		return;
	}
	const nodes = [];
	let child = component.firstChild;
	while (child) {
		nodes.push(child);
		child = child.nextSibling;
	}
	capturedChildren.set(component, nodes);
}
function slotNameOf(node) {
	if (node.nodeType === Node.ELEMENT_NODE) {
		return node.getAttribute('slot') || '';
	}
	return '';
}
function collectForSlot(nodes, slotName) {
	const matched = [];
	for (let index = 0; index < nodes.length; index++) {
		if (slotNameOf(nodes[index]) === slotName) {
			matched.push(nodes[index]);
		}
	}
	return matched;
}
function unwrapSlot(slotElement) {
	const slotParent = slotElement.parentNode;
	while (slotElement.firstChild) {
		slotParent.insertBefore(slotElement.firstChild, slotElement);
	}
	slotParent.removeChild(slotElement);
}
function fillSlot(slotElement, matched) {
	const slotParent = slotElement.parentNode;
	for (let index = 0; index < matched.length; index++) {
		slotParent.insertBefore(matched[index], slotElement);
	}
	slotParent.removeChild(slotElement);
}
/**
 * Redistribute captured children into the freshly mounted template's <slot>
 * markers, then unwrap each marker. Runs after every full (re)build of a light
 * component. Moves the canonical captured nodes, so re-projection is idempotent
 * and preserves node identity.
 * @param {WebComponent} component - The light-DOM component just (re)built.
 */
export function projectLightChildren(component) {
	const slots = [...component.getElementsByTagName('slot')];
	if (!slots.length) {
		return;
	}
	const nodes = capturedChildren.get(component) ?? [];
	const filledNames = new Set();
	for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
		const slotElement = slots[slotIndex];
		const slotName = slotElement.getAttribute('name') || '';
		/*
		 * Match per slot, but only the FIRST slot of a given name claims content
		 * (native behavior); a duplicate, or a slot with no match, unwraps to show
		 * its own fallback children. Every marker is unwrapped either way, so the
		 * final light DOM carries no <slot> residue.
		 */
		const matched = filledNames.has(slotName) ? [] : collectForSlot(nodes, slotName);
		filledNames.add(slotName);
		if (matched.length) {
			fillSlot(slotElement, matched);
		} else {
			unwrapSlot(slotElement);
		}
	}
}
