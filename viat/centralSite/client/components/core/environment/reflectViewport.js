/*
 * `this.reflectViewport()` — mirror the current viewport width bucket onto the
 * host as a `data-vw` attribute, then keep it synced. Replaces the per-component
 * `syncViewportClass` duplication that every viewport-aware component used to
 * hand-roll.
 *
 * Call it once in `onConnect`. It applies the attribute immediately (before first
 * paint, so the host's `:host([data-vw="xs"])` rules match on the first frame),
 * then subscribes to `viewport:change`. The instance `delegate` auto-tracks the
 * subscription and the disconnect sweep tears it down — so a reconnect simply
 * re-subscribes when `onConnect` runs again. No guard flag needed: the change
 * handler is `applyViewportBucket`, which only re-writes the attribute and never
 * re-subscribes, so the listener can't multiply.
 *
 * Why an attribute over a class: `:host([data-vw="xs"])` is portable where
 * `:host-context()` is not (unreliable on pre-16.4 mobile Safari), and an
 * attribute write never clobbers the host class list the way the old
 * `this.classList.value = ...` form did.
 */
export function reflectViewport() {
	this.applyViewportBucket();
	this.delegate('viewport:change', this.applyViewportBucket);
}
export function applyViewportBucket() {
	const bucket = this.globalState?.environment?.viewport?.w ?? 'lg';
	this.setAttribute('data-vw', bucket);
}
