import blockDefaults from '#viat/blocks/defaults';
import { getPrefixPath } from '#viat/storage/getPrefixPath';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const blockFilename = blockDefaults.genericFilenames.walletGenesis;
export function getWalletGenesisPath(walletAddress) {
	return '/genesisWallet.block';
}
export function getWalletGenesisURL(walletAddress) {
	return '/genesisWallet.block';
}
export const directoryTemplate = {
	wallets: {},
	audits: {},
};
export const blockMethods = {
	getPath() {
		return '/genesisWallet.block';
	},
	getDirectory() {
		return '/';
	},
	getDirectoryURL() {
		return '/';
	},
	getURL() {
		return '/genesisWallet.block';
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
