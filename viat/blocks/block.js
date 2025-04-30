import {
	assign, construct, get, isPlainObject, isString,
	mapAsyncArray, sortNumberAscending
} from '@universalweb/acid';
import blockDefaults from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
const {
	version,
	blockTypes
} = blockDefaults;
export class Block {
	constructor(config) {
		this.setDefaults();
		if (config?.block.data?.meta) {
			assign(this.block.data.meta, config.block.data.meta);
		}
		if (config?.block.data?.core) {
			assign(this.block.data.core, config.block.data.core);
		}
	}
	version = version;
	blockType = blockTypes.abstractBlockType;
	cipherSuite = viatCipherSuite;
	block = {
		data: {
			meta: {},
			core: {}
		}
	};
	setDefaults() {
		this.setMeta('timestamp', Date.now());
		this.setMeta('version', this.version);
		this.setMeta('blockType', this.blockType);
		this.setMeta('nonce', this.cipherSuite.createBlockNonce());
	}
	async getHash() {
		const binary = await this.exportDataBinary();
		return this.cipherSuite.hash.hash256(binary);
	}
	async setHash() {
		const blockHash = await this.getHash();
		this.set('hash', blockHash);
		return this;
	}
	getCore(propertyName) {
		if (propertyName) {
			return get(propertyName, this.block.data.core);
		}
		return this.block.data.core;
	}
	setCore(propertyName, value) {
		if (isString(propertyName)) {
			this.block.data.core[propertyName] = value;
		} else if (isPlainObject(propertyName)) {
			assign(this.block.data.core, propertyName);
		}
		return this;
	}
	getMeta(propertyName) {
		if (propertyName) {
			return get(propertyName, this.block.data.meta);
		}
		return this.block.data.meta;
	}
	setMeta(propertyName, value) {
		if (isString(propertyName)) {
			this.block.data.meta[propertyName] = value;
		} else if (isPlainObject(propertyName)) {
			assign(this.block.data.meta, propertyName);
		}
		return this;
	}
	getData() {
		return this.block.data;
	}
	setData(propertyName, value) {
		if (isString(propertyName)) {
			this.block.data[propertyName] = value;
		} else if (isPlainObject(propertyName)) {
			assign(this.block.data, propertyName);
		}
		return this;
	}
	get() {
		return this.block;
	}
	set(propertyName, value) {
		if (isString(propertyName)) {
			this.block[propertyName] = value;
		} else if (isPlainObject(propertyName)) {
			assign(this.block, propertyName);
		}
		return this;
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
	getParentHash() {
		return this.parentHash;
	}
	getVersion() {
		return this.getMeta('version');
	}
	getType() {
		return this.getMeta('type');
	}
}
export function block(...args) {
	const source = construct(Block, args);
	return source;
}
// console.log(block().object, block(2).object, block().object);
export default block;
