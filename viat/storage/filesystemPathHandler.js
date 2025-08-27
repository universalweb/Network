import {
	filePaths, genericFilenames, letters, urlPaths,
} from '../blocks/defaults.js';
import { getFinalDirectoryGenerator, getPrefixPathGenerator } from './getPrefixPath.js';
import base38 from './base38.js';
import { encodingTypes } from './encodingTypes.js';
import { merge } from '@universalweb/utilitylib';
import path from 'path';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export function createBlockPathConfig(config) {
	const templateConfig = {
		typeName: 'generic',
		typeNamePlural: 'generics',
		pathPrefix: {
			size: 1,
			depth: 3,
			encoding: encodingTypes.hex,
		},
		uniquePath: {
			sizeOptions: [
				12, 16, 18, 24, 26,
			],
			size: 16,
			startIndex: 64 - 16,
			encoding: encodingTypes.base38,
		},
	};
	merge(templateConfig, config);
	return templateConfig;
}
export function createSlaveBlockPathConfig(config) {
	const baseConfig = createBlockPathConfig({
		pathPrefix: {
			size: 1,
			depth: 2,
			encoding: encodingTypes.hex,
		},
		uniquePath: {
			sizeOptions: [
				12, 16, 18, 24, 26,
			],
			size: 12,
			startIndex: 64 - 12,
			encoding: encodingTypes.base38,
		},
	});
	merge(baseConfig, config);
	return baseConfig;
}
const template = {
	wallet: createBlockPathConfig({
		typeName: 'wallet',
		typeNamePlural: 'wallets',
	}),
	transaction: createSlaveBlockPathConfig({
		typeName: 'transaction',
		typeNamePlural: 'transactions',
	}),
	receipt: createSlaveBlockPathConfig({
		typeName: 'receipt',
		typeNamePlural: 'receipts',
	}),
	proof: createSlaveBlockPathConfig({
		typeName: 'proof',
		typeNamePlural: 'proofs',
	}),
};
class BlockPathHandler {
	constructor(config) {
		const {
			typeName,
			typeNamePlural,
			letter,
		} = config;
		this.urlPath = urlPaths[typeName];
		this.filePath = filePaths[typeName];
		this.letter = letters[typeName];
		this.filename = genericFilenames[typeName];
		if (this.letter) {
			this.urlPathnameRegex = new RegExp(`/${this.letter}/`);
		}
		if (typeNamePlural) {
			this.typeNamePlural = typeNamePlural;
			this.pathnameRegex = new RegExp(`/${this.typeNamePlural}/`);
		}
		this.typeName = typeName;
		if (config.pathPrefix) {
			this.pathPrefix = config.pathPrefix;
		}
		if (config.uniquePath) {
			this.uniquePath = config.uniquePath;
		}
		if (this.pathPrefix) {
			this.getPathPrefix = getPrefixPathGenerator(this.pathPrefix.size, this.pathPrefix.depth, this.pathPrefix.encoding.encode);
		}
		if (this.uniquePath) {
			this.getUniquePath = getFinalDirectoryGenerator(this.uniquePath.startIndex, this.uniquePath.endIndex, this.uniquePath.encoding.encode);
		}
	}
	getFullPath(hash) {
		return path.join(this.filePath, this.getPathPrefix(hash), this.getUniquePath(hash));
	}
	getURL(hash) {
		return path.join(this.urlPath, this.getPathPrefix(hash), this.getUniquePath(hash));
	}
	getFile(hash) {
		return path.join(this.getFullPath(hash), this.filename);
	}
}
class FilesystemPathHandler {
	constructor(typeName = 'generic', config) {
		this.typeName = typeName;
		const target = {};
		merge(target, template);
		merge(target, config);
		this.config = target;
		this.wallet = new BlockPathHandler(this.config.wallet);
		this.transaction = new BlockPathHandler(this.config.transaction);
	}
	async getBlockPath(source) {
		switch (source.blockType) {
			case source.transaction: {
				this.getTransaction(await source.getHash(), await source.getSender());
				break;
			}
			case source.receipt: {
				this.getReceipt(await source.getHash(), await source.getReceiver());
				break;
			}
			case source.proof: {
				this.getProof(await source.getHash(), await source.getSender());
				break;
			}
			default: {
				break;
			}
		}
	}
	async getBlockFile(source) {
		return this.getFile(source.getType(), await source.getHash());
	}
	async getFile(blockType, hash) {
		switch (blockType) {
			case 'transaction':
				return this.transaction.getFile(hash);
			case 'receipt':
				return this.receipt.getFile(hash);
			case 'proof':
				return this.proof.getFile(hash);
			default:
				break;
		}
	}
	async getTransaction(hash, walletAddress) {
		const transactionPath = await this.transaction.getFullPath(hash);
		if (walletAddress) {
			return path.join(await this.wallet.getFullPath(walletAddress), transactionPath);
		}
		return transactionPath;
	}
	async getReceipt(hash, walletAddress) {
		const receiptPath = await this.receipt.getFullPath(hash);
		if (walletAddress) {
			return path.join(await this.wallet.getFullPath(walletAddress), receiptPath);
		}
		return receiptPath;
	}
	async getProof(hash, walletAddress) {
		const proofPath = await this.proof.getFullPath(hash);
		if (walletAddress) {
			return path.join(await this.wallet.getFullPath(walletAddress), proofPath);
		}
		return proofPath;
	}
}
export async function filesystemPathHandler(...args) {
	const handler = new FilesystemPathHandler(...args);
	return handler;
}
export default FilesystemPathHandler;
const defaultFilesystemConfig = await filesystemPathHandler('generic', {});
console.log(defaultFilesystemConfig);
const txBufferex = await viatCipherSuite.createBlockNonce(64);
console.log(await defaultFilesystemConfig.getTransaction(txBufferex));
