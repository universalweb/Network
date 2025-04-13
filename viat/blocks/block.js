import { construct, get } from '@universalweb/acid';
import blockDefaults from './defaults.js';
const {
	version,
	type
} = blockDefaults;
export class Block {
	constructor(ver) {
		if (ver) {
			this.object.ver = ver;
		}
	}
	object = {
		version,
		type,
	};
	getVersion() {
		return this.object.version;
	}
	getType() {
		return this.object.type;
	}
	get(propertyName) {
		return get(propertyName, this.object);
	}
	set(propertyName, value) {
		this.object[propertyName] = value;
	}
}
export function block(...args) {
	const source = construct(Block, args);
	return source;
}
// console.log(block().object, block(2).object, block().object);
export default block;
