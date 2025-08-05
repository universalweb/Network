import { construct, extendClass, getConstructorName } from '@universalweb/utilitylib';
import accessorMethods from './methods/accessors.js';
import blockDefaults from './defaults.js';
import configMethods from './methods/config.js';
import defaultsMethods from './methods/defaults.js';
import exportMethods from './methods/export.js';
import filesystemMethods from './methods/filesystem.js';
import { getParentClassName } from '#utilities/class';
import { hash512SettingsCrypto } from '#utilities/cryptography/utils';
import hashingMethods from './methods/hashing.js';
import signatureMethods from './methods/signature.js';
import validateMethods from './methods/validate.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
const {
	version,
	blockTypes,
} = blockDefaults;
// TODO: CHECK IF HASH CAN BE GENERATED INSTEAD OF SAVED TO DISK SINCE SIG COVERS IT - means can be dynamically generated
// Consider only receipt block has signature. Means can cut total size of both blocks by maybe 2kb
export class Block {
	constructor(config) {
		return this;
	}
	async initialize(data, config, ...args) {
		this.blockType = blockDefaults.blockTypes[this.typeName];
		this.fileType = blockDefaults.fileExtensions[this.typeName];
		this.filename = blockDefaults.genericFilenames[this.typeName];
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
	}
	version = version;
	typeName = 'generic';
	blockType = blockDefaults.blockTypes.generic;
	fileType = blockDefaults.fileExtensions.generic;
	filename = blockDefaults.genericFilenames.generic;
	cipherSuite = viatCipherSuite;
	nonceSize = 16;
	hashSize = 64;
	hashXOFConfig = hash512SettingsCrypto;
	block = {
		data: {
			meta: {},
			core: {},
		},
	};
}
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
// example.initialize();
// example.setDefaults();
// await example.setHash();
// console.log(example.block, await example.validate());
// U3VjaCB2aXNpb24gb2Ygd2hhdCBjb3VsZCBiZSBidXQgb25lIEkgbWF5IG5ldmVyIHNlZS4gVGhlIGN1cnNlIG9mIGRyZWFtcy4=
