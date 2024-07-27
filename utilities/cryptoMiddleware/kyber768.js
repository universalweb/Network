import * as defaultCrypto from '#crypto';
import { clearBuffer, isBuffer } from '@universalweb/acid';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const { randomBuffer } = defaultCrypto;
export async function signatureKeypair(seed) {
	const kyberKeypair = ml_kem768.keygen(seed);
	return {
		publicKey: kyberKeypair.publicKey,
		privateKey: kyberKeypair.secretKey
	};
}
async function decapsulate(cipherText, sourceKeypairKyber, x25519SessionKeys) {
	ml_kem768.decapsulate(cipherText, sourceKeypairKyber.privateKey);
}
export const kyber768 = {
	name: 'kyber768',
	short: 'kyber768',
	// Hybrid Post Quantum Key Exchange
	alias: 'kyber768',
	id: 2,
	ml_kem768,
	preferred: true,
	decapsulate,
	generateKeySeed() {
		return randomBuffer(64);
	},
	signatureKeypair,
};
