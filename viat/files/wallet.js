import { getFolderPath } from './getAddressDirectoryPath.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
export function getWalletFolderPath(walletAddressBuffer) {
	return getFolderPath(walletAddressBuffer, 3, 6);
}
export function getLastWalletPath(walletAddressBuffer) {
	const address = toBase64Url(walletAddressBuffer.slice(32));
	return address;
}
export function getWalletPath(walletAddressBuffer) {
	return path.join(getWalletFolderPath(walletAddressBuffer), getLastWalletPath(walletAddressBuffer));
}
export function getWalletURL(walletAddressBuffer) {
	const address = toBase64Url(walletAddressBuffer.slice(32));
	return path.join('w/', getWalletPath(walletAddressBuffer));
}
// const walletAddressBufferex = viatCipherSuite.createBlockNonce(64);
// const example = getWalletPath(walletAddressBufferex);
// console.log(example);
// console.log(toBase64Url(walletAddressBufferex));
// console.log('getPathFromAddress', example, example.length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(3)));
