import { Superstructure, superstructure } from './superstructure/index.js';
import { Wallet, wallet } from './wallet/wallet.js';
import { transactionBlock } from './blocks/transaction/block.js';
export class VIAT {
	constructor(config) {
		const {
			wallet: thisWallet,
			superstructure: thisSuperstructure,
		} = config;
		if (thisWallet) {
			this.wallet = thisWallet;
		}
		if (thisSuperstructure) {
			this.superstructure = function() {
				return thisSuperstructure;
			};
		}
	}
}
export async function viat(config) {
	const source = await (new VIAT(config));
	return source;
}
export {
	Wallet,
	wallet,
	Superstructure,
	superstructure,
};
export default viat;
