/**
	* @NAME SPHINCS+ with SHAKE256 || slh_dsa_shake_256s
	* @NOTES Algorithm 1, implementing key generation for ML-DSA, uses an RBG to generate the 256-bit random
	* value ξ . The seed ξ shall be freshly generated using an approved RBG, as prescribed in NIST SP 800-90A,
	* SP 800-90B, and SP 800-90C [19, 20, 21]. Moreover, the RBG used shall have a security strength of at
	* least 192 bits for ML-DSA-65 and 256 bits for ML-DSA-87. For ML-DSA-44, the RBG should have a
	* security strength of at least 192 bits and shall have a security strength of at least 128 bits. (If an approved
	* RBG with at least 128 bits of security but less than 192 bits of security is used, then the claimed security
	* strength of ML-DSA-44 is reduced from category 2 to category 1.)
 */
import * as defaultCrypto from '#crypto';
import {
	slh_dsa_shake_128f,
	slh_dsa_shake_128s,
	slh_dsa_shake_192f,
	slh_dsa_shake_192s,
	slh_dsa_shake_256f,
	slh_dsa_shake_256s,
} from '@noble/post-quantum/slh-dsa';
import { blake3 } from '@noble/hashes/blake3';
const {
	randomBuffer,
	toBase64,
	toHex,
	combineKeys
} = defaultCrypto;
const generateKeypair = slh_dsa_shake_256s;
export async function signatureKeypair() {
	const keypair = await generateKeypair.keygen();
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
export const sphincsShake256 = {
	name: 'slh_dsa_shake_256f',
	alias: 'sphincsShake256',
	id: 5,
	signatureKeypair,
	sign,
	verifySignature
};
console.log(blake3('abc', {
	dkLen: 64
}).length);
// const key = await signatureKeypair();
// const textExample = Buffer.from('test');
// // console.log(key);
// console.log((await sign(textExample, key)).length);
