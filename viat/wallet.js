import { decode, encode } from '#utilities/serialize';
import { hash256, hash512 } from '../cryptoMiddleware/hash/shake256.js';
import { UWProfile } from '../UWProfile/index.js';
import { isBuffer } from '@universalweb/acid';
import { write } from '../utilities/file.js';
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
		const address = hash512(this.publicKey);
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
