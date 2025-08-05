import { getFinalDirectory, getPrefixPath, getShortPrefixPath } from '../../files/getPrefixPath.js';
import {
	getWalletPath,
	getWalletURL,
	walletPathToURL,
	walletURLToPath,
} from '../wallet/uri.js';
import blockDefaults from '../defaults.js';
import defaults from './defaults.js';
import { isNotString } from '@universalweb/utilitylib';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// Consider Short URL which uses a "proxy trie" (Shortcut symlink to actual) that uses the 64 byte hash like a wallet trie to map to a wallet folder then the transaction.
export const transactionBlockFilename = blockDefaults.genericFilenames.transaction;
export function getTransactionPrefixPath(transactionHash) {
	return getShortPrefixPath(transactionHash);
}
export function getTransactionDirectory(transactionHash) {
	return getFinalDirectory(transactionHash);
}
export function getTransactionFilename(transactionHash) {
	const address = (transactionHash) ? toBase64Url(transactionHash) : transactionBlockFilename;
	return address;
}
export function getTransactionsPath(walletAddress) {
	return path.join(getWalletPath(walletAddress), defaults.pathname);
}
export function getTransactionPath(transactionHash, walletAddress) {
	if (walletAddress) {
		return path.join(getTransactionsPath(walletAddress), getTransactionPath(transactionHash));
	}
	return path.join(getTransactionPrefixPath(transactionHash), getTransactionDirectory(transactionHash));
}
export function getTransaction(transactionHash, walletAddress) {
	return path.join(getTransactionPath(transactionHash, walletAddress), transactionBlockFilename);
}
export function getTransactionsURL(walletAddress) {
	return path.join(getWalletURL(walletAddress), defaults.urlPathname);
}
export function getTransactionPathURL(transactionHash, walletAddress) {
	return path.join(getTransactionsURL(walletAddress), getTransactionPath(transactionHash));
}
export function getTransactionURL(transactionHash, walletAddress) {
	return path.join(getTransactionPathURL(transactionHash, walletAddress), transactionBlockFilename);
}
export function transactionURLToPath(url) {
	if (isNotString(url)) {
		return;
	}
	return walletURLToPath(url).replace(defaults.urlPathnameRegex, defaults.directoryPathname);
}
export function transactionPathToURL(url) {
	if (isNotString(url)) {
		return;
	}
	return walletPathToURL(url).replace(defaults.pathnameRegex, defaults.directoryURLPathname);
}
export async function getTransactionPathFromBlock(block) {
	return getTransactionPath(await block.getHash(), block.getSender());
}
export async function getTransactionFromBlock(block) {
	return getTransaction(await block.getHash(), block.getSender());
}
export async function getTransactionURLFromBlock(block) {
	return getTransactionURL(await block.getHash(), block.getSender());
}
export async function getTransactionPathURLFromBlock(block) {
	return getTransactionPathURL(await block.getHash(), block.getSender());
}
export const directoryTemplate = {
	// confirmations: {},
	verifications: {},
};
export const api = {
	blockFilename: transactionBlockFilename,
	getPrefixPath: getTransactionPrefixPath,
	getDirectory: getTransactionDirectory,
	getFilename: getTransactionFilename,
	get: getTransaction,
	pathToURL: transactionPathToURL,
	getURL: getTransactionURL,
	urlToPath: transactionURLToPath,
	prefixPath: getTransactionPrefixPath,
	directoryTemplate,
};
export const blockMethods = {
	getPath() {
		return getTransactionFromBlock(this);
	},
	getDirectory() {
		return getTransactionPathFromBlock(this);
	},
	getDirectoryURL() {
		return getTransactionPathURLFromBlock(this);
	},
	getURL() {
		return getTransactionURLFromBlock(this);
	},
};
export default api;
// const walletBufferex = await viatCipherSuite.createBlockNonce(64);
// const txBufferex = await viatCipherSuite.createBlockNonce(64);
// console.log('getTransactionsPath', getTransactionsPath(walletBufferex));
// console.log('getTransactionPath', getTransactionPath(txBufferex, walletBufferex));
// console.log('getTransaction', getTransaction(txBufferex, walletBufferex));
// console.log('getTransactionURL', getTransactionURL(txBufferex, walletBufferex), getTransactionURL(txBufferex, walletBufferex).length);
// console.log('transactionPathToURL', transactionPathToURL(getTransactionPath(txBufferex, walletBufferex)));
// console.log('getTransactionFilename', getTransactionFilename(txBufferex).length);
// console.log('getTransactionPathway', getTransactionPathway(txBufferex).length);
// console.log(toBase64Url(txBufferex));
// console.log('getTransactionDirectory', getTransactionDirectory(walletBufferex).length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(24)).length);
