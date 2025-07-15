import blockDefaults from '../defaults.js';
import { getPrefixPath } from '../../files/getPrefixPath.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const blockFilename = blockDefaults.genericFilenames.walletGenesis;
export function getWalletGenesisPath(walletAddress) {
	return '/wallets/';
}
export function getWalletGenesisURL(walletAddress) {
	return '/wallets/';
}
export const directoryTemplate = {
	wallets: {},
	audits: {},
};
export const blockMethods = {
	getPath(prepend = '', append = '') {
		return path.join(prepend, '/wallets/', append);
	},
	getDirectory(prepend = '', append = '') {
		return path.join(prepend, '/wallets/', append);
	},
	getDirectoryURL(prepend = '', append = '') {
		return path.join(prepend, '/wallets/', append);
	},
	getURL(prepend = '', append = '') {
		return path.join(prepend, '/wallets/', append);
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
// console.log(walletAddressex.slice(40).length);
