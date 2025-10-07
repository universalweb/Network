import * as utils from './utils.js';
import * as walletState from './state.js';
import {
	clearFieldError,
	getCurrentAddress,
	hasValidAddress,
	resetTransactionForm,
	setLoadingState,
	setSendButtonState,
	showFieldError,
} from './ui.js';
import { validateAddress, validateAmount } from './validation.js';
import { getElements } from './elements.js';
import { showNotification } from './notifications.js';
const elements = getElements();
function clearTransactionErrors() {
	if (elements.txToError && elements.txTo) {
		clearFieldError(elements.txToError, elements.txTo);
	}
	if (elements.txAmountError && elements.txAmount) {
		clearFieldError(elements.txAmountError, elements.txAmount);
	}
}
export function resetTransactionUI() {
	resetTransactionForm();
	clearTransactionErrors();
	setSendButtonState(false);
}
function markEmpty(message) {
	if (elements.txEmpty) {
		elements.txEmpty.textContent = message;
		elements.txEmpty.style.display = 'block';
	}
	if (elements.txLoadMoreContainer) {
		elements.txLoadMoreContainer.style.display = 'none';
	}
}
export function updateTxCount() {
	if (!elements.txList || !elements.txCount) {
		return;
	}
	const count = elements.txList.children.length;
	if (count === 0) {
		elements.txCount.textContent = 'NO TXS';
	} else if (count === 1) {
		elements.txCount.textContent = '1 TX LOADED';
	} else {
		elements.txCount.textContent = `${count} TXs LOADED`;
	}
}
function applyTransactionClasses(item, tx, address) {
	if (tx.to === address) {
		item.classList.add('tx-incoming');
	} else if (tx.from === address) {
		item.classList.add('tx-outgoing');
	}
}
function renderTransaction(tx) {
	const item = document.createElement('li');
	item.className = 'tx-item';
	const address = getCurrentAddress();
	applyTransactionClasses(item, tx, address);
	const left = document.createElement('div');
	left.className = 'tx-left';
	const direction = document.createElement('div');
	direction.className = 'tx-direction';
	const addressInfo = document.createElement('div');
	addressInfo.className = 'tx-address';
	const dateInfo = document.createElement('div');
	dateInfo.className = 'tx-date';
	const amount = document.createElement('div');
	amount.className = 'tx-amount';
	if (tx.to === address) {
		direction.textContent = '󰴮  RECEIVED';
		direction.classList.add('direction-in');
		addressInfo.innerHTML = `From: <a href="/account.html?address=${encodeURIComponent(tx.from)}" class="address-link" target="_blank" title="View account">${tx.from}</a>`;
		amount.textContent = `+${tx.amount}`;
		amount.classList.add('amount-positive');
	} else if (tx.from === address) {
		direction.textContent = '  SENT';
		direction.classList.add('direction-out');
		addressInfo.innerHTML = `To: <a href="/account.html?address=${encodeURIComponent(tx.to)}" class="address-link" target="_blank" title="View account">${tx.to}</a>`;
		amount.textContent = `-${tx.amount}`;
		amount.classList.add('amount-negative');
	} else {
		direction.textContent = '↔ TRANSFER';
		addressInfo.innerHTML = `<a href="/account.html?address=${encodeURIComponent(tx.from)}" class="address-link" target="_blank" title="View account">${tx.from}</a> → <a href="/account.html?address=${encodeURIComponent(tx.to)}" class="address-link" target="_blank" title="View account">${tx.to}</a>`;
		amount.textContent = tx.amount;
	}
	// Format timestamp to local time
	if (tx.timestamp) {
		const date = new Date(tx.timestamp);
		const localTime = date.toLocaleString();
		const utcTime = date.toLocaleString('en-US', {
			timeZone: 'UTC',
		});
		// Get local timezone abbreviation
		const localTimezone = Intl.DateTimeFormat('en-US', {
			timeZoneName: 'short',
		}).formatToParts(date).find((part) => {
			return part.type === 'timeZoneName';
		})?.value || 'Local';
		dateInfo.textContent = `Local (${localTimezone}): ${localTime} - UTC: ${utcTime}`;
	} else {
		dateInfo.textContent = 'Unknown date';
	}
	left.appendChild(direction);
	left.appendChild(addressInfo);
	left.appendChild(dateInfo);
	const right = document.createElement('div');
	right.className = 'tx-right';
	right.appendChild(amount);
	item.appendChild(left);
	item.appendChild(right);
	return item;
}
export function resetTransactions() {
	if (elements.txList) {
		elements.txList.innerHTML = '';
	}
	updateTxCount();
	if (elements.txLoadMoreContainer) {
		elements.txLoadMoreContainer.style.display = 'none';
	}
}
export async function loadRecentTransactions(page = 1, options = {}) {
	const config = options;
	if (!walletState.state.client || typeof walletState.state.client.getAccountTransactions !== 'function') {
		markEmpty('Transaction listing not available (client missing)');
		return;
	}
	const address = getCurrentAddress();
	if (!address) {
		markEmpty('No address set. Generate keys to derive address.');
		return;
	}
	if (address.length !== 28) {
		markEmpty('Invalid address format. Address must be exactly 28 characters.');
		return;
	}
	try {
		const response = await walletState.state.client.getAccountTransactions(address, {
			page,
		});
		const transactions = response.transactions || response;
		const pagination = response.pagination || {};
		if (!config.append) {
			resetTransactions();
			walletState.setPage(1);
		}
		if (!elements.txList) {
			return;
		}
		if (!Array.isArray(transactions) || transactions.length === 0) {
			markEmpty(`No transactions found for address: ${address}`);
			walletState.setHasMoreTransactions(false);
			updateTxCount();
			return;
		}
		if (elements.txEmpty) {
			elements.txEmpty.style.display = 'none';
		}
		transactions.forEach((tx) => {
			elements.txList.appendChild(renderTransaction(tx));
		});
		updateTxCount();
		walletState.setHasMoreTransactions(Boolean(pagination.hasMore));
		walletState.setPage(pagination.page || page);
		if (elements.txLoadMoreContainer) {
			elements.txLoadMoreContainer.style.display = walletState.state.hasMoreTransactions ? 'block' : 'none';
		}
	} catch (error) {
		console.error('loadRecentTransactions failed', error);
		markEmpty(`Error loading transactions: ${error.message || error}`);
	}
}
function encodeSignature(signature) {
	if (signature instanceof Uint8Array) {
		return utils.u8ToBase64(signature);
	}
	if (signature && typeof signature.toString === 'function') {
		return signature.toString('base64');
	}
	return '';
}
export function autoGenerateSignature() {
	if (!elements.txTo || !elements.txAmount || !elements.txSignature) {
		return;
	}
	const toValue = elements.txTo.value.trim();
	const amountValue = elements.txAmount.value.trim();
	const addressValidation = validateAddress(toValue);
	const amountValidation = validateAmount(amountValue);
	if (!addressValidation.valid) {
		showFieldError(elements.txToError, elements.txTo, addressValidation.message);
		elements.txSignature.value = '';
		setSendButtonState(false);
		return;
	}
	clearFieldError(elements.txToError, elements.txTo);
	if (!amountValidation.valid) {
		showFieldError(elements.txAmountError, elements.txAmount, amountValidation.message);
		elements.txSignature.value = '';
		setSendButtonState(false);
		return;
	}
	clearFieldError(elements.txAmountError, elements.txAmount);
	const address = getCurrentAddress();
	if (!address || !walletState.state.privateKey || !walletState.state.client || typeof walletState.state.client.signTransaction !== 'function') {
		elements.txSignature.value = '';
		setSendButtonState(false);
		return;
	}
	walletState.state.client.signTransaction(address, toValue, amountValue, utils.base64ToU8(walletState.state.privateKey)).then((signature) => {
		console.log(signature);
		const encoded = encodeSignature(signature);
		elements.txSignature.value = encoded;
		setSendButtonState(Boolean(encoded));
	}).catch((error) => {
		console.warn('autoGenerateSignature failed', error);
		elements.txSignature.value = '';
		setSendButtonState(false);
	});
}
export async function sendTransaction() {
	if (!elements.txTo || !elements.txAmount || !elements.txSignature || !elements.sendTransactionBtn) {
		return;
	}
	const toValue = elements.txTo.value.trim();
	const amountValue = elements.txAmount.value.trim();
	const signature = elements.txSignature.value.trim();
	const addressValidation = validateAddress(toValue);
	const amountValidation = validateAmount(amountValue);
	if (!addressValidation.valid) {
		showFieldError(elements.txToError, elements.txTo, addressValidation.message);
		showNotification(`Invalid address: ${addressValidation.message}`, 'error');
		return;
	}
	clearFieldError(elements.txToError, elements.txTo);
	if (!amountValidation.valid) {
		showFieldError(elements.txAmountError, elements.txAmount, amountValidation.message);
		showNotification(`Invalid amount: ${amountValidation.message}`, 'error');
		return;
	}
	clearFieldError(elements.txAmountError, elements.txAmount);
	const fromAddress = getCurrentAddress();
	if (!fromAddress || !signature || !walletState.state.publicKey) {
		showNotification('Missing fields to send transaction', 'warning');
		return;
	}
	if (!walletState.state.client || typeof walletState.state.client.createTransaction !== 'function') {
		showNotification('Client send not available', 'error');
		return;
	}
	setLoadingState(elements.sendTransactionBtn, true);
	try {
		await walletState.state.client.createTransaction(fromAddress, toValue, amountValue, signature, walletState.state.publicKey);
		showNotification('Transaction sent successfully!', 'success');
		resetTransactionUI();
		return true;
	} catch (error) {
		showNotification(`Send failed: ${error.message || error}`, 'error');
		return false;
	} finally {
		setLoadingState(elements.sendTransactionBtn, false);
	}
}
export function refreshTransactions() {
	loadRecentTransactions(1, {
		append: false,
	});
}
export function onSuccessfulTransactionClose() {
	resetTransactions();
	if (hasValidAddress()) {
		loadRecentTransactions(1, {
			append: false,
		});
	}
}
