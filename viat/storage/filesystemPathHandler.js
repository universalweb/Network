import {
	blockTypes,
	filePaths,
	genericFilenames,
	letters,
	typeNames,
	typeNamesPlural,
	urlPaths,
	walletTypes,
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
			startIndex: 32 - 12,
			encoding: encodingTypes.base38,
		},
	});
	merge(baseConfig, config);
	return baseConfig;
}
const template = {
	wallet: createBlockPathConfig({
		typeName: typeNames.wallet,
		typeNamePlural: typeNamesPlural.wallet,
		uniquePath: {
			startIndex: walletTypes.wallet.size - 12,
			encoding: encodingTypes.base38,
		},
	}),
	hybridWallet: createBlockPathConfig({
		typeName: typeNames.hybridWallet,
		typeNamePlural: typeNamesPlural.hybridWallet,
		uniquePath: {
			startIndex: walletTypes.hybridWallet.size - 12,
			encoding: encodingTypes.base38,
		},
	}),
	quantumWallet: createBlockPathConfig({
		typeName: typeNames.quantumWallet,
		typeNamePlural: typeNamesPlural.quantumWallet,
		uniquePath: {
			startIndex: walletTypes.quantumWallet.size - 12,
			encoding: encodingTypes.base38,
		},
	}),
	transaction: createSlaveBlockPathConfig({
		typeName: typeNames.transaction,
		typeNamePlural: typeNamesPlural.transaction,
	}),
	receipt: createSlaveBlockPathConfig({
		typeName: typeNames.receipt,
		typeNamePlural: typeNamesPlural.receipt,
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
		this.typeID = blockTypes[typeName];
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
	getFileURL(hash) {
		return path.join(this.getURL(hash), this.filename);
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
		this.hybridWallet = new BlockPathHandler(this.config.hybridWallet);
		this.quantumWallet = new BlockPathHandler(this.config.quantumWallet);
		this.transaction = new BlockPathHandler(this.config.transaction);
		this.receipt = new BlockPathHandler(this.config.receipt);
	}
	async getBlockPath(source) {
		switch (source.blockType) {
			case blockTypes.transaction: {
				return this.getTransactionDirectory(await source.getHash(), await source.getSender());
			}
			case blockTypes.receipt: {
				return this.getReceiptDirectory(await source.getTransaction(), await source.getReceiver());
			}
			case blockTypes.wallet: {
				return this.getWallet(await source.getAddress());
			}
			case blockTypes.hybridWallet: {
				return this.getWallet(await source.getAddress());
			}
			case blockTypes.quantumWallet: {
				return this.getWallet(await source.getAddress());
			}
			default: {
				break;
			}
		}
	}
	async getBlockFile(source) {
		switch (source.blockType) {
			case blockTypes.transaction:
				return this.getTransactionBlock(await source.getHash(), await source.getSender());
			case blockTypes.receipt:
				return this.getReceiptBlock(await source.getTransaction(), await source.getReceiver());
			case blockTypes.wallet:
				return this.getWallet(await source.getAddress());
			case blockTypes.quantumWallet:
				return this.getWallet(await source.getAddress());
			case blockTypes.hybridWallet:
				return this.getWallet(await source.getAddress());
			default:
				break;
		}
	}
	async getFile(blockType, hash) {
		// TODO: USE INTS
		switch (blockType) {
			case blockTypes.transaction:
				return this.transaction.getFile(hash);
			case blockTypes.receipt:
				return this.receipt.getFile(hash);
			case blockTypes.wallet:
				return this.wallet.getFile(hash);
			case blockTypes.quantumWallet:
				return this.quantumWallet.getFile(hash);
			case blockTypes.hybridWallet:
				return this.hybridWallet.getFile(hash);
			default:
				break;
		}
	}
	async getTransactionDirectory(hash, walletAddress) {
		const transactionPath = await this.transaction.getFullPath(hash);
		if (walletAddress) {
			return path.join(await this.getWallet(walletAddress), transactionPath);
		}
		return transactionPath;
	}
	async getTransactionBlock(hash, walletAddress) {
		const transactionPath = await this.getTransactionDirectory(hash, walletAddress);
		return path.join(transactionPath, this.transaction.filename);
	}
	async getReceiptDirectory(hash, receiverAddress) {
		const receiptPath = await this.receipt.getFullPath(hash);
		if (receiverAddress) {
			return path.join(await this.getWallet(receiverAddress), receiptPath);
		}
		return receiptPath;
	}
	async getReceiptBlock(hash, receiverAddress) {
		const receiptPath = await this.getReceiptDirectory(hash, receiverAddress);
		return path.join(receiptPath, this.receipt.filename);
	}
	async getWallet(walletAddress) {
		const walletSize = walletAddress.length;
		// console.log('Wallet Size:', walletSize);
		if (walletSize === 20) {
			// Handle 20-byte wallet addresses
			return this.wallet.getFullPath(walletAddress);
		} else if (walletSize === 32) {
			// Handle 32-byte wallet addresses
			return this.hybridWallet.getFullPath(walletAddress);
		} else if (walletSize === 64) {
			// Handle 64-byte wallet addresses
			return this.quantumWallet.getFullPath(walletAddress);
		} else {
			return;
		}
	}
}
export async function filesystemPathHandler(...args) {
	const handler = new FilesystemPathHandler(...args);
	return handler;
}
export default FilesystemPathHandler;
// const defaultFilesystemConfig = await filesystemPathHandler('generic', {});
// console.log(defaultFilesystemConfig);
// const example64 = await viatCipherSuite.createBlockNonce(64);
// const example32 = await viatCipherSuite.createBlockNonce(32);
// const example20 = await viatCipherSuite.createBlockNonce(20);
// console.log(await defaultFilesystemConfig.getWallet(example64));
// console.log(await defaultFilesystemConfig.getWallet(example32));
// console.log(await defaultFilesystemConfig.getWallet(example20));
