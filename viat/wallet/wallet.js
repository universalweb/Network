// VIAT WALLET
import { decode, encode } from '#utilities/serialize';
import { CryptoID } from '#components/cryptoID/index';
import { isBuffer } from '@universalweb/acid';
export class Wallet extends CryptoID {
	constructor(config, optionalArg) {
		super(false);
		return this.walletInitialize(config, optionalArg);
	}
	async walletInitialize(config, optionalArg) {
		await this.initialize(config, optionalArg);
		return this;
	}
	createFolder(initialPath) {
	}
}
export function wallet(config) {
	const source = new Wallet(config);
	return source;
}
// (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin'));
// console.log('Wallet:', (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin')));
