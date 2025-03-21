import { decode, encode } from '#utilities/serialize';
import { Profile } from '../profile/index.js';
import hash from '../cryptoMiddleware/hash/shake256.js';
import { isBuffer } from '@universalweb/acid';
import viat from '../cryptoMiddleware/signature/viat.js';
import { write } from '../utilities/file.js';
const {
	hash256,
	hash512
} = hash;
export class ViatWallet extends Profile {
	constructor(config = {}) {
		const sourceInstance = super(config);
		return this.walletInitialize(config);
	}
	async walletInitialize(config) {
		return this;
	}
	generateAddress() {
		const publicKeyCombined = Buffer.concat(this.signatureKeypair.publicKey);
		const address = hash512(publicKeyCombined);
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
