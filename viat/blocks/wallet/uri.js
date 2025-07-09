import blockDefaults from '../defaults.js';
import { getPrefixPath } from '../../files/getPrefixPath.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import transactionDefaults from './defaults.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const walletBlockFilename = blockDefaults.genericFilenames.wallet;
export function getWalletPrefixPath(walletAddress) {
	return getPrefixPath(walletAddress, 3, 6);
}
export function getWalletDirectory(walletAddress) {
	const address = toBase64Url(walletAddress.slice(40));
	return address;
}
export function getWalletFilename(walletAddress) {
	const address = (walletAddress) ? toBase64Url(walletAddress) : walletBlockFilename;
	return address;
}
export function getWalletPathway(walletAddress) {
	return path.join(getWalletPrefixPath(walletAddress), getWalletDirectory(walletAddress));
}
export function getWalletPath(walletAddress) {
	return path.join(transactionDefaults.pathname, getWalletPathway(walletAddress));
}
export function getWallet(walletAddress) {
	return path.join(getWalletPath(walletAddress), walletBlockFilename);
}
export function walletPathToURL(url) {
	return url.replace(transactionDefaults.pathnameRegex, transactionDefaults.directoryURLPathname);
}
export function getWalletPathURL(walletAddress) {
	return path.join(transactionDefaults.urlPathname, getWalletPathway(walletAddress));
}
export function getWalletURL(walletAddress) {
	return path.join(getWalletPathURL(walletAddress), walletBlockFilename);
}
export function walletURLToPath(url) {
	return url.replace(transactionDefaults.urlPathnameRegex, transactionDefaults.directoryPathname);
}
export const directoryTemplate = {
	transactions: {},
	receipts: {},
	state: {},
	data: {},
};
export async function getWalletPathFromBlock(block) {
	return getWalletPath(await block.getAddress());
}
export async function getWalletFromBlock(block) {
	return getWallet(await block.getAddress());
}
export async function getWalletURLFromBlock(block) {
	return getWalletURL(await block.getAddress());
}
export async function getWalletPathURLFromBlock(block) {
	return getWalletPathURL(await block.getAddress());
}
export const blockMethods = {
	getPath() {
		return getWalletFromBlock(this);
	},
	getDirectory() {
		return getWalletPathFromBlock(this);
	},
	getDirectoryURL() {
		return getWalletPathURLFromBlock(this);
	},
	getURL() {
		return getWalletURLFromBlock(this);
	},
};
export const api = {
	blockFilename: walletBlockFilename,
	getPrefixPath: getWalletPrefixPath,
	getDirectory: getWalletDirectory,
	getFilename: getWalletFilename,
	getPathway: getWalletPathway,
	get: getWallet,
	pathToURL: walletPathToURL,
	getURL: getWalletURL,
	getBlockURL: getWalletURL,
	urlToPath: walletURLToPath,
	prefixPath: getWalletPrefixPath,
	directoryTemplate,
};
export default api;
// const walletAddressex = viatCipherSuite.createBlockNonce(64);
// console.log('getWalletURL', getWalletURL(walletAddressex));
// console.log('getWallet', getWallet(walletAddressex), getWallet(walletAddressex).length);
// console.log('getWalletBlock', getWalletBlock(walletAddressex), getWalletBlock(walletAddressex).length);
// console.log('getWalletPathway', getWalletPathway(walletAddressex), getWalletPathway(walletAddressex).length);
// console.log('getWalletDirectory', getWalletDirectory(walletAddressex), getWalletDirectory(walletAddressex).length);
// console.log('getWalletBlockURL', getWalletBlockURL(walletAddressex), getWalletBlockURL(walletAddressex).length);
// console.log(walletAddressex.slice(40).length);
