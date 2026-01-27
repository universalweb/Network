import { HDKeypair } from '#viat/HDKeypair/index';
import VIAT_DEFAULTS from '#viat/defaults';
/*
	Basic Viat Wallet for generic generation and usage. Built for Web Browser compatibility.
*/
export class BasicWallet {
	constructor(config, optionalArg) {
		return this.initialize(config, optionalArg);
	}
	async loadFromHDSeed(seed, optionalArg) {
		this.keypair = await (new HDKeypair(seed));
		return this;
	}
	async initialize(config, optionalArg) {
		if (config?.hdSeed) {
			await this.loadFromHDSeed(config.hdSeed);
		}
		return this;
	}
}
