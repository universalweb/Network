// VIAT WALLET
import { decode, encode } from '#utilities/serialize';
import { CryptoID } from '#components/cryptoID/index';
import { isBuffer } from '@universalweb/acid';
import viat from '#crypto/cipherSuite/viat.js';
export class Wallet extends CryptoID {
	constructor(config = {}) {
		const sourceInstance = super(config);
		return this.walletInitialize(config);
	}
	async walletInitialize(config) {
		return this;
	}
}
export function wallet(config) {
	const source = new Wallet(config);
	return source;
}
