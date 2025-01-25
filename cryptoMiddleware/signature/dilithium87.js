import { hash256, hash512, shake256 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { ml_dsa87 } from '@noble/post-quantum/ml-dsa';
import { signatureScheme } from './signatureScheme.js';
const seedSize = 64;
const publicKeySize = 2592;
const privateKeySize = 4896;
const signatureSize = 4627;
const generateKeypair = ml_dsa87.keygen;
const verifyData = ml_dsa87.verify;
const signData = ml_dsa87.sign;
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
export const dilithium87 = signatureScheme({
	name: 'dilithium87',
	alias: 'ml_dsa87',
	id: 3,
	security: 3,
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
export default dilithium87;
// const key = await dilithium87.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await dilithium87.sign(msg, key);
// console.log(sig.length);
// console.log(await dilithium87.verify(sig, key, msg));
