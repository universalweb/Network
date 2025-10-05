const idMap = {
	genKeysBtn: 'genKeys',
	createAccountBtn: 'createAccount',
	mintFundsBtn: 'mintFundsBtn',
	txList: 'txList',
	txEmpty: 'txEmpty',
	txLoadMoreContainer: 'txLoadMoreContainer',
	txLoadMore: 'txLoadMore',
	txCount: 'txCount',
	welcomeOverlay: 'welcomeOverlay',
	welcomeGenKeys: 'welcomeGenKeys',
	welcomeSetCustom: 'welcomeSetCustom',
	accountStats: 'accountStats',
	refreshStats: 'refreshStats',
	statBalance: 'statBalance',
	statTotalIn: 'statTotalIn',
	statTotalOut: 'statTotalOut',
	statTxCount: 'statTxCount',
	statAddress: 'statAddress',
	showKeysBtn: 'showKeysBtn',
	keysOverlay: 'keysOverlay',
	closeKeysOverlay: 'closeKeysOverlay',
	pubDisplay: 'pubDisplay',
	privDisplay: 'privDisplay',
	copyPubBtn: 'copyPubBtn',
	copyPrivBtn: 'copyPrivBtn',
	downloadPubBtn: 'downloadPubBtn',
	downloadPrivBtn: 'downloadPrivBtn',
	togglePrivateKeyBtn: 'togglePrivateKeyBtn',
	privateKeyWarning: 'privateKeyWarning',
	privateKeyDisplay: 'privateKeyDisplay',
	setCustomKeyBtn: 'setCustomKeyBtn',
	customKeyOverlay: 'customKeyOverlay',
	closeCustomOverlay: 'closeCustomOverlay',
	customPrivInput: 'customPrivInput',
	setCustomPrivBtn: 'setCustomPrivBtn',
	cancelCustomBtn: 'cancelCustomBtn',
	createTransactionBtn: 'createTransactionBtn',
	transactionOverlay: 'transactionOverlay',
	closeTransactionOverlay: 'closeTransactionOverlay',
	txTo: 'txTo',
	txToError: 'txToError',
	txAmount: 'txAmount',
	txAmountError: 'txAmountError',
	txSignature: 'txSignature',
	sendTransactionBtn: 'sendTransactionBtn',
	cancelTransactionBtn: 'cancelTransactionBtn',
	from: 'from',
	identityBar: 'identityBar',
	refreshTx: 'refreshTx',
	notificationContainer: 'notificationContainer',
};
function byId(id) {
	return document.getElementById(id);
}
const elements = {};
Object.keys(idMap).forEach((key) => {
	elements[key] = byId(idMap[key]);
});
export function getElements() {
	return elements;
}
export function getAddressTextElement() {
	const fromElement = elements.from;
	return fromElement ? fromElement.querySelector('.address-text') : null;
}
export function ensureInitialVisibility() {
	if (elements.identityBar) {
		elements.identityBar.removeAttribute('hidden');
		if (!elements.identityBar.dataset.visible) {
			elements.identityBar.dataset.visible = elements.identityBar.classList.contains('is-hidden') ? 'false' : 'true';
		}
	}
	if (elements.showKeysBtn) {
		elements.showKeysBtn.removeAttribute('hidden');
		if (!elements.showKeysBtn.dataset.visible) {
			elements.showKeysBtn.dataset.visible = elements.showKeysBtn.classList.contains('is-hidden') ? 'false' : 'true';
		}
	}
	if (elements.mintFundsBtn) {
		elements.mintFundsBtn.removeAttribute('hidden');
		if (!elements.mintFundsBtn.dataset.visible) {
			elements.mintFundsBtn.dataset.visible = elements.mintFundsBtn.classList.contains('is-hidden') ? 'false' : 'true';
		}
	}
}
export { byId };
