import * as defaultCrypto from '#crypto';
import { clearBuffer, isBuffer } from '@universalweb/acid';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { encryptionKeypair as x25519Keypair } from './x25519.js';
const { randomBuffer } = defaultCrypto;
export async function encryptionKeypair(seed) {
	const kyberKeypair = ml_kem768.keygen(seed);
	return {
		publicKey: kyberKeypair.publicKey,
		privateKey: kyberKeypair.secretKey
	};
}
export async function decapsulate(cipherText, sourceKeypairKyber) {
	const decapsulated = ml_kem768.decapsulate(cipherText, sourceKeypairKyber?.privateKey || sourceKeypairKyber);
	return decapsulated;
}
export async function encapsulate(sourceKeypair) {
	// { cipherText, sharedSecret }
	const encapsulated = ml_kem768.encapsulate(sourceKeypair?.publicKey || sourceKeypair);
	return encapsulated;
}
export const kyber768 = {
	name: 'kyber768',
	alias: 'kyber768',
	id: 1,
	ml_kem768,
	preferred: true,
	decapsulate,
	encapsulate,
	generateSeed() {
		return randomBuffer(64);
	},
	encryptionKeypair,
	certificateEncryptionKeypair: encryptionKeypair,
};
