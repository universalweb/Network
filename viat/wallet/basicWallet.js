import VIAT_DEFAULTS from '#viat/defaults';
import createHDSeed from '#root/viat/hdSeed/index';
// import { argon2id } from 'hash-wasm'; // For securing seeds
/*
	DESCRIPTION: Basic Viat Wallet for generic generation and usage. Built for Web Browser compatibility.
	TODO: Add Signature, Verification
	TODO: Use temp buffer to store decrypted seeds then write over buffer with 0s when done.
	TODO: Store only encrypted master seed, key, nonce in memory/disk when using prompt user to decrypt
*/
export class BasicWallet {
	constructor(config, optionalArg) {
		return this.initialize(config, optionalArg);
	}
	async loadFromSeed(seed, optionalArg) {
		this.keypair = await createHDSeed(seed, optionalArg);
		return this;
	}
	async initialize(config, optionalArg) {
		if (config?.seed) {
			await this.loadFromSeed(config.seed, optionalArg);
		}
		return this;
	}
}
