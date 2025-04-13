import { Block } from './block.js';

class transactionBlock extends Block {
	constructor(...args) {
		super(version, type);
	}

	getHash() {
		return this.hash;
	}

	getParentHash() {
		return this.parentHash;
	}
}
export async function fullSendBlockID(block) {
	const {
		version,
		type,
		hash,
		wallet
	} = block;
	const version = block.version;
	const blockType = block.type;
	const blockID = [version, 0, hash, parentHash];
	return blockID;
}
