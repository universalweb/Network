export const state = {
	client: null,
	privateKey: '',
	publicKey: '',
	currentPage: 1,
	hasMoreTransactions: false,
};
export function setClient(client) {
	state.client = client;
}
export function setKeys(privateKey, publicKey) {
	state.privateKey = privateKey;
	state.publicKey = publicKey;
}
export function resetKeys() {
	state.privateKey = '';
	state.publicKey = '';
}
export function setPage(page) {
	state.currentPage = page;
}
export function setHasMoreTransactions(hasMore) {
	state.hasMoreTransactions = hasMore;
}
