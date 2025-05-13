import {
	assign,
	construct,
	everyArray,
	get,
	hasValue,
	isArray,
	isPlainObject,
	isString,
	mapAsyncArray,
	sortNumberAscending,
	toPath
} from '@universalweb/acid';
import blockDefaults from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
const {
	version,
	blockTypes
} = blockDefaults;
export class Block {
	constructor(config) {
		this.setDefaults();
		if (config?.block?.data?.meta) {
			assign(this.block.data.meta, config.block.data.meta);
		}
		if (config?.block?.data?.core) {
			assign(this.block.data.core, config.block.data.core);
		}
		return this;
	}
	async init() {
		this.setDefaults();
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
	blockType = blockTypes.abstractBlockType;
	cipherSuite = viatCipherSuite;
	nonceSize = 8;
}
export async function block(...args) {
	const source = await construct(Block, args);
	return source;
}
export default block;
const exmple = await block();
console.log(exmple);
console.log(exmple.get());
// U3VjaCB2aXNpb24gb2Ygd2hhdCBjb3VsZCBiZSBidXQgb25lIEkgbWF5IG5ldmVyIHNlZS4gVGhlIGN1cnNlIG9mIGRyZWFtcy4=
