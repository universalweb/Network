import { getFinalDirectory, getPrefixPath, getShortPrefixPath } from '../../files/getPrefixPath.js';
import {
	getWalletPath,
	getWalletURL,
	walletPathToURL,
	walletURLToPath,
} from '../wallet/uri.js';
import blockDefaults from '../defaults.js';
import defaults from './defaults.js';
import { isNotString } from '@universalweb/acid';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// Consider Short URL which uses a "proxy trie" (Shortcut symlink to actual) that uses the 64 byte hash like a wallet trie to map to a wallet folder then the receipt.
export const receiptBlockFilename = blockDefaults.genericFilenames.receipt;
export function getReceiptPrefixPath(receiptHash) {
	return getShortPrefixPath(receiptHash);
}
export function getReceiptDirectory(receiptHash) {
	return getFinalDirectory(receiptHash);
}
export function getReceiptFilename(receiptHash) {
	const address = (receiptHash) ? toBase64Url(receiptHash) : receiptBlockFilename;
	return address;
}
export function getReceiptsPath(walletAddress) {
	return path.join(getWalletPath(walletAddress), defaults.pathname);
}
export function getReceiptPath(receiptHash, walletAddress) {
	if (walletAddress) {
		return path.join(getReceiptsPath(walletAddress), getReceiptPath(receiptHash));
	}
	return path.join(getReceiptPrefixPath(receiptHash), getReceiptDirectory(receiptHash));
}
export function getReceipt(receiptHash, walletAddress) {
	return path.join(getReceiptPath(receiptHash, walletAddress), receiptBlockFilename);
}
export function getReceiptsPathURL(walletAddress) {
	return path.join(getWalletURL(walletAddress), defaults.urlPathname);
}
export function getReceiptPathURL(receiptHash, walletAddress) {
	return path.join(getReceiptsPathURL(walletAddress), getReceiptPath(receiptHash));
}
export function getReceiptURL(receiptHash, walletAddress) {
	return path.join(getReceiptPathURL(receiptHash, walletAddress), receiptBlockFilename);
}
export function receiptURLToPath(url) {
	if (isNotString(url)) {
		return;
	}
	return walletURLToPath(url).replace(defaults.urlPathnameRegex, defaults.directoryPathname);
}
export function receiptPathToURL(url) {
	if (isNotString(url)) {
		return;
	}
	return walletPathToURL(url).replace(defaults.pathnameRegex, defaults.directoryURLPathname);
}
export async function getReceiptPathFromBlock(block) {
	return getReceiptPath(await block.getHash(), block.getReceiver());
}
export async function getReceiptFromBlock(block) {
	return getReceipt(await block.getHash(), block.getReceiver());
}
export async function getReceiptURLFromBlock(block) {
	return getReceiptURL(await block.getHash(), block.getReceiver());
}
export async function getReceiptPathURLFromBlock(block) {
	return getReceiptPathURL(await block.getHash(), block.getReceiver());
}
export const api = {
	blockFilename: receiptBlockFilename,
	getPrefixPath: getReceiptPrefixPath,
	getDirectory: getReceiptDirectory,
	getFilename: getReceiptFilename,
	get: getReceipt,
	pathToURL: receiptPathToURL,
	getURL: getReceiptURL,
	urlToPath: receiptURLToPath,
	prefixPath: getReceiptPrefixPath,
	getPathURL: getReceiptPathURL,
};
export const blockMethods = {
	getPath() {
		return getReceiptFromBlock(this);
	},
	getDirectory() {
		return getReceiptPathFromBlock(this);
	},
	getDirectoryURL() {
		return getReceiptPathURLFromBlock(this);
	},
	getURL() {
		return getReceiptURLFromBlock(this);
	},
};
export default api;
// const walletBufferex = await viatCipherSuite.createBlockNonce(64);
// const txBufferex = await viatCipherSuite.createBlockNonce(64);
// console.log('getReceiptPath', getReceiptPath(txBufferex, walletBufferex));
// console.log('getReceipt', getReceipt(txBufferex, walletBufferex));
// console.log('getReceiptURL', getReceiptURL(txBufferex, walletBufferex), getReceiptURL(txBufferex, walletBufferex).length);
// console.log(receiptPathToURL(getReceiptPath(txBufferex, walletBufferex)));
// console.log('getReceiptFilename', getReceiptFilename(txBufferex).length);
// console.log('getReceiptPathway', getReceiptPathway(txBufferex).length);
// console.log(toBase64Url(txBufferex));
// console.log('getReceiptDirectory', getReceiptDirectory(walletBufferex).length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(24)).length);
