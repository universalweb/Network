import {
	assign,
	everyArray,
	get,
	hasValue,
	isArray,
	isBigInt,
	isPlainObject,
	toPath,
} from '@universalweb/acid';
import { getWallet } from '../wallet/uri.js';
import { readStructured } from '#utilities/file';
import { toBase64Url } from '#crypto/utils.js';
const methods = {
	getCore(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data.core) : this.block.data.core;
	},
	setCore(primaryArg, value) {
		if (isPlainObject(primaryArg)) {
			assign(this.block.data.core, primaryArg);
			return this;
		}
		return this.set(primaryArg, value, this.block.data.core);
	},
	getMeta(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data.meta) : this.block.data.meta;
	},
	setMeta(propertyName, value) {
		return this.set(propertyName, value, this.block.data.meta);
	},
	getData(propertyName) {
		return (propertyName) ? get(propertyName, this.block.data) : this.block.data;
	},
	setData(propertyName, value) {
		if (isPlainObject(propertyName)) {
			assign(this.block.data, propertyName);
			return this;
		}
		return this.setProperty(propertyName, value, this.block.data);
	},
	get(propertyName) {
		return (propertyName) ? get(propertyName, this.block) : this.block;
	},
	getSender() {
		return this.getCore('sender');
	},
	getSenderString() {
		return toBase64Url(this.getCore('sender'));
	},
	getSenderPath() {
		return getWallet(this.getCore('sender'));
	},
	getReceiver() {
		return this.getCore('receiver');
	},
	getReceiverString() {
		return toBase64Url(this.getReceiver());
	},
	getReceiverPath() {
		return getWallet(this.getCore('receiver'));
	},
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
	},
	setBlock(value) {
		if (isPlainObject(value)) {
			assign(this.block, value);
		}
		return this;
	},
	async getParentHash() {
		// Get sequence if first reference wallet block
		const parentHash = await this.getCore('parent');
		return parentHash;
	},
	async getChildren() {
		return this.children;
	},
	getVersion() {
		return this.getMeta('version');
	},
	getType() {
		return this.getMeta('type');
	},
	async getSequence() {
		const sequence = await this.getCore('sequence');
		if (isBigInt(sequence)) {
			return sequence;
		}
		return;
	},
	async setParent(parentHash) {
		this.setCore('parent', parentHash);
	},
	async setParentSequence(parentNode) {
		if (parentNode) {
			return parentNode.getSequence();
		}
		return;
	},
	async setSequence() {
		const parentSequence = await this.getParentSequence();
		if (isBigInt(parentSequence)) {
			return parentSequence + 1n;
		} else {
			return 0n;
		}
	},
	async getFilename() {
		return this.filename;
	},
};
export default methods;
