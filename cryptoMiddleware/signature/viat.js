// VIAT HYBRID SIGNATURE SCHEME
// Permit partial signature possibility
// Requires a hash from each signature to be kept in the final signature
// Means you can verify a partial signature for some operations while not requirering others
// 64 byte hash for message
// final hash summary is 64 bytes
// Threshold Signature Scheme support
// Hash message sign hashedMessage by each key then combine the signatures into one large one or a small one
// Consider hash requirement of dilithium & ed25519 but optional signature for sphincs+
// if first two sigs re required then hash message then hash signature output then combine with sphincs sig if needed
// need to confirm way for address to act like proof of ownership with various keys
import { hash256, shake256_512 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
import { dilithium65 } from './dilithium65.js';
import { ed25519 } from './ed25519.js';
import { sphincs192 } from './sphincs192.js';
const seedSize = 64;
const publicKeySize = 48;
const privateKeySize = 96;
const signatureSize = 16224;
export async function signatureKeypair() {
	const edKeypair = await ed25519.signatureKeypair();
	const dlKeypair = await dilithium65.signatureKeypair();
	const spKeypair = await sphincs192.signatureKeypair();
	return {
		publicKey: {
			ed: edKeypair.publicKey,
			dl: dlKeypair.publicKey,
			sp: spKeypair.publicKey
		},
		privateKey: {
			ed: edKeypair.privateKey,
			dl: dlKeypair.privateKey,
			sp: spKeypair.privateKey
		}
	};
}
export async function sign(message, privateKey) {
	const edSig = await ed25519.sign(message, privateKey.ed);
	const dlSig = await dilithium65.sign(message, privateKey.dl);
	const spSig = await sphincs192.sign(message, privateKey.sp);
	return Buffer.concat([
		edSig, dlSig, spSig
	]);
}
export async function verify(signature, publicKey, message) {
	const edSize = ed25519.signatureSize;
	const dlSize = await dilithium65.sign(message, publicKey.dl).then((s) => {
		return s.length;
	});
	const spSize = sphincs192.signatureSize;
	const edSig = signature.subarray(0, edSize);
	const dlSig = signature.subarray(edSize, edSize + dlSize);
	const spSig = signature.subarray(edSize + dlSize, edSize + dlSize + spSize);
	const edVerify = await ed25519.verifySignatureDetached(edSig, publicKey.ed, message);
	const dlVerify = await dilithium65.verifySignature(dlSig, publicKey.dl, message);
	const spVerify = await sphincs192.verifySignature(spSig, publicKey.sp, message);
	return edVerify && dlVerify && spVerify;
}
export const viat = {
	name: 'viat',
	alias: 'viat',
	description: 'VIAT Hybrid Signature Scheme - slh_dsa_shake_192s with dilithium65 and sphincs192.',
	id: 6,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	signatureKeypair,
	sign,
	verifySignature
};
