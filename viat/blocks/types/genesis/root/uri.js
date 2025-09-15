import blockDefaults from '#viat/blocks/defaults';
import { getPrefixPath } from '#viat/storage/getPrefixPath';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const blockFilename = blockDefaults.genericFilenames.genesis;
export function getGenesisPath(walletAddress) {
	return '/genesis.block';
}
export function getGenesisURL(walletAddress) {
	return '/genesis.block';
}
export const directoryTemplate = {
	wallets: {},
	audits: {},
};
export const blockMethods = {
	getPath() {
		return '/genesis.block';
	},
	getDirectory() {
		return '/';
	},
	getDirectoryURL() {
		return '/';
	},
	getURL() {
		return '/genesis.block';
	},
};
export const api = {
	blockFilename,
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
// console.log(walletAddressex.subarray(40).length);
