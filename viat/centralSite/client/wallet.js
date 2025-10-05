import * as clientModule from './modules/client.js';
import * as elementsModule from './modules/elements.js';
import * as keys from './modules/keys.js';
import * as notifications from './modules/notifications.js';
import * as overlayModule from './modules/overlays.js';
import * as stats from './modules/stats.js';
import * as transactions from './modules/transactions.js';
import * as ui from './modules/ui.js';
import * as validation from './modules/validation.js';
import * as walletState from './modules/state.js';
const elements = elementsModule.getElements();
const overlays = {
	keys: overlayModule.createOverlay(elements.keysOverlay),
	custom: overlayModule.createOverlay(elements.customKeyOverlay),
	transaction: overlayModule.createOverlay(elements.transactionOverlay),
};
const overlayList = Object.values(overlays);
const originalTransactionClose = overlays.transaction.closeOverlay;
overlays.transaction.closeOverlay = () => {
	originalTransactionClose();
	transactions.resetTransactionUI();
};
const originalCustomClose = overlays.custom.closeOverlay;
overlays.custom.closeOverlay = () => {
	originalCustomClose();
	if (elements.customPrivInput) {
		elements.customPrivInput.value = '';
	}
};
const originalKeysClose = overlays.keys.closeOverlay;
overlays.keys.closeOverlay = () => {
	originalKeysClose();
	if (elements.privateKeyDisplay) {
		elements.privateKeyDisplay.hidden = true;
	}
};
function openCustomOverlay(extraClass) {
	if (elements.customPrivInput) {
		elements.customPrivInput.value = '';
	}
	overlays.custom.openOverlay({
		focus: elements.customPrivInput,
		extraClass,
	});
}
function setPrivateKeyVisibility(visible) {
	const container = elements.privateKeyDisplay;
	if (!container) {
		return;
	}
	const textarea = elements.privDisplay;
	const shouldShow = Boolean(visible);
	container.hidden = !shouldShow;
	container.style.display = shouldShow ? '' : 'none';
	if (shouldShow) {
		container.removeAttribute('hidden');
		container.classList.add('is-visible');
		container.classList.remove('is-hidden');
	} else {
		container.setAttribute('hidden', '');
		container.classList.add('is-hidden');
		container.classList.remove('is-visible');
	}
	if (textarea) {
		textarea.hidden = !shouldShow;
		textarea.style.display = shouldShow ? '' : 'none';
	}
	if (elements.privateKeyWarning) {
		elements.privateKeyWarning.hidden = shouldShow;
		if (shouldShow) {
			elements.privateKeyWarning.setAttribute('hidden', '');
		} else {
			elements.privateKeyWarning.removeAttribute('hidden');
		}
	}
	if (elements.togglePrivateKeyBtn) {
		elements.togglePrivateKeyBtn.textContent = shouldShow ? 'Hide Private Key' : 'Show Private Key';
		elements.togglePrivateKeyBtn.setAttribute('aria-expanded', shouldShow ? 'true' : 'false');
		elements.togglePrivateKeyBtn.dataset.state = shouldShow ? 'visible' : 'hidden';
	}
}
function populateKeyDisplays() {
	if (elements.pubDisplay) {
		elements.pubDisplay.value = walletState.state.publicKey || '';
	}
	if (elements.privDisplay) {
		elements.privDisplay.value = walletState.state.privateKey || '';
	}
	if (elements.togglePrivateKeyBtn) {
		elements.togglePrivateKeyBtn.disabled = !walletState.state.privateKey;
	}
	setPrivateKeyVisibility(false);
}
function togglePrivateKeyVisibility(forceVisible) {
	if (!elements.privateKeyDisplay) {
		return;
	}
	const shouldShow = typeof forceVisible === 'boolean' ? forceVisible : elements.privateKeyDisplay.hidden;
	setPrivateKeyVisibility(shouldShow);
}
function validateTxAddressField() {
	if (!elements.txTo || !elements.txToError) {
		return;
	}
	const result = validation.validateAddress(elements.txTo.value.trim());
	if (!result.valid) {
		ui.showFieldError(elements.txToError, elements.txTo, result.message);
		return;
	}
	ui.clearFieldError(elements.txToError, elements.txTo);
}
function validateTxAmountField() {
	if (!elements.txAmount || !elements.txAmountError) {
		return;
	}
	const result = validation.validateAmount(elements.txAmount.value.trim());
	if (!result.valid) {
		ui.showFieldError(elements.txAmountError, elements.txAmount, result.message);
		return;
	}
	ui.clearFieldError(elements.txAmountError, elements.txAmount);
}
async function handleGenerateKeys(button) {
	if (!button) {
		return;
	}
	ui.setLoadingState(button, true);
	try {
		await keys.generateKeypair();
	} catch (error) {
		notifications.showNotification(`Key generation failed: ${error.message || error}`, 'error');
	} finally {
		ui.setLoadingState(button, false);
	}
}
async function handleCustomKeySubmit() {
	if (!elements.setCustomPrivBtn || !elements.customPrivInput) {
		return;
	}
	ui.setLoadingState(elements.setCustomPrivBtn, true);
	try {
		await keys.applyCustomPrivateKey(elements.customPrivInput.value);
		elements.customPrivInput.value = '';
		overlays.custom.closeOverlay();
	} catch (error) {
		notifications.showNotification(`Failed to set private key: ${error.message || error}`, 'error');
	} finally {
		ui.setLoadingState(elements.setCustomPrivBtn, false);
	}
}
async function handleMintFunds() {
	if (!elements.mintFundsBtn) {
		return;
	}
	const address = ui.getCurrentAddress();
	if (!address) {
		notifications.showNotification('No address available. Generate keys first.', 'warning');
		return;
	}
	if (!walletState.state.client || typeof walletState.state.client.mintFunds !== 'function') {
		notifications.showNotification('Client mintFunds not available', 'error');
		return;
	}
	ui.setLoadingState(elements.mintFundsBtn, true);
	try {
		await walletState.state.client.mintFunds(address, 1n);
		notifications.showNotification('Funds minted successfully!', 'success');
		await stats.loadAccountStats(address);
	} catch (error) {
		notifications.showNotification(`Mint funds failed: ${error.message || error}`, 'error');
	} finally {
		ui.setLoadingState(elements.mintFundsBtn, false);
	}
}
async function handleLoadMore() {
	if (!elements.txLoadMore) {
		return;
	}
	ui.setLoadingState(elements.txLoadMore, true);
	try {
		await transactions.loadRecentTransactions(walletState.state.currentPage + 1, {
			append: true,
		});
	} catch (error) {
		console.error('load more failed', error);
		notifications.showNotification('Failed to load more transactions', 'error');
	} finally {
		ui.setLoadingState(elements.txLoadMore, false);
	}
}
async function handleSendTransaction() {
	const success = await transactions.sendTransaction();
	if (success) {
		overlays.transaction.closeOverlay();
		await stats.loadAccountStats(ui.getCurrentAddress());
	}
}
function bindTransactionEvents() {
	elements.refreshTx?.addEventListener('click', transactions.refreshTransactions);
	elements.txLoadMore?.addEventListener('click', handleLoadMore);
	elements.txTo?.addEventListener('input', transactions.autoGenerateSignature);
	elements.txTo?.addEventListener('blur', validateTxAddressField);
	elements.txAmount?.addEventListener('input', transactions.autoGenerateSignature);
	elements.txAmount?.addEventListener('blur', validateTxAmountField);
	elements.sendTransactionBtn?.addEventListener('click', handleSendTransaction);
	elements.createTransactionBtn?.addEventListener('click', () => {
		transactions.resetTransactionUI();
		overlays.transaction.openOverlay({
			focus: elements.txTo,
		});
	});
	elements.closeTransactionOverlay?.addEventListener('click', () => {
		overlays.transaction.closeOverlay();
	});
	elements.cancelTransactionBtn?.addEventListener('click', () => {
		overlays.transaction.closeOverlay();
	});
}
function bindIdentityEvents() {
	elements.genKeysBtn?.addEventListener('click', () => {
		handleGenerateKeys(elements.genKeysBtn);
	});
	elements.welcomeGenKeys?.addEventListener('click', () => {
		handleGenerateKeys(elements.welcomeGenKeys);
	});
	elements.welcomeSetCustom?.addEventListener('click', () => {
		openCustomOverlay('custom-key-from-welcome');
	});
	elements.setCustomKeyBtn?.addEventListener('click', () => {
		openCustomOverlay();
	});
	elements.closeCustomOverlay?.addEventListener('click', () => {
		overlays.custom.closeOverlay();
	});
	elements.cancelCustomBtn?.addEventListener('click', () => {
		overlays.custom.closeOverlay();
	});
	elements.setCustomPrivBtn?.addEventListener('click', handleCustomKeySubmit);
	elements.copyPubBtn?.addEventListener('click', () => {
		keys.copyToClipboard(walletState.state.publicKey, 'Public key copied!');
	});
	elements.copyPrivBtn?.addEventListener('click', () => {
		keys.copyToClipboard(walletState.state.privateKey, 'Private key copied!');
	});
	elements.downloadPubBtn?.addEventListener('click', () => {
		keys.downloadText(walletState.state.publicKey, 'viat-public-key.txt');
	});
	elements.downloadPrivBtn?.addEventListener('click', () => {
		keys.downloadText(walletState.state.privateKey, 'viat-private-key.txt');
	});
	elements.showKeysBtn?.addEventListener('click', () => {
		if (!walletState.state.publicKey && !walletState.state.privateKey) {
			return;
		}
		populateKeyDisplays();
		overlays.keys.openOverlay();
	});
	elements.closeKeysOverlay?.addEventListener('click', () => {
		overlays.keys.closeOverlay();
	});
	elements.togglePrivateKeyBtn?.addEventListener('click', () => {
		if (!walletState.state.privateKey) {
			return;
		}
		togglePrivateKeyVisibility();
	});
	elements.mintFundsBtn?.addEventListener('click', handleMintFunds);
	elements.from?.addEventListener('click', () => {
		const address = ui.getCurrentAddress();
		if (address) {
			keys.copyToClipboard(address, 'Address copied to clipboard!');
		}
	});
}
function bindStatsEvents() {
	elements.refreshStats?.addEventListener('click', () => {
		stats.loadAccountStats(ui.getCurrentAddress());
	});
}
function bindGlobalShortcuts() {
	document.addEventListener('keydown', (evt) => {
		if (evt.key === 'Escape') {
			overlayModule.closeAll(overlayList);
		}
	});
}
function bindEvents() {
	bindIdentityEvents();
	bindTransactionEvents();
	bindStatsEvents();
	bindGlobalShortcuts();
}
function initializeClient() {
	clientModule.initClient();
}
function initializeUI() {
	elementsModule.ensureInitialVisibility();
	ui.updateAddressDisplay(ui.getCurrentAddress());
	transactions.updateTxCount();
	if (ui.hasValidAddress()) {
		stats.loadAccountStats(ui.getCurrentAddress());
	} else {
		transactions.resetTransactions();
		ui.hideAccountStats();
	}
}
initializeClient();
bindEvents();
initializeUI();
