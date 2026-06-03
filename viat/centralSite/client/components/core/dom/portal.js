/*
 * Portal projection — Teleport. A `<portal to="...">` marker
 * in a template renders its content INLINE (so the engine's spots, refs, events,
 * and patch passes all wire up natively), then this MOVES the rendered subtree to
 * another DOM target (default `document.body`) after each full build. The move uses
 * the platform's atomic `moveBefore` (state-preserving — fires NO disconnect/connect)
 * so a portaled child COMPONENT keeps its lifecycle, reactive subscriptions, and
 * phase intact; a plain `appendChild` would disconnect→reconnect it and a late
 * `handleDisconnect` would then strip the reconnected child's subscriptions. The
 * moved nodes keep their Spot references (`Spot.el` is a direct node handle), so
 * reactive patches keep applying in place wherever the content now lives — the
 * engine needs no portal-awareness, and a patch pass leaves it untouched.
 *
 * STYLE CARRY (the load-bearing part): moving content out of a shadow root would
 * strip its `adoptedStyleSheets`. So for a SHADOW component the target wrapper gets
 * its OWN shadow root that RE-ADOPTS the component's sheets (constructable sheets
 * are shareable across roots) — content is styled exactly as in place. A LIGHT
 * component has no sheet to carry: its content is moved into a plain wrapper (NO
 * shadow) so global `<head>` CSS still reaches it (unscoped mode). `@scope(tag)`
 * light styles do NOT follow the move (the content is no longer inside `<tag>`) —
 * use shadow or unscoped styling for portaled content. The sheets are SNAPSHOTTED at
 * projection; a later runtime `addStyle`/`removeStyle` on the component does not
 * propagate into already-portaled content.
 *
 * SEMANTICS (Teleport-like, by design): the moved subtree leaves the component's
 * physical DOM position. Direct listeners (`@click` → EventSpot on the node) survive
 * the move; delegated events (`this.delegate`) and `provide`/`inject` resolve by
 * physical ancestry, so inside a portal they see the TARGET's tree (e.g. body), not
 * the logical parent. Pass data in through bare reads / props, not delegation.
 *
 * `to` is a STATIC attribute (no interpolation) so no ATTR spot lands on the marker
 * we unwrap. Absent / "body" → `document.body`; any other value → `document.querySelector`
 * (document-scope, the one sanctioned query). A missing target leaves the content in
 * place (graceful fallback — content is never lost).
 *
 * Teardown: target wrappers are tracked per component in a WeakMap and removed by
 * `removePortals`, hooked into `runTemplateCleanup` — which fires on BOTH a full
 * rebuild (old wrappers cleared before re-projection) and disconnect (via
 * `cleanupTemplate`), so a portal never outlives its owner. Disconnect teardown is
 * ASYNC: `handleDisconnect` first awaits `pendingConnect`, so the wrapper is removed
 * a scheduler macrotask after `el.remove()`, not synchronously — a test polling on
 * microtasks must span a frame. The one edge this does not serialize is a PATHOLOGICAL
 * rapid disconnect→reconnect before that connect settles (a pre-existing framework
 * async-disconnect trait, not portal-specific); settled mount/live/unmount, patch,
 * reconnect-after-settle, and full rebuild are all clean.
 */
const portalWrappers = new WeakMap();
/**
 * Resolve a `to` value to its DOM mount target. Absent / "body" → document.body;
 * otherwise a document-scope selector. Returns null when a selector matches nothing.
 * @param {string|null} to - The marker's static `to` attribute.
 * @returns {Element|null} The target element, or null when unresolved.
 */
