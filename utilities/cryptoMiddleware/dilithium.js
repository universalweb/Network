import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa';
/*
	Algorithm 1, implementing key generation for ML-DSA, uses an RBG to generate the 256-bit random
	value ξ . The seed ξ shall be freshly generated using an approved RBG, as prescribed in NIST SP 800-90A,
	SP 800-90B, and SP 800-90C [19, 20, 21]. Moreover, the RBG used shall have a security strength of at
	least 192 bits for ML-DSA-65 and 256 bits for ML-DSA-87. For ML-DSA-44, the RBG should have a
	security strength of at least 192 bits and shall have a security strength of at least 128 bits. (If an approved
	RBG with at least 128 bits of security but less than 192 bits of security is used, then the claimed security
	strength of ML-DSA-44 is reduced from category 2 to category 1.)
*/
import { bufferAlloc } from '../crypto.js';
const msg = new Uint8Array(1);
export function createSeed(size = 32) {
	const seed = bufferAlloc(size);
	return seed;
}
export function signatureKeypair(seed = createSeed()) {
	const keypair = ml_dsa87.keygen(seed);
	return {
		publicKey: keypair.publicKey,
		privateKey: keypair.secretKey
	};
}
export function sign(message, privateKey) {
	const signedMessage = ml_dsa87.sign(privateKey?.privateKey || privateKey, msg);
	return signedMessage;
}
export function verifySignature(message, signedMessage, publicKey) {
	const isValid = ml_dsa87.verify(publicKey?.publicKey || publicKey, message, signedMessage);
	return isValid;
}
// const rseed = createSeed();
// const kp = signatureKeypair(rseed);
// console.log(sign(msg, kp).length);
