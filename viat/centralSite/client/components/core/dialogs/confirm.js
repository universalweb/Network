/*
 * `this.confirm(message): Promise<boolean>` — imperative confirmation prompt,
 * mixed onto WebComponent.prototype via base.js. Wraps a lazily-built
 * singleton `<ui-modal>` shared across the page. Returns true on accept,
 * false on cancel / backdrop close / Escape.
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
 * One modal at a time — concurrent confirms are not supported (the second
 * would stomp the first's listener wiring). In practice a single global
 * confirmation dialog is the right shape; competing prompts indicate a UX
 * problem at the call sites, not at this module.
 */
import { resolveTag } from '../resolver.js';
const PROMPT_CSS = `
.confirm-prompt { display:flex; flex-direction:column; gap:1rem; padding:1.25rem 1.5rem; min-width:280px; max-width:480px; font:inherit; }
.confirm-prompt-msg { margin:0; line-height:1.4; white-space:pre-wrap; }
.confirm-prompt-actions { display:flex; gap:.5rem; justify-content:flex-end; margin:0; padding:0; list-style:none; }
.confirm-prompt-actions button { font:inherit; cursor:pointer; padding:.5rem 1rem; border-radius:.375rem; border:1px solid currentColor; background:transparent; color:inherit; }
.confirm-prompt-accept { background:currentColor; }
.confirm-prompt-accept > * { color:canvas; }
.confirm-prompt-actions button:hover { opacity:.85; }
`;
let stylesInjected = false;
let modalElement = null;
let messageNode = null;
let acceptButton = null;
let cancelButton = null;
function injectStyles() {
	if (stylesInjected) {
		return;
	}
	const styleElement = document.createElement('style');
	styleElement.textContent = PROMPT_CSS;
	document.head.appendChild(styleElement);
	stylesInjected = true;
}
async function ensureModal() {
	const pending = resolveTag('ui-modal');
	if (pending) {
		await pending;
	}
	if (modalElement) {
		return;
	}
	injectStyles();
	modalElement = document.createElement('ui-modal');
	modalElement.innerHTML = `
		<div class="confirm-prompt">
			<p class="confirm-prompt-msg"></p>
			<div class="confirm-prompt-actions">
				<button type="button" class="confirm-prompt-cancel">Cancel</button>
				<button type="button" class="confirm-prompt-accept">OK</button>
			</div>
		</div>
	`;
	document.body.appendChild(modalElement);
	messageNode = modalElement.querySelector('.confirm-prompt-msg');
	acceptButton = modalElement.querySelector('.confirm-prompt-accept');
	cancelButton = modalElement.querySelector('.confirm-prompt-cancel');
	/*
	 * Wait for the modal's first render so the internal <dialog> exists
	 * before .open() runs.
	 */
	await modalElement.lifecycle.whenRendered;
}
/**
 * Public entry point. Module-internal name avoids shadowing the global
 * `confirm` binding (per CLAUDE.md) — it is exposed on the prototype as
 * `this.confirm(message)` via base.js's PROTO_METHODS map.
 */
export async function confirmPrompt(message) {
	await ensureModal();
	messageNode.textContent = String(message);
	return new Promise((resolve) => {
		let settled = false;
		function settle(accepted) {
			if (settled) {
				return;
			}
			settled = true;
			acceptButton.removeEventListener('click', onAccept);
			cancelButton.removeEventListener('click', onCancel);
			modalElement.removeEventListener('modal-close', onClose);
			modalElement.close();
			resolve(accepted);
		}
		function onAccept() {
			settle(true);
		}
		function onCancel() {
			settle(false);
		}
		function onClose() {
			settle(false);
		}
		acceptButton.addEventListener('click', onAccept);
		cancelButton.addEventListener('click', onCancel);
		modalElement.addEventListener('modal-close', onClose);
		modalElement.open();
	});
}
