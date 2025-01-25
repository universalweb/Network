/**
	* @NAME SPHINCS+ with SHAKE256 - slh_dsa_shake_192s
 */
import { hash256, hash512, shake256 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { signatureScheme } from './signatureScheme.js';
import { slh_dsa_shake_192s } from '@noble/post-quantum/slh-dsa';
const seedSize = 64;
const publicKeySize = 48;
const privateKeySize = 96;
const signatureSize = 16224;
const generateKeypair = slh_dsa_shake_192s.keygen;
const verifyData = slh_dsa_shake_192s.verify;
const signData = slh_dsa_shake_192s.sign;
async function createKeypair(seed) {
	const keypair = await generateKeypair();
	return {
		publicKey: keypair.publicKey,
		privateKey: keypair.secretKey
	};
}
function signMethod(message, privateKey) {
	return signData(privateKey?.privateKey || privateKey, message);
}
function verifyMethod(signature, message, publicKey) {
	return verifyData(publicKey?.publicKey || publicKey, message, signature);
}
export const sphincs192 = signatureScheme({
	name: 'sphincs192',
	alias: 'slh_dsa_shake_192s',
	id: 4,
	security: 4,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	createKeypair,
	verifyMethod,
	signMethod,
	hash256,
	hash512,
	hash: shake256,
	preferred: false
});
export default sphincs192;
// const key = await sphincs192.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await sphincs192.sign(msg, key);
// console.log(sig.length);
// console.log(await sphincs192.verify(sig, key, msg));

