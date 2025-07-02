// VIAT WALLET
import { decode, encode } from '#utilities/serialize';
import { CryptoID } from '#components/cryptoID/index';
import { isBuffer } from '@universalweb/acid';
import { transactionBlock } from '#viat/blocks/transaction/block';
export class Wallet extends CryptoID {
	constructor(config, optionalArg) {
		super(false);
		return this.walletInitialize(config, optionalArg);
	}
	async walletInitialize(config, optionalArg) {
		await this.initialize(config, optionalArg);
		return this;
	}
	async createTransaction(amount, receiver, mana = 1n) {
		const sender = await this.getAddress();
		const txBlock = await transactionBlock({
			core: {
				amount,
				receiver,
				sender,
				mana
			}
		});
		await txBlock.finalize();
		await txBlock.sign(this);
		await txBlock.createReceipt();
		// await txBlock.receipt.finalize();
		// await txBlock.receipt.sign(this);
		console.log('Transaction Block:', txBlock.block);
		return txBlock;
	}
	async send(amount, receiver, mana = 1n) {
		const txBlock = await this.createTransaction(amount, receiver, mana);
		// Here you would typically send the transaction to the network
		// This is a placeholder for the actual sending logic
		console.log(`Sending transaction of ${amount} to ${receiver} with mana ${mana}`);
	}
}
export function wallet(config) {
	const source = new Wallet(config);
	return source;
}
// const example = await wallet();
// console.log('Wallet Example:', await example.exportKeypairs());
// (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin'));
// console.log('Wallet:', (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin')));
