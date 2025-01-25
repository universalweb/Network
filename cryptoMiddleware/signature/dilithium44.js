import { hash256, hash512, shake256 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa';
import { signatureScheme } from './signatureScheme.js';
const seedSize = 64;
const publicKeySize = 1312;
const privateKeySize = 2560;
const signatureSize = 2420;
const generateKeypair = ml_dsa44.keygen;
const verifyData = ml_dsa44.verify;
const signData = ml_dsa44.sign;
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
export const dilithium44 = signatureScheme({
	name: 'dilithium44',
	alias: 'ml_dsa44',
	id: 1,
	security: 1,
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
export default dilithium44;
// const key = await dilithium44.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await dilithium44.sign(msg, key);
// console.log(sig.length);
// console.log(await dilithium44.verify(sig, key, msg));
