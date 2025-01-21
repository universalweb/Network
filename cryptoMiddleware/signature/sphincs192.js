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
import { shake256 } from '@noble/hashes/sha3';
import { slh_dsa_shake_192s } from '@noble/post-quantum/slh-dsa';
const {
	randomBuffer,
	toBase64,
	toHex,
	combineKeys
} = defaultCrypto;
const seedSize = 64;
const publicKeySize = 48;
const privateKeySize = 96;
const signatureSize = 16224;
const generateKeypair = slh_dsa_shake_192s.keygen;
const verify = slh_dsa_shake_192s.verify;
const signData = slh_dsa_shake_192s.sign;
const hashFunction = shake256;
export async function signatureKeypair() {
	const keypair = await generateKeypair();
	return {
		publicKey: keypair.publicKey,
		privateKey: keypair.secretKey
	};
}
export async function sign(message, privateKey) {
	if (!message || !privateKey) {
		return false;
	}
	const signedMessage = await signData(privateKey?.privateKey || privateKey, message);
	return signedMessage;
}
export async function verifySignature(signature, publicKey, message) {
	if (!signature || !publicKey || !message) {
		return false;
	}
	if (signature.length !== signatureSize) {
		return false;
	}
	const verification = await verify(publicKey?.publicKey || publicKey, message, signature);
	return verification;
}
export const sphincs192 = {
	name: 'slh_dsa_shake_192s',
	alias: 'sphincs192',
	id: 5,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	signatureKeypair,
	sign,
	verifySignature
};
// const key = await signatureKeypair();
// console.log(key.publicKey.length);
// const textExample = Buffer.from('test');
// const sig = await sign(textExample, key);
// console.log(sig, (await verifySignature(sig, key, textExample)));