function resolvePortalTarget(to) {
	if (!to || to === 'body') {
		return document.body;
	}
	return document.querySelector(to);
}
/**
 * Relocate the marker's children into the mount. Uses the platform's atomic
 * `moveBefore` (state-preserving — fires NO disconnect/connect) so a portaled child
 * COMPONENT keeps its lifecycle, reactive subscriptions, and phase intact across the
 * move; a plain `appendChild` would disconnect→reconnect it and a late-resuming
 * `handleDisconnect` would then tear down the reconnected child's subscriptions
 * (dead reactivity). Falls back to `appendChild` only when `moveBefore` is
 * unavailable or the node is detached (no lifecycle to preserve either way).
 * The mount must already be connected for `moveBefore` — the caller appends the
 * wrapper to its target first.
 * @param {Element} marker - The `<portal>` marker holding the rendered children.
 * @param {HTMLElement|ShadowRoot} mount - The connected destination.
 */
function movePortalChildren(marker, mount) {
	const canMove = typeof mount.moveBefore === 'function';
	while (marker.firstChild) {
		const node = marker.firstChild;
		if (canMove && node.isConnected) {
			mount.moveBefore(node, null);
		} else {
			mount.appendChild(node);
		}
	}
}
/**
 * Build the relocation wrapper. Shadow component → a wrapper with its own shadow
 * root that re-adopts the component's sheets (style carry). Light component → a
 * plain wrapper so global head CSS still reaches the content.
 * @param {WebComponent} component - The portal's owning component.
 * @returns {{wrapper: HTMLDivElement, mount: HTMLElement|ShadowRoot}} Wrapper + mount point.
 */
function createPortalWrapper(component) {
	const wrapper = document.createElement('div');
	wrapper.className = 'uwc-portal';
	const shadow = component.shadowRoot;
	if (shadow) {
		const wrapperShadow = wrapper.attachShadow({
			mode: 'open',
		});
		wrapperShadow.adoptedStyleSheets = shadow.adoptedStyleSheets;
		return {
			wrapper,
			mount: wrapperShadow,
		};
	}
	return {
		wrapper,
		mount: wrapper,
	};
}
function unwrapPortalInPlace(marker) {
	const parentNode = marker.parentNode;
	while (marker.firstChild) {
		parentNode.insertBefore(marker.firstChild, marker);
	}
	parentNode.removeChild(marker);
}
/**
 * Relocate every `<portal>` marker's content to its target after a full (re)build.
 * Each marker becomes a wrapper appended to the target; the marker itself is removed
 * so the render root carries no portal residue. Runs for both shadow and light
 * components (a portal escapes the render root in either mode).
 * @param {WebComponent} component - The component just (re)built.
 * @param {ShadowRoot|WebComponent} renderRoot - Where the template mounted.
 */
export function projectPortals(component, renderRoot) {
	const markers = [...renderRoot.querySelectorAll('portal')];
	if (!markers.length) {
		return;
	}
	const wrappers = [];
	for (let index = 0; index < markers.length; index++) {
		const marker = markers[index];
		const target = resolvePortalTarget(marker.getAttribute('to'));
		if (!target) {
			unwrapPortalInPlace(marker);
			continue;
		}
		const portalWrapper = createPortalWrapper(component);
		/* Attach the wrapper FIRST so its mount is connected — required for the
		 * atomic, state-preserving moveBefore inside movePortalChildren. */
		target.appendChild(portalWrapper.wrapper);
		movePortalChildren(marker, portalWrapper.mount);
		marker.remove();
		wrappers.push(portalWrapper.wrapper);
	}
	if (wrappers.length) {
		portalWrappers.set(component, wrappers);
	}
}
/**
 * Detach this component's relocated portal wrappers. Hooked into runTemplateCleanup,
 * so it fires before a rebuild re-projects and on disconnect — a portal never
 * outlives its owner. No-op when the component has none.
 * @param {WebComponent} component - The component being torn down / rebuilt.
 */
export function removePortals(component) {
	const wrappers = portalWrappers.get(component);
	if (!wrappers) {
		return;
	}
	for (let index = 0; index < wrappers.length; index++) {
		wrappers[index].remove();
	}
	portalWrappers.delete(component);
}
