import { hash256, hash512, shake256 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { signatureScheme } from './signatureScheme.js';
const seedSize = 64;
const publicKeySize = 1952;
const privateKeySize = 4032;
const signatureSize = 3309;
const generateKeypair = ml_dsa65.keygen;
const verifyData = ml_dsa65.verify;
const signData = ml_dsa65.sign;
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
export const dilithium65 = signatureScheme({
	name: 'dilithium65',
	alias: 'ml_dsa65',
	id: 2,
	security: 2,
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
export default dilithium65;
// const key = await dilithium65.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await dilithium65.sign(msg, key);
// console.log(sig.length);
// console.log(await dilithium65.verify(sig, key, msg));
