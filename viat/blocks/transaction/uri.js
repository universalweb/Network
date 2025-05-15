import {
	getWalletFilePath,
	getWalletPath,
	getWalletURL,
	walletFilePathToURL,
	walletURLToFilePath
} from '../wallet/uri.js';
import { toBase64, toBase64Url } from '#crypto/utils.js';
import api from './defaults.js';
import { getFolderPath } from '../../files/getAddressDirectoryPath.js';
import { isNotString } from '@universalweb/acid';
import path from 'path';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export function getTransactionFolderPath(walletAddressBuffer) {
	return getFolderPath(walletAddressBuffer, 1, 2);
}
export function getLastTransactionPath(transactionIDBuffer) {
	const address = toBase64Url(transactionIDBuffer.slice(2));
	return address;
}
export function getTransactionPath(transactionIDBuffer) {
	return path.join(getTransactionFolderPath(transactionIDBuffer), getLastTransactionPath(transactionIDBuffer));
}
export function getTransactionFilePath(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getWalletFilePath(walletAddressBuffer), api.pathname, getTransactionPath(transactionIDBuffer));
}
export function getTransactionURL(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getWalletURL(walletAddressBuffer), api.urlPathname, getTransactionPath(transactionIDBuffer));
}
export function transactionURLToFilePath(url) {
	if (isNotString(url)) {
		return;
	}
	return walletURLToFilePath(url).replace(api.urlPathnameRegex, api.directoryPathname);
}
export function transactionFilePathToURL(url) {
	if (isNotString(url)) {
		return;
	}
	return walletFilePathToURL(url).replace(api.pathnameRegex, api.directoryURLPathname);
}
// const walletBufferex = viatCipherSuite.createBlockNonce(64);
// const txBufferex = viatCipherSuite.createBlockNonce(32);
// console.log(getTransactionPath(txBufferex));
// console.log(getTransactionFilePath(txBufferex, walletBufferex));
// console.log(getTransactionURL(txBufferex, walletBufferex));
// console.log(transactionFilePathToURL(getTransactionFilePath(txBufferex, walletBufferex)));
// console.log(toBase64Url(txBufferex));
// console.log(toBase64Url(walletBufferex));
// console.log('getPathFromAddress', example, example.length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(32)).length);
