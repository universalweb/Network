import {
	assign,
	construct,
	currentPath,
	everyArray,
	get,
	hasValue,
	isArray,
	isPlainObject,
	isString,
	isZero,
	mapAsyncArray,
	sortNumberAscending,
	toPath
} from '@universalweb/acid';
import { readStructured, write } from '#utilities/file';
import blockDefaults from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { getParentClassName } from '#utilities/class';
import { getTransactionPath } from './transaction/uri.js';
import { getWallet } from './wallet/uri.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
const {
	version,
	blockTypes
} = blockDefaults;
export class Block {
	constructor(data, config) {
		if (data) {
			assign(this.block, data);
		}
		if (config?.source) {
			this.source = function() {
				return config.source;
			};
		}
		return this;
	}
	initialize(data, config) {
		this.blockType = blockDefaults.blockTypes[this.typeName];
		this.fileType = blockDefaults.fileExtensions[this.typeName];
		this.filename = blockDefaults.genericFilenames[this.typeName];
		if (getParentClassName(data) === 'Block') {
			this.configByBlock(data, config);
		}
		return this;
	}
	configByBlock(blockObject, config) {
		switch (blockObject.blockType) {
			case blockTypes.transaction: {
				if (this.configByTransactionBlock) {
					return this.configByTransactionBlock(blockObject, config);
				}
				break;
			}
			case blockTypes.receipt: {
				if (this.configByReceiptBlock) {
					return this.configByReceiptBlock(blockObject, config);
				}
				break;
			}
			default: {
				if (this.configByGenericBlock) {
					return this.configByGenericBlock(blockObject, config);
				}
				break;
			}
		}
	}
	async configByBlockAsync(blockObject, config) {
		return this.configByBlock(blockObject, config);
	}
	block = {
		data: {
			meta: {},
			core: {},
			//  receiptLink HASH of Contents
		},
		// directLink (Dynamically generated) /w/3bytes/3bytes/last32/t/transactionID(32)
		// id HASH
	};
	// TODO: Add network folder to it for saving
	async save(directoryPath) {
		const blockBinary = await this.exportBinary();
		const fullSavePath = path.join(directoryPath, await this.getPath());
		return write(fullSavePath, blockBinary, 'binary', true);
	}
	//  TODO:CONVERT BUFFER TO BASE64URL
	async getFilename() {
		return this.filename;
	}
	async finalize() {
		await this.setDefaults();
		await this.setHash();
	}
	async validate() {
		const hashCheck = await this.validateHash();
		if (!hashCheck) {
			return false;
		}
		return true;
	}
	async validateHash() {
		const manualHash = await this.hashData();
		const hash = await this.getHash();
		if (isZero(manualHash.compare(hash))) {
			return true;
		}
		return false;
	}
	setDefaults() {
		this.setMeta('timestamp', Date.now());
		this.setMeta('version', this.version);
		this.setMeta('blockType', this.blockType);
		this.setMeta('nonce', this.cipherSuite.createBlockNonce(this.nonceSize));
	}
	async createSignature(wallet) {
		const binary = await this.exportDataBinary();
		const signature = await wallet.sign(binary);
		return signature;
	}
	async signBlock(wallet) {
		const signature = await this.createSignature(wallet);
		await this.set('signature', signature);
		return this;
	}
	async hashData() {
		const binary = await this.exportDataBinary();
		return this.hash512(binary);
	}
	async hashMeta() {
		const binary = await this.exportMetaBinary();
		return this.hash512(binary);
	}
	async hashCore() {
		const binary = await this.exportCoreBinary();
		return this.hash512(binary);
	}
	async hashBlock() {
		const binary = await this.exportBinary();
		return this.hash512(binary);
	}
	async setHash() {
		await this.set('hash', await this.hashData());
	}
	async getHash() {
		if (!this.get('hash')) {
			await this.setHash();
		}
		return this.get('hash');
	}
	async id(value) {
		if (value) {
			await this.set('id', value);
		}
		const id = await this.get('id');
		if (id) {
			return id;
		}
		await this.set('id', await this.hashData());
		return this.get('id');
	}
	getCore(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data.core) : this.block.data.core;
	}
	setCore(propertyName, value) {
		return this.set(propertyName, value, this.block.data.core);
	}
	getMeta(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data.meta) : this.block.data.meta;
	}
	setMeta(propertyName, value) {
		return this.set(propertyName, value, this.block.data.meta);
	}
	getData(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data) : this.block.data;
	}
	setData(propertyName, value) {
		return this.setProperty(propertyName, value, this.block.data);
	}
	get(propertyName) {
		return (propertyName) ? get(propertyName, this.block) : this.block;
	}
	getSender() {
		return this.getCore('sender');
	}
	getSenderString() {
		return toBase64Url(this.getCore('sender'));
	}
	getSenderPath() {
		return getWallet(this.getCore('sender'));
	}
	getReceiver() {
		return this.getCore('receiver');
	}
	getReceiverString() {
		return toBase64Url(this.getReceiver());
	}
	getReceiverPath() {
		return getWallet(this.getCore('receiver'));
	}
	set(propertyName, value, sourceObject) {
		let link = sourceObject || this.block;
		const pathArray = isArray(propertyName) ? propertyName : toPath(propertyName);
		const lastPathItem = pathArray.pop();
		const pathArrayLength = pathArray.length;
		everyArray(pathArray, (item) => {
			link = link[item];
			return hasValue(link);
		});
		if (link) {
			link[lastPathItem] = value;
		}
		return link;
	}
	async exportBinary() {
		return encodeStrict(this.block);
	}
	async exportDataBinary() {
		return encodeStrict(this.block.data);
	}
	async exportMetaBinary() {
		return encodeStrict(this.block.data.meta);
	}
	async exportCoreBinary() {
		return encodeStrict(this.block.data.core);
	}
	async hash256(binary) {
		if (binary) {
			return this.cipherSuite.hash.hash256(binary);
		}
	}
	async hash512(binary) {
		if (binary) {
			return this.cipherSuite.hash.hash512(binary);
		}
	}
	async hashXOF(binary, options) {
		if (binary) {
			return this.cipherSuite.hash.hashXOF(binary, options);
		}
	}
	async getParent() {
		return this.parent;
	}
	async getChildren() {
		return this.children;
	}
	getVersion() {
		return this.getMeta('version');
	}
	getType() {
		return this.getMeta('type');
	}
	getSequence() {
		return this.getCore('sequence');
	}
	async getParentSequence() {
		const parentNode = await this.getParent();
		if (parentNode) {
			return BigInt(parentNode.getSequence());
		}
		return null;
	}
	async setSequence() {
		const parentId = await this.getParentSequence();
		return parentId + 1n;
	}
	version = version;
	typeName = 'generic';
	blockType = blockDefaults.blockTypes.generic;
	fileType = blockDefaults.fileExtensions.generic;
	filename = blockDefaults.genericFilenames.generic;
	cipherSuite = viatCipherSuite;
	nonceSize = 16;
	hashSize = 64;
}
export async function block(...args) {
	const source = construct(Block, args);
	return source;
}
export default block;
// const exmple = await block();
// console.log(exmple);
// U3VjaCB2aXNpb24gb2Ygd2hhdCBjb3VsZCBiZSBidXQgb25lIEkgbWF5IG5ldmVyIHNlZS4gVGhlIGN1cnNlIG9mIGRyZWFtcy4=
