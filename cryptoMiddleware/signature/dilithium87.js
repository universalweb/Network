/*
	Algorithm 1, implementing key generation for ML-DSA, uses an RBG to generate the 256-bit random
	value ξ . The seed ξ shall be freshly generated using an approved RBG, as prescribed in NIST SP 800-90A,
	SP 800-90B, and SP 800-90C [19, 20, 21]. Moreover, the RBG used shall have a security strength of at
	least 192 bits for ML-DSA-65 and 256 bits for ML-DSA-87. For ML-DSA-44, the RBG should have a
	security strength of at least 192 bits and shall have a security strength of at least 128 bits. (If an approved
	RBG with at least 128 bits of security but less than 192 bits of security is used, then the claimed security
	strength of ML-DSA-44 is reduced from category 2 to category 1.)
*/
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { ml_dsa87 } from '@noble/post-quantum/ml-dsa';
const generateKeypair = ml_dsa87;
export async function signatureKeypair(seed) {
	const keypair = await generateKeypair.keygen(seed);
	return {
		publicKey: keypair.publicKey,
		privateKey: keypair.secretKey
	};
}
export async function sign(message, privateKey) {
	const signedMessage = await generateKeypair.sign(privateKey?.privateKey || privateKey, message);
	return signedMessage;
}
export async function verifySignature(signedMessage, publicKey, message) {
	const isValid = await generateKeypair.verify(publicKey?.publicKey || publicKey, message, signedMessage);
	return isValid;
}
export const dilithium87 = {
	name: 'dilithium87',
	alias: 'dilithium87',
	id: 4,
	signatureKeypair,
	sign,
	verifySignature
};
export default dilithium87;
// const kp = signatureKeypair(rseed);
// console.log(sign(msg, kp).length);
