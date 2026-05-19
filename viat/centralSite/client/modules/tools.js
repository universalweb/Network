import { defineGlobalTool } from '../components/core/ai/index.js';
import { getGlobal } from '../components/core/index.js';
import { listAllTools } from '../components/core/ai/registry.js';
// Page map + per-tool schemas are NOT shipped in every system prompt.
// The AI fetches them on demand via these two tools — keeps the steady-
// state system prompt under ~1.5KB on a typical session and saves the
// big payload for the rare turn that actually needs it.
defineGlobalTool('getPageMap', {
	description: 'Return the live component tree of the page (every component is agent-addressable). Use this when you need to locate a target by path before invoking a verb like highlight / focus / click on it. Returns a multi-line string suitable for direct reading.',
	inputSchema: {
		type: 'object',
		properties: {},
		additionalProperties: false,
	},
	mutating: false,
	handler: ({ component }) => {
		const map = typeof component?.aiMap === 'function' ? component.aiMap() : '';
		return {
			map: map || '(no map available)',
		};
	},
});
defineGlobalTool('getToolSchema', {
	description: 'Return the full input JSON Schema for a single registered tool by name. Use this when you need to know exactly which arguments to pass — the tool digest in the system prompt only lists names + descriptions to keep prompts small.',
	inputSchema: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
				description: 'Exact tool name from the TOOLS digest.',
			},
		},
		required: ['name'],
		additionalProperties: false,
	},
	mutating: false,
	handler: ({ args }) => {
		const name = `${args?.name ?? ''}`.trim();
		if (!name) {
			return { ok: false, error: 'Missing `name`.' };
		}
		const tool = listAllTools().find((entry) => {
			return entry.name === name;
		});
		if (!tool) {
			return { ok: false, error: `Unknown tool "${name}".` };
		}
		return {
			ok: true,
			name: tool.name,
			description: tool.description,
			mutating: tool.mutating === true,
			inputSchema: tool.inputSchema ?? { type: 'object' },
		};
	},
});
defineGlobalTool('getWalletAmount', {
	description: 'Returns the current wallet amount from globalState (the amount displayed in the wallet UI). Takes no arguments.',
	inputSchema: {
		type: 'object',
		properties: {},
		additionalProperties: false,
	},
	mutating: false,
	handler: () => {
		return getGlobal()?.walletAmount ?? null;
	},
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
	handler: ({ component, args }) => {
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
