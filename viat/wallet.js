import { decode, encode } from '#utilities/serialize';
import { UWProfile } from '../UWProfile/index.js';
import { isBuffer } from '@universalweb/acid';
import { shake256 } from '@noble/hashes/sha3';
import { write } from '../utilities/file.js';
const hashFunction = shake256;
// 512bit address output
const hashSettings = {
	dkLen: 64
};
export class ViatWallet extends UWProfile {
	constructor(config = {}) {
		const sourceInstance = super(config);
		return sourceInstance.then(async (source) => {
			return source.walletInitialize(config);
		});
	}
	async walletInitialize(config) {
		return this;
	}
	generateAddress() {
		const address = shake256(this.publicKey, hashSettings);
		this.address = address;
		return address;
	}
	setAlias(value) {
		this.alias = value;
	}
}
export function viatWallet(config) {
	const source = new ViatWallet();
	return source;
}
