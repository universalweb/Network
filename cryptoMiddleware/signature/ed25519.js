import * as ed25519Utils from '@noble/ed25519';
import {
	bufferAlloc,
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { hash256, hash512, shake256 } from '../hash/shake256.js';
import { RistrettoPoint } from '@noble/curves/ed25519';
import { signatureScheme } from './signatureScheme.js';
const publicKeySize = 32;
const privateKeySize = 32;
const signatureSize = 64;
const seedSize = 32;
const randomPrivateKey = ed25519Utils.utils.randomPrivateKey;
const getPublicKey = ed25519Utils.getPublicKeyAsync;
const verifyMethod = ed25519Utils.verifyAsync;
const signMethod = ed25519Utils.signAsync;
async function createKeypair() {
	const privateKey = await randomPrivateKey();
	const publicKey = await getPublicKey(privateKey);
	return {
		publicKey,
		privateKey
	};
}
export const ed25519 = signatureScheme({
	name: 'ed25519',
	alias: 'default',
	id: 0,
	security: 0,
	RistrettoPoint,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	createKeypair,
	randomPrivateKey,
	getPublicKey,
	verifyMethod,
	signMethod,
	hash256,
	hash512,
	hash: shake256,
	preferred: false
});
export default ed25519;
// const key = await ed25519.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await ed25519.sign(msg, key);
// console.log(sig.length);
// console.log(await ed25519.verify(sig, key, msg));
