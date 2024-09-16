import {
	createSeed,
	sign,
	signatureKeypair,
	verifySignature
} from './dilithium44.js';
export const dilithium44_ed25519 = {
	name: 'dilithium44_ed25519',
	alias: 'dilithium44_ed25519',
	id: 1,
	createSeed,
	signatureKeypair,
	sign,
	verifySignature
};
