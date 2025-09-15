import {
	blockTypes,
	fileExtensions,
	genericFilenames,
	hashSizes,
	nonceSizes,
	version,
} from './defaults.js';
import { construct, extendClass, getConstructorName } from '@universalweb/utilitylib';
import accessorMethods from './methods/accessors.js';
import configMethods from './methods/config.js';
import defaultsMethods from './methods/defaults.js';
import exportMethods from './methods/export.js';
import filesystemMethods from './methods/filesystem.js';
import { filesystemTypes } from '../storage/filesystems.js';
import { getParentClassName } from '#utilities/class';
import { hash512SettingsCrypto } from '#utilities/cryptography/utils';
import hashingMethods from './methods/hashing.js';
import logMethods from '#utilities/logs/classLogMethods';
import signatureMethods from './methods/signature.js';
import validateMethods from './methods/validate.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import wallet from '#viat/wallet/wallet';
export class Block {
	constructor(config) {
		return this;
	}
	async initialize(data, config, ...args) {
		this.blockType = blockTypes[this.typeName];
		this.fileType = fileExtensions[this.typeName];
		this.filename = genericFilenames[this.typeName];
		this.filesystem = this.filesystemConfig[this.typeName];
		if (data) {
			if (getParentClassName(data) === 'Block') {
				await this.configByBlock(data, config, ...args);
			} else if (getConstructorName(data) === 'Wallet') {
				await this.configByWallet(data, config, ...args);
			} else {
				await this.config(data, config, ...args);
			}
		}
		return this;
	}
	async finalize() {
		await this.setDefaults();
		await this.setHash();
		return this;
	}
	version = version;
	typeName = 'generic';
	blockType = blockTypes.generic;
	fileType = fileExtensions.generic;
	filename = genericFilenames.generic;
	cipherSuite = viatCipherSuite;
	nonceSize = nonceSizes.generic;
	hashSize = hashSizes.generic;
	hashXOFConfig = hash512SettingsCrypto;
	block = {
		data: {
			meta: {},
			core: {},
		},
	};
	getType() {
		return this.getMeta('type') || this.blockType;
	}
	async getFilePathPrefix(hash) {
		return this.filesystem.pathPrefix.encode(hash || await this.getHash());
	}
	async getFinalDirectory(hash) {
		return this.filesystem.uniquePath.encode(hash || await this.getHash());
	}
	async getDirectory() {
		return this.filesystem.getFullPath(await this.getHash());
	}
	async getFile() {
		return this.filesystem.getFile(await this.getHash());
	}
	async getURL() {
		return this.filesystem.getURL(await this.getHash());
	}
	async getFileURL() {
		return this.filesystem.getFileURL(await this.getHash());
	}
	async estimateBlockSize() {
		const binary = await this.exportBinary();
		const data = await this.exportObject();
		const size = binary.length;
		let compactSize = size;
		console.log('Expanded Size:', size);
		if (data.hash) {
			compactSize -= data.hash.length;
			console.log('Compact Without hash Size:', compactSize);
		}
		if (data.signature) {
			compactSize -= data.signature.length;
			console.log('Compact Without signature Size:', compactSize);
		}
		console.log('Compact Size:', compactSize);
		return size;
	}
	filesystemConfig = filesystemTypes.generic;
}
extendClass(Block, logMethods);
extendClass(Block, accessorMethods);
extendClass(Block, configMethods);
extendClass(Block, defaultsMethods);
extendClass(Block, exportMethods);
extendClass(Block, filesystemMethods);
extendClass(Block, hashingMethods);
extendClass(Block, signatureMethods);
extendClass(Block, validateMethods);
export async function block(...args) {
	const source = construct(Block, args);
	return source;
}
export default block;
// const example = await block();
// const exampleWallet = await wallet();
// await example.initialize();
// await example.setDefaults();
// await example.setHash();
// console.log(example.block, (await example.exportBinary()).length);
// console.log(example.block, await example.validate());
// U3VjaCB2aXNpb24gb2Ygd2hhdCBjb3VsZCBiZSBidXQgb25lIEkgbWF5IG5ldmVyIHNlZS4gVGhlIGN1cnNlIG9mIGRyZWFtcy4=
