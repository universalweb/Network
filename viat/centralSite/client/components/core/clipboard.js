/**
 * `this.copyText(text): Promise<boolean>` — mixed onto WebComponent.prototype
 * via base.js. Writes a string to the clipboard, resolves to `true` on success
 * and `false` on failure (permission denial, write rejection, missing API).
 * No `try/catch` at the call site needed — branch on the boolean instead.
 *
 * Replaces the old declarative `copy="${expr}"` behavior + its `delegate(
 * 'click.copy', ...)` plumbing. Handlers now run directly:
 *
 *     async handleCopy() {
 *         const accepted = await this.copyText(this.addressText());
 *         if (accepted) {
 *             this.handleCopyDone();
 *             return;
 *         }
 *         this.handleCopyError();
 *     }
 *
 * Module-internal name `writeTextToClipboard` avoids any read at the call
 * site that resembles the global `copy` event name; the prototype method is
 * exposed as `this.copyText(text)` via PROTO_METHODS.
 */
export function writeTextToClipboard(text) {
	if (text === null || text === undefined || text === '') {
		return Promise.resolve(false);
	}
	const clipboard = globalThis.navigator?.clipboard;
	if (!clipboard?.writeText) {
		return Promise.resolve(false);
	}
	return clipboard.writeText(String(text)).then(() => {
		return true;
	}, () => {
		return false;
	});
}
