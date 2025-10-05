import * as walletState from './state.js';
function instantiateClient(VIAT) {
	if (VIAT?.VIATClient) {
		return new VIAT.VIATClient();
	}
	return null;
}
export function resolveClient() {
	if (typeof window === 'undefined') {
		return null;
	}
	if (window.viatClient) {
		return window.viatClient;
	}
	return instantiateClient(window.VIAT) || null;
}
export function initClient() {
	const client = resolveClient();
	walletState.setClient(client);
	return client;
}
