import { getWalletPath, getWalletURL } from './wallet.js';
import { toBase64, toBase64Url } from '#crypto/utils.js';
import { getFolderPath } from './getAddressDirectoryPath.js';
import path from 'path';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export function getTransactionFolderPath(walletAddressBuffer) {
	return getFolderPath(walletAddressBuffer, 1, 2);
}
export function getLastTransactionPath(transactionIDBuffer) {
	const address = toBase64Url(transactionIDBuffer.slice(2));
	return address;
}
export function getTransactionPath(transactionIDBuffer, walletAddressBuffer) {
	if (walletAddressBuffer) {
		return path.join(getWalletPath(walletAddressBuffer), 't', getTransactionFolderPath(transactionIDBuffer), toBase64Url(transactionIDBuffer));
	}
	return path.join(getTransactionFolderPath(transactionIDBuffer), getLastTransactionPath(transactionIDBuffer));
}
export function getTransactionURL(transactionIDBuffer, walletAddressBuffer) {
	return path.join(getWalletURL(walletAddressBuffer), 't', getTransactionPath(transactionIDBuffer));
}
const walletBufferex = viatCipherSuite.createBlockNonce(64);
const txBufferex = viatCipherSuite.createBlockNonce(32);
const example = getWalletPath(walletBufferex);
const example2 = getTransactionURL(txBufferex, walletBufferex);
console.log(toBase64Url(viatCipherSuite.createBlockNonce(32)).length);
console.log(example);
console.log(example2);
console.log(toBase64Url(txBufferex));
// console.log(toBase64Url(walletBufferex));
// console.log('getPathFromAddress', example, example.length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(3)));
