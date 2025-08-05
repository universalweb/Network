import { getFinalDirectory, getPrefixPath, getShortPrefixPath } from '../../files/getPrefixPath.js';
import {
	getWalletPath,
	getWalletURL,
	walletPathToURL,
	walletURLToPath,
} from '../wallet/uri.js';
import blockDefaults from '../defaults.js';
import defaults from './defaults.js';
import { isNotString } from '@universalweb/utilitylib';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// Consider Short URL which uses a "proxy trie" (Shortcut symlink to actual) that uses the 64 byte hash like a wallet trie to map to a wallet folder then the proof.
export const proofBlockFilename = blockDefaults.genericFilenames.proof;
export function getProofPrefixPath(proofHash) {
	return getShortPrefixPath(proofHash);
}
export function getProofDirectory(proofHash) {
	return getFinalDirectory(proofHash);
}
export function getProofFilename(proofHash) {
	const address = (proofHash) ? toBase64Url(proofHash) : proofBlockFilename;
	return address;
}
export function getProofsPath(walletAddress) {
	return path.join(getWalletPath(walletAddress), defaults.pathname);
}
export function getProofPath(proofHash, walletAddress) {
	if (walletAddress) {
		return path.join(getProofsPath(walletAddress), getProofPath(proofHash));
	}
	return path.join(getProofPrefixPath(proofHash), getProofDirectory(proofHash));
}
export function getProof(proofHash, walletAddress) {
	return path.join(getProofPath(proofHash, walletAddress), proofBlockFilename);
}
export function getProofsURL(walletAddress) {
	return path.join(getWalletURL(walletAddress), defaults.urlPathname);
}
export function getProofPathURL(proofHash, walletAddress) {
	return path.join(getProofsURL(walletAddress), getProofPath(proofHash));
}
export function getProofURL(proofHash, walletAddress) {
	return path.join(getProofPathURL(proofHash, walletAddress), proofBlockFilename);
}
export function proofURLToPath(url) {
	if (isNotString(url)) {
		return;
	}
	return walletURLToPath(url).replace(defaults.urlPathnameRegex, defaults.directoryPathname);
}
export function proofPathToURL(url) {
	if (isNotString(url)) {
		return;
	}
	return walletPathToURL(url).replace(defaults.pathnameRegex, defaults.directoryURLPathname);
}
export async function getProofPathFromBlock(block) {
	return getProofPath(await block.getHash(), block.getSender());
}
export async function getProofFromBlock(block) {
	return getProof(await block.getHash(), block.getSender());
}
export async function getProofURLFromBlock(block) {
	return getProofURL(await block.getHash(), block.getSender());
}
export async function getProofPathURLFromBlock(block) {
	return getProofPathURL(await block.getHash(), block.getSender());
}
export const directoryTemplate = {
	// confirmations: {},
	verifications: {},
};
export const api = {
	blockFilename: proofBlockFilename,
	getPrefixPath: getProofPrefixPath,
	getDirectory: getProofDirectory,
	getFilename: getProofFilename,
	get: getProof,
	pathToURL: proofPathToURL,
	getURL: getProofURL,
	urlToPath: proofURLToPath,
	prefixPath: getProofPrefixPath,
	directoryTemplate,
};
export const blockMethods = {
	getPath() {
		return getProofFromBlock(this);
	},
	getDirectory() {
		return getProofPathFromBlock(this);
	},
	getDirectoryURL() {
		return getProofPathURLFromBlock(this);
	},
	getURL() {
		return getProofURLFromBlock(this);
	},
};
export default api;
// const walletBufferex = await viatCipherSuite.createBlockNonce(64);
// const txBufferex = await viatCipherSuite.createBlockNonce(64);
// console.log('getProofsPath', getProofsPath(walletBufferex));
// console.log('getProofPath', getProofPath(txBufferex, walletBufferex));
// console.log('getProof', getProof(txBufferex, walletBufferex));
// console.log('getProofURL', getProofURL(txBufferex, walletBufferex), getProofURL(txBufferex, walletBufferex).length);
// console.log('proofPathToURL', proofPathToURL(getProofPath(txBufferex, walletBufferex)));
// console.log('getProofFilename', getProofFilename(txBufferex).length);
// console.log('getProofPathway', getProofPathway(txBufferex).length);
// console.log(toBase64Url(txBufferex));
// console.log('getProofDirectory', getProofDirectory(walletBufferex).length);
// console.log(toBase64Url(viatCipherSuite.createBlockNonce(24)).length);
