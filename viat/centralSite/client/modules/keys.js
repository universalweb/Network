import * as elementsModule from './elements.js';
import * as notifications from './notifications.js';
import * as stats from './stats.js';
import * as transactions from './transactions.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import * as walletState from './state.js';
const elements = elementsModule.getElements();
async function resolveAsyncResult(result) {
	if (result && typeof result.then === 'function') {
		return result;
	}
	return result;
}
export async function deriveAddressFromPublicKey(publicKey) {
	try {
		const input = typeof publicKey === 'string' ? utils.base64ToU8(publicKey) : publicKey;
		if (walletState.state.client && typeof walletState.state.client.generateAddress === 'function') {
			const generated = await resolveAsyncResult(walletState.state.client.generateAddress(input));
			if (generated instanceof Uint8Array) {
				return utils.u8ToBase64(generated);
			}
			return generated;
		}
		if (typeof window !== 'undefined' && window.VIAT && typeof window.VIAT.generateAddress === 'function') {
			const generated = await resolveAsyncResult(window.VIAT.generateAddress(input));
			if (generated instanceof Uint8Array) {
				return utils.u8ToBase64(generated);
			}
			return generated;
		}
		return typeof publicKey === 'string' ? publicKey : utils.u8ToBase64(input);
	} catch (error) {
		console.warn('deriveAddressFromPublicKey failed', error);
		return typeof publicKey === 'string' ? publicKey : utils.u8ToBase64(publicKey);
	}
}
function normalizePrivateKey(value) {
	if (value instanceof Uint8Array) {
		return utils.u8ToBase64(value);
	}
	if (value && typeof value.toString === 'function') {
		return value.toString('base64');
	}
	return String(value || '');
}
function normalizePublicKey(value) {
	if (value instanceof Uint8Array) {
		return utils.u8ToBase64(value);
	}
	if (value && typeof value.toString === 'function') {
		return value.toString('base64');
	}
	return String(value || '');
}
export async function generateKeypair() {
	if (!walletState.state.client) {
		throw new Error('Client not available');
	}
	let pair;
	if (typeof walletState.state.client.createKeypair === 'function') {
		pair = walletState.state.client.createKeypair();
	} else if (typeof walletState.state.client.generateKeypair === 'function') {
		pair = walletState.state.client.generateKeypair('buffer');
	} else {
		throw new Error('Key generation not supported');
	}
	const privateKey = normalizePrivateKey(pair.privateKey);
	const publicKey = normalizePublicKey(pair.publicKey);
	const address = await deriveAddressFromPublicKey(publicKey);
	walletState.setKeys(privateKey, publicKey);
	ui.updateAddressDisplay(address);
	transactions.resetTransactions();
	if (elements.txEmpty) {
		elements.txEmpty.textContent = 'NO TRANSACTIONS FOUND';
		elements.txEmpty.style.display = 'block';
	}
	await stats.updateStatsWithDefaults();
	notifications.showNotification('Keypair generated successfully!', 'success');
	return {
		privateKey,
		publicKey,
		address,
	};
}
export async function applyCustomPrivateKey(value) {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error('Please enter a private key');
	}
	const bytes = utils.base64ToU8(trimmed);
	if (!bytes.length) {
		throw new Error('Invalid private key format');
	}
	if (!walletState.state.client || typeof walletState.state.client.derivePublicKey !== 'function') {
		throw new Error('Public key derivation not available');
	}
	let publicKey = await walletState.state.client.derivePublicKey(bytes);
	publicKey = normalizePublicKey(publicKey);
	const address = await deriveAddressFromPublicKey(publicKey);
	walletState.setKeys(trimmed, publicKey);
	ui.updateAddressDisplay(address);
	transactions.resetTransactions();
	await stats.loadAccountStats(address);
	notifications.showNotification('Custom private key set successfully!', 'success');
	return {
		privateKey: trimmed,
		publicKey,
		address,
	};
}
export function copyToClipboard(value, successMessage) {
	if (!value) {
		return;
	}
	if (!navigator.clipboard) {
		const textarea = document.createElement('textarea');
		textarea.value = value;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand('copy');
			notifications.showNotification(successMessage, 'success');
		} catch (error) {
			notifications.showNotification(`Copy failed: ${error.message || error}`, 'error');
		} finally {
			document.body.removeChild(textarea);
		}
		return;
	}
	navigator.clipboard.writeText(value).then(() => {
		notifications.showNotification(successMessage, 'success');
	}).catch(() => {
		notifications.showNotification('Copy failed', 'error');
	});
}
export function downloadText(content, filename) {
	if (!content) {
		return;
	}
	const blob = new Blob([content], {
		type: 'text/plain',
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
