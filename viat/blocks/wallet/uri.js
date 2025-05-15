import api from './defaults.js';
import { getFolderPath } from '../../files/getAddressDirectoryPath.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
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
export function getWalletFilePath(walletAddressBuffer) {
	return path.join(api.pathname, getWalletPath(walletAddressBuffer));
}
export function getWalletURL(walletAddressBuffer) {
	return path.join(api.urlPathname, getWalletPath(walletAddressBuffer));
}
export function walletURLToFilePath(url) {
	return url.replace(api.urlPathnameRegex, api.directoryPathname);
}
export function walletFilePathToURL(url) {
	return url.replace(api.pathnameRegex, api.directoryURLPathname);
}
// const walletAddressBufferex = viatCipherSuite.createBlockNonce(64);
// const example = getWalletFilePath(walletAddressBufferex);
// console.log(example, walletFilePathToURL(example));
// console.log(example);
// console.log(getWalletURL(walletAddressBufferex));
// console.log('getPathFromAddress', example, example.length);
