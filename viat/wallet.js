import { decode, encode } from '#utilities/serialize';
import { Profile } from '../cryptoID/index.js';
import { isBuffer } from '@universalweb/acid';
import viat from '#crypto/cipherSuite/viat.js';
export class ViatWallet extends Profile {
	constructor(config = {}) {
		const sourceInstance = super(config);
		return this.walletInitialize(config);
	}
	async walletInitialize(config) {
		return this;
	}
	setAlias(value) {
		this.alias = value;
	}
}
export function viatWallet(config) {
	const source = new ViatWallet();
	return source;
}
