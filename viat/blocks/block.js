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
import blockDefaults from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import path from 'path';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import { write } from '#utilities/file';
const {
	version,
	blockTypes
} = blockDefaults;
export class Block {
	constructor(config) {
		if (config?.block) {
			assign(this.block, config.block);
		}
		return this;
	}
	async init() {
		return this;
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
	async save() {
		await this.finalize();
		const blockBinary = await this.exportBinary();
		const filename = await this.filename();
		return write(filename, blockBinary, 'binary', true);
	}
	async filename() {
		const blockName = await this.get('hash');
		return `${blockName}.bin`;
	}
	async finalize() {
		await this.setDefaults();
		await this.setHash();
	}
	async validate() {
		const manualHash = await this.hashData();
		const hash = await this.get('hash');
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
	async hashData() {
		const binary = await this.exportDataBinary();
		return this.hash256(binary);
	}
	async hashMeta() {
		const binary = await this.exportMetaBinary();
		return this.hash256(binary);
	}
	async hashCore() {
		const binary = await this.exportCoreBinary();
		return this.hash256(binary);
	}
	async blockHash() {
		const binary = await this.exportBinary();
		return this.hash256(binary);
	}
	async setHash() {
		await this.set('hash', await this.blockHash());
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
		return toBase64Url(this.getCore('sender'));
	}
	getReceiver() {
		return this.getCore('receiver');
	}
	getReceiverString() {
		return toBase64Url(this.getReceiver());
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
	getParent() {
		return this.parent;
	}
	getChildren() {
		return this.children;
	}
	getVersion() {
		return this.getMeta('version');
	}
	getType() {
		return this.getMeta('type');
	}
	version = version;
	blockType = blockTypes.genericBlockType;
	cipherSuite = viatCipherSuite;
	nonceSize = 16;
	fileType = blockDefaults.fileExtensions.block;
}
export async function block(...args) {
	const source = await construct(Block, args);
	return source;
}
export default block;
// const exmple = await block();
// console.log(exmple);
// console.log(exmple.get());
console.log(path.resolve(currentPath(import.meta)));
console.log(path.dirname(path.normalize('./')));
// U3VjaCB2aXNpb24gb2Ygd2hhdCBjb3VsZCBiZSBidXQgb25lIEkgbWF5IG5ldmVyIHNlZS4gVGhlIGN1cnNlIG9mIGRyZWFtcy4=
