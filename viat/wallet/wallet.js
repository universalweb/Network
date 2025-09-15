// VIAT WALLET
import { decode, encode } from '#utilities/serialize';
import { getTransactionPath, getTransactionsPath } from '#viat/blocks/types/transactions/transaction/uri';
import { CryptoID } from '#components/cryptoID/index';
import { getWalletPath } from '#blockswallet/uri';
import { isBuffer } from '@universalweb/utilitylib';
import { transactionBlock } from '#viat/blocks/types/transactions/transaction/block';
export class Wallet extends CryptoID {
	constructor(config, optionalArg) {
		super(false);
		return this.walletInitialize(config, optionalArg);
	}
	async walletInitialize(config, optionalArg) {
		await this.initialize(config, optionalArg);
		return this;
	}
	async getPath() {
		const address = await this.getAddress();
		return getWalletPath(address);
	}
}
export function wallet(config) {
	const source = new Wallet(config);
	return source;
}
export default wallet;
// const example = await wallet();
// console.log('Wallet Example:', await example.exportKeypairs());
// (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin'));
// console.log('Wallet:', (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin')));
