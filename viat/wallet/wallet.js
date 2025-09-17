// VIAT WALLET
import { decode, encode } from '#utilities/serialize';
import { CryptoID } from '#components/cryptoID/index';
import filesystemTypes from '../storage/filesystems.js';
import { isBuffer } from '@universalweb/utilitylib';
export class Wallet extends CryptoID {
	constructor(config, optionalArg) {
		super(false);
		return this.walletInitialize(config, optionalArg);
	}
	async walletInitialize(config, optionalArg) {
		await this.initialize(config, optionalArg);
		return this;
	}
	setFilesystem(filesystem) {
		this.filesystem = filesystem;
		return this;
	}
	filesystem = filesystemTypes.generic;
	excludeKeyExchange = true;
}
export function wallet(...args) {
	const source = new Wallet(...args);
	return source;
}
export default wallet;
// console.log('Default Filesystem Config:', filesystemTypes.generic);
// const example = await wallet();
// console.log(await example.exportObject());
// console.log('Wallet Example:', await example.exportKeypairs());
// (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin'));
// console.log('Wallet:', (await wallet('/Users/thomasmarchi/MEGA/Github/Network/viat/wallet.bin')));
