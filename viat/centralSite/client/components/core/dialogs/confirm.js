/*
 * `this.confirm(message): Promise<boolean>` — imperative confirmation prompt,
 * mixed onto WebComponent.prototype via base.js. Composes a lazily-built
 * singleton `<ui-alert-dialog>` so chrome matches the declarative path
 * (ui-button outline cancel + ui-button tone action). Returns true on
 * accept, false on cancel / X / Escape / backdrop.
 *
 * Replaces the old declarative `confirm="…"` behavior and its synthetic
 * `target.click()` re-fire. Handlers now run directly:
 *
 *     async handleSave() {
 *         if (!await this.confirm('Delete this wallet?')) {
 *             return;
 *         }
 *         // …proceed…
 *     }
 *
 * One dialog at a time — concurrent confirms are not supported (the second
 * would stomp the first's listener wiring). In practice a single global
 * confirmation dialog is the right shape; competing prompts indicate a UX
 * problem at the call sites, not at this module.
 */
import { resolveTag } from '../resolver.js';
let dialogElement = null;
async function ensureDialog() {
	const pending = resolveTag('ui-alert-dialog');
	if (pending) {
		await pending;
	}
	if (dialogElement) {
		return;
	}
	dialogElement = document.createElement('ui-alert-dialog');
	document.body.append(dialogElement);
	await dialogElement.pendingConnect;
	await dialogElement.lifecycle.whenRendered;
}
/*
 * Promise executor for a single confirm cycle — a named top-level function
 * (per the no-anonymous-executor rule) rather than an inline arrow. Closes over
 * the module singleton; each call gets a fresh `settled` guard + per-cycle
 * listeners that tear themselves down on the first resolve.
 */
function confirmExecutor(accept) {
	let settled = false;
	function settle(accepted) {
		if (settled) {
			return;
		}
		settled = true;
		dialogElement.removeEventListener('alert-dialog:action', onAction);
		dialogElement.removeEventListener('alert-dialog:cancel', onCancel);
		dialogElement.close();
		accept(accepted);
	}
	function onAction() {
		settle(true);
	}
	function onCancel() {
		settle(false);
	}
	dialogElement.addEventListener('alert-dialog:action', onAction);
	dialogElement.addEventListener('alert-dialog:cancel', onCancel);
	dialogElement.open();
}
/**
 * Public entry point. Module-internal name avoids shadowing the global
 * `confirm` binding — it is exposed on the prototype as
 * `this.confirm(message)` via base.js's PROTO_METHODS map.
 */
export async function confirmPrompt(message) {
	await ensureDialog();
	dialogElement.assignState({
		heading: String(message ?? ''),
		description: '',
		actionLabel: 'Continue',
		cancelLabel: 'Cancel',
		tone: 'danger',
	});
	if (dialogElement.nextFrame) {
		await dialogElement.nextFrame();
	}
	return new Promise(confirmExecutor);
}
