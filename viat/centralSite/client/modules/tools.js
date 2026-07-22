import { defineGlobalTool } from '../components/core/ai/index.js';
import { globalState } from '../components/core/index.js';
/*
 * App-specific tools only. Universal tools (component verbs, getPageMap,
 * getToolSchema) live in core/ai/tools.js and register with the framework.
 */
/*
 * The displayed amounts live on the single `account` object alongside the raw
 * server record, so this reads the two display fields off it rather than a
 * separate walletAmount key.
 */
function getWalletAmountFromState() {
	const account = globalState.get()?.account;
	if (!account) {
		return null;
	}
	return {
		amount: account.amount ?? null,
		amountFull: account.amountFull ?? null,
	};
}
defineGlobalTool('getWalletAmount', {
	description: 'Returns the current wallet amount from globalState (the amount displayed in the wallet UI). Takes no arguments.',
	inputSchema: {
		type: 'object',
		properties: {},
		additionalProperties: false,
	},
	mutating: false,
	handler: getWalletAmountFromState,
});
// AI-facing send entrypoint. We INTENTIONALLY don't send straight from a
// tool call — the human stays in the loop. The tool just pops the
// send-confirm modal with whatever fields the AI pre-filled; the user
// reviews, edits if needed, and presses CONFIRM. AppView then runs the
// real `transmit` handler (sign → POST → notify → refresh account).
// Mutating: true so any future permission gate sees this as a side-effect.
defineGlobalTool('sendTransaction', {
	description: 'Open the SEND CONFIRMATION modal pre-filled with a recipient address and amount. The user must explicitly confirm before any signature or network call happens. Provide `to` (base64 wallet address) and `amount` (decimal string in VIAT). Optionally provide `reason` for a short human-readable rationale shown above the form.',
	inputSchema: {
		type: 'object',
		properties: {
			to: {
				type: 'string',
				description: 'Recipient wallet address, base64-encoded.',
			},
			amount: {
				type: 'string',
				description: 'Amount of VIAT to send, decimal string (e.g. "1.5").',
			},
			reason: {
				type: 'string',
				description: 'Optional short message explaining why the AI is requesting this send.',
			},
		},
		required: ['to', 'amount'],
		additionalProperties: false,
	},
	mutating: true,
	handler: ({
		component, args,
	}) => {
		const to = `${args?.to ?? ''}`.trim();
		const amount = `${args?.amount ?? ''}`.trim();
		if (!to) {
			return {
				ok: false,
				error: 'Missing recipient address (`to`).',
			};
		}
		if (!amount) {
			return {
				ok: false,
				error: 'Missing amount.',
			};
		}
		const modal = component?.getComponent?.('send-confirm-modal');
		if (!modal?.openFor) {
			return {
				ok: false,
				error: 'Send confirmation modal is not mounted.',
			};
		}
		modal.openFor({
			to,
			amount,
			reason: args?.reason || 'AI requested this transaction. Confirm below to sign and broadcast.',
		});
		return {
			ok: true,
			status: 'awaiting-user-confirmation',
			to,
			amount,
		};
	},
});
