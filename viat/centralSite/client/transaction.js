import * as clientModule from './modules/client.js';
import * as elementsModule from './modules/elements.js';
import * as notifications from './modules/notifications.js';
import * as ui from './modules/ui.js';
// Show error message
function showError(message) {
	notifications.showNotification(message, 'error');
}
// Get URL parameters to determine which transaction to show
function getTransactionIdFromUrl() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('id');
}
// Fetch transaction data from API
async function fetchTransactionData(txId) {
	try {
		console.log('Fetching transaction data for ID:', txId);
		const response = await fetch(`/api/transactions/${txId}`);
		console.log('API response status:', response.status);
		if (!response.ok) {
			const errorText = await response.text();
			console.error('API error response:', errorText);
			throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
		}
		const data = await response.json();
		console.log('API response data:', data);
		if (!data.success || !data.transaction) {
			throw new Error('Invalid API response format');
		}
		// Transform API response to match our expected format
		const tx = data.transaction;
		return {
			hash: tx.id,
			amount: tx.amount,
			from: tx.from,
			to: tx.to,
			timestamp: new Date(tx.timestamp).toLocaleString(),
			// API doesn't provide fee yet
			fee: '0',
			status: tx.status || 'confirmed',
			signature: tx.signature,
		};
	} catch (error) {
		console.error('Failed to fetch transaction data:', error);
		throw error;
	}
}
// Display transaction details in the UI
function displayTransactionDetails(tx) {
	const elements = {
		txHash: document.getElementById('txHash'),
		txAmount: document.getElementById('txAmount'),
		txFrom: document.getElementById('txFrom'),
		txTo: document.getElementById('txTo'),
		txTimestamp: document.getElementById('txTimestamp'),
		txFee: document.getElementById('txFee'),
		txStatus: document.getElementById('txStatus'),
		txSignature: document.getElementById('txSignature'),
	};
	// Update all elements with transaction data
	if (elements.txHash) {
		elements.txHash.textContent = tx.hash;
	}
	if (elements.txAmount) {
		elements.txAmount.textContent = tx.amount;
	}
	if (elements.txFrom) {
		elements.txFrom.textContent = tx.from;
	}
	if (elements.txTo) {
		elements.txTo.textContent = tx.to;
	}
	if (elements.txTimestamp) {
		elements.txTimestamp.textContent = tx.timestamp;
	}
	if (elements.txFee) {
		// elements.txFee.textContent = tx.fee;
		elements.txFee.textContent = 0;
	}
	if (elements.txSignature) {
		elements.txSignature.value = tx.signature;
	}
	// Update status badge
	if (elements.txStatus) {
		elements.txStatus.textContent = tx.status.toUpperCase();
		elements.txStatus.className = `status-badge status-${tx.status}`;
	}
}
// Setup address copying functionality
function setupAddressCopying() {
	const addressElements = document.querySelectorAll('.address-value');
	addressElements.forEach((element) => {
		element.style.cursor = 'pointer';
		element.title = 'Click to copy address';
		element.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(element.textContent);
				notifications.showNotification('Address copied to clipboard', 'success');
			} catch (error) {
				console.error('Failed to copy address:', error);
				notifications.showNotification('Failed to copy address', 'error');
			}
		});
	});
}
// Load transaction details from the API
async function loadTransactionDetails(txId) {
	try {
		document.getElementById('txLoading').style.display = 'block';
		// Here you would make an API call to get transaction details
		// For now, we'll simulate with mock data
		const transactionData = await fetchTransactionData(txId);
		displayTransactionDetails(transactionData);
		document.getElementById('txLoading').style.display = 'none';
	} catch (error) {
		console.error('Failed to load transaction details:', error);
		document.getElementById('txLoading').style.display = 'none';
		showError('Failed to load transaction details');
	}
}
// Setup event listeners
function setupEventListeners() {
	// Back to wallet button
	const backBtn = document.getElementById('backToWallet');
	if (backBtn) {
		backBtn.addEventListener('click', () => {
			window.location.href = 'index.html';
		});
	}
	// Refresh transaction button
	const refreshBtn = document.getElementById('refreshTx');
	if (refreshBtn) {
		refreshBtn.addEventListener('click', () => {
			const txId = getTransactionIdFromUrl();
			if (txId) {
				loadTransactionDetails(txId);
			}
		});
	}
	// Copy signature button
	const copySignatureBtn = document.getElementById('copySignatureBtn');
	if (copySignatureBtn) {
		copySignatureBtn.addEventListener('click', async () => {
			const signatureTextarea = document.getElementById('txSignature');
			if (signatureTextarea && signatureTextarea.value) {
				try {
					await navigator.clipboard.writeText(signatureTextarea.value);
					notifications.showNotification('Signature copied to clipboard', 'success');
				} catch (error) {
					console.error('Failed to copy signature:', error);
					notifications.showNotification('Failed to copy signature', 'error');
				}
			}
		});
	}
	// Make addresses clickable for copying
	setupAddressCopying();
}
// Initialize the transaction details page
async function initTransactionPage() {
	try {
		// Get transaction ID from URL
		const txId = getTransactionIdFromUrl();
		if (!txId) {
			showError('No transaction ID provided');
			return;
		}
		// Load transaction details
		await loadTransactionDetails(txId);
		// Setup event listeners
		setupEventListeners();
	} catch (error) {
		console.error('Failed to initialize transaction page:', error);
		showError('Failed to load transaction details');
	}
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initTransactionPage);
