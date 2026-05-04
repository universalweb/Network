import VIAT_DEFAULTS from '#viat/defaults';
import createHDSeed from '#root/viat/hdSeed/index';
// import { argon2id } from 'hash-wasm'; // For securing seeds
/*
	DESCRIPTION: Basic Viat Wallet for generic generation and usage. Built for Web Browser compatibility.
	TODO: Add Signature, Verification, and basic wallet functionality
	TODO: Store private seed data encrypted in memory (localStorage) when using prompt user to decrypt
*/
export class BasicWallet {
	constructor(config, optionalArg) {
		return this.initialize(config, optionalArg);
	}
	async initialize(config, optionalArg) {
		return this;
	}
}
