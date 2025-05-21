import {
	getWallet,
	getWalletURL,
	walletPathToURL,
	walletURLToPath
} from '../wallet/uri.js';
import api from './defaults.js';
import blockDefaults from '../defaults.js';
import { getPrefixPath } from '../../files/getPrefixPath.js';
import { isNotString } from '@universalweb/acid';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// Consider Short URL which uses a "proxy trie" (Shortcut symlink to actual) that uses the 64 byte hash like a wallet trie to map to a wallet folder then the transaction.
export const transactionBlockFilename = blockDefaults.genericFilenames.transaction;
export function getTransactionPrefixPath(walletAddressBuffer) {
	return getPrefixPath(walletAddressBuffer, 1, 2);
}
export function getTransactionDirectory(transactionIDBuffer) {
	const address = toBase64Url(transactionIDBuffer.slice(40));
	return address;
}
export function getTransactionFilename(transactionIDBuffer) {
	const address = (transactionIDBuffer) ? toBase64Url(transactionIDBuffer) : transactionBlockFilename;
	return address;
}
export function getTransactionPathway(transactionIDBuffer) {
	return path.join(getTransactionPrefixPath(transactionIDBuffer), getTransactionDirectory(transactionIDBuffer));
}
export function getTransactionPath(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getWallet(walletAddressBuffer), api.pathname, getTransactionPathway(transactionIDBuffer));
}
export function getTransaction(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getTransactionPath(transactionIDBuffer, walletAddressBuffer), transactionBlockFilename);
}
export function getTransactionPathURL(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getWalletURL(walletAddressBuffer), api.urlPathname, getTransactionPathway(transactionIDBuffer));
}
export function getTransactionURL(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getTransactionPathURL(transactionIDBuffer, walletAddressBuffer), transactionBlockFilename);
}
export function transactionURLToPath(url) {
	if (isNotString(url)) {
		return;
	}
	return walletURLToPath(url).replace(api.urlPathnameRegex, api.directoryPathname);
}
export function transactionPathToURL(url) {
	if (isNotString(url)) {
		return;
	}
	return walletPathToURL(url).replace(api.pathnameRegex, api.directoryURLPathname);
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
// const walletBufferex = await viatCipherSuite.createBlockNonce(64);
// const txBufferex = await viatCipherSuite.createBlockNonce(64);
// console.log(getTransactionPath(txBufferex, walletBufferex));
// console.log(getTransaction(txBufferex, walletBufferex));
// console.log('getTransactionURL', getTransactionURL(txBufferex, walletBufferex), getTransactionURL(txBufferex, walletBufferex).length);
// console.log(transactionPathToURL(getTransactionPath(txBufferex, walletBufferex)));
// console.log('getTransactionFilename', getTransactionFilename(txBufferex).length);
// console.log('getTransactionPathway', getTransactionPathway(txBufferex).length);
// console.log(toBase64Url(txBufferex));
// console.log('getTransactionDirectory', getTransactionDirectory(walletBufferex).length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(24)).length);
