import { defineGlobalTool } from '../components/core/ai/index.js';
import { getGlobal } from '../components/core/index.js';
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
