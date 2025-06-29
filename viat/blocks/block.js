import {
	assign,
	construct,
	currentPath,
	everyArray,
	get,
	hasValue,
	isArray,
	isBigInt,
	isNumber,
	isPlainObject,
	isString,
	isZero,
	mapAsyncArray,
	sortNumberAscending,
	toPath
} from '@universalweb/acid';
import { readStructured, write } from '#utilities/file';
import { validateSchema, validateSchemaVerbose } from '#utilities/schema/index';
import blockDefaults from './defaults.js';
import { blockSchema } from './schema.js';
import { encodeStrict } from '#utilities/serialize';
import { getParentClassName } from '#utilities/class';
import { getTransactionPath } from './transaction/uri.js';
import { getWallet } from './wallet/uri.js';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import { toSmallestUnit } from '../math/coin.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
const {
	version,
	blockTypes
} = blockDefaults;
export class Block {
	constructor(config) {
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
		if (data) {
			if (getParentClassName(data) === 'Block') {
				this.configByBlock(data, config);
			} else {
				this.config(data, config);
			}
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
	config(data, config) {
		if (isPlainObject(data)) {
			this.setData(data);
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
		const signature = await wallet.signPartial(binary);
		return signature;
	}
	async sign(wallet) {
		const signature = await this.createSignature(wallet);
		await this.set('signature', signature);
		return this;
	}
	async createFullSignature(wallet) {
		const binary = await this.exportDataBinary();
		const signature = await wallet.sign(binary);
		return signature;
	}
	async signFull(wallet) {
		const binary = await this.exportDataBinary();
		const signature = await this.createFullSignature(wallet, binary);
		await this.set('signature', signature);
		return this;
	}
	async verifySignature(wallet) {
		const signature = await this.get('signature');
		const binary = await this.exportDataBinary();
		const isValid = await wallet.verifyPartialSignature(signature, binary);
		return isValid;
	}
	async verifyFullSignature(wallet) {
		const signature = await this.get('signature');
		const binary = await this.exportDataBinary();
		const isValid = await wallet.verifySignature(signature, binary);
		return isValid;
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
	async storageID(value) {
		if (value) {
			await this.set('storageID', value);
		}
		const storageID = await this.get('storageID');
		if (storageID) {
			return storageID;
		}
		return this.hashData();
	}
	getCore(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data.core) : this.block.data.core;
	}
	setCore(primaryArg, value) {
		if (isPlainObject(primaryArg)) {
			if (primaryArg.amount) {
				primaryArg.amount = toSmallestUnit(primaryArg.amount, 'mana');
			}
			assign(this.block.data.core, primaryArg);
			return this;
		}
		return this.set(primaryArg, value, this.block.data.core);
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
		if (isPlainObject(propertyName)) {
			assign(this.block.data, propertyName);
			return this;
		}
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
		const sequence = this.getCore('sequence');
		if (isBigInt(sequence)) {
			return sequence;
		}
		return;
	}
	async getParentSequence() {
		const parentNode = await this.getParent();
		if (parentNode) {
			return parentNode.getSequence();
		}
		return;
	}
	async setSequence() {
		const parentSequence = await this.getParentSequence();
		if (isBigInt(parentSequence)) {
			return parentSequence + 1n;
		} else {
			return 0n;
		}
	}
	async validate() {
		const validateGeneric = await validateSchema(blockSchema, this.block);
		if (!validateGeneric) {
			return false;
		}
		if (this.blockSchema) {
			const result = await validateSchema(this.blockSchema, this.block);
			return result;
		}
		return true;
	}
	async validateVerbose() {
		const validateGeneric = await validateSchemaVerbose(blockSchema, this.block);
		if (!validateGeneric) {
			return false;
		}
		if (this.blockSchema) {
			const result = await validateSchemaVerbose(this.blockSchema, this.block);
			return result;
		}
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
// const example = await block();
// example.initialize();
// example.setDefaults();
// await example.setHash();
// console.log(example.block, await example.validate());
// U3VjaCB2aXNpb24gb2Ygd2hhdCBjb3VsZCBiZSBidXQgb25lIEkgbWF5IG5ldmVyIHNlZS4gVGhlIGN1cnNlIG9mIGRyZWFtcy4=
