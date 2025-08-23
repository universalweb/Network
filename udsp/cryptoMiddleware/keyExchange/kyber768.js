import * as defaultCrypto from '#crypto';
import { clearBuffer, isBuffer } from '@universalweb/utilitylib';
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
const publicKeySize = 1184;
const privateKeySize = 2400;
export const kyber768 = {
	name: 'kyber768',
	alias: 'kyber768',
	id: 1,
	preferred: true,
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	ml_kem768,
	decapsulate,
	encapsulate,
	generateSeed() {
		return randomBuffer(64);
	},
	encryptionKeypair,
	certificateEncryptionKeypair: encryptionKeypair,
};
// const keypair = await encryptionKeypair();
// console.log(keypair);
// console.log(keypair.privateKey.length);
// console.log(await encapsulate(keypair));
