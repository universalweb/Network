import {
	assign, construct, get, isPlainObject, isString
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
		this.setMeta('nonce', viatCipherSuite.createBlockNonce());
	}
	getVersion() {
		return this.data.version;
	}
	getType() {
		return this.data.type;
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
	async exportDataBinary() {
		return encodeStrict(this.block.data);
	}
	getHash() {
		return this.hash;
	}
	getParentHash() {
		return this.parentHash;
	}
	async getDataHash() {
		const binary = await this.exportDataBinary();
		return viatCipherSuite.hash.hash256(binary);
	}
	async setDataHash() {
		const blockHash = await this.getDataHash();
		this.block.hash = blockHash;
		return this;
	}
}
export function block(...args) {
	const source = construct(Block, args);
	return source;
}
// console.log(block().object, block(2).object, block().object);
export default block;
