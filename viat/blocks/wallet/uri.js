import blockDefaults from '../defaults.js';
import { getPrefixPath } from '../../files/getPrefixPath.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import transactionDefaults from './defaults.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const walletBlockFilename = blockDefaults.genericFilenames.wallet;
export function getWalletPrefixPath(walletAddressBuffer) {
	return getPrefixPath(walletAddressBuffer, 3, 6);
}
export function getWalletDirectory(walletAddressBuffer) {
	const address = toBase64Url(walletAddressBuffer.slice(40));
	return address;
}
export function getWalletFilename(walletAddressBuffer) {
	const address = (walletAddressBuffer) ? toBase64Url(walletAddressBuffer) : walletBlockFilename;
	return address;
}
export function getWalletPathway(walletAddressBuffer) {
	return path.join(getWalletPrefixPath(walletAddressBuffer), getWalletDirectory(walletAddressBuffer));
}
export function getWalletPath(walletAddressBuffer) {
	return path.join(transactionDefaults.pathname, getWalletPathway(walletAddressBuffer));
}
export function getWallet(walletAddressBuffer) {
	return path.join(getWalletPath(walletAddressBuffer), walletBlockFilename);
}
export function walletPathToURL(url) {
	return url.replace(transactionDefaults.pathnameRegex, transactionDefaults.directoryURLPathname);
}
export function getWalletURL(walletAddressBuffer) {
	return path.join(transactionDefaults.urlPathname, getWalletPathway(walletAddressBuffer));
}
export function getWalletBlockURL(walletAddressBuffer) {
	return path.join(getWalletURL(walletAddressBuffer), walletBlockFilename);
}
export function walletURLToPath(url) {
	return url.replace(transactionDefaults.urlPathnameRegex, transactionDefaults.directoryPathname);
}
export const api = {
	walletBlockFilename,
	getWalletPrefixPath,
	getWalletDirectory,
	getWalletFilename,
	getWalletPathway,
	getWallet,
	walletPathToURL,
	getWalletURL,
	getWalletBlockURL,
	walletURLToPath,
	getPrefixPath,
};
export default api;
const walletAddressBufferex = viatCipherSuite.createBlockNonce(64);
// console.log('getWalletURL', getWalletURL(walletAddressBufferex));
// console.log('getWallet', getWallet(walletAddressBufferex), getWallet(walletAddressBufferex).length);
// console.log('getWalletBlock', getWalletBlock(walletAddressBufferex), getWalletBlock(walletAddressBufferex).length);
// console.log('getWalletPathway', getWalletPathway(walletAddressBufferex), getWalletPathway(walletAddressBufferex).length);
// console.log('getWalletDirectory', getWalletDirectory(walletAddressBufferex), getWalletDirectory(walletAddressBufferex).length);
// console.log('getWalletBlockURL', getWalletBlockURL(walletAddressBufferex), getWalletBlockURL(walletAddressBufferex).length);
// console.log(walletAddressBufferex.slice(40).length);
