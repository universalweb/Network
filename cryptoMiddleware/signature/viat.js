import { hash256, shake256_512 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
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
import { dilithium65 } from './dilithium65.js';
import { slh_dsa_shake_192s } from '@noble/post-quantum/slh-dsa';
import { sphincs192 } from './sphincs192.js';
const seedSize = 64;
const publicKeySize = 48;
const privateKeySize = 96;
const signatureSize = 16224;
const generateKeypair = slh_dsa_shake_192s.keygen;
const verify = slh_dsa_shake_192s.verify;
const signData = slh_dsa_shake_192s.sign;
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
export async function hashSigh(message, privateKey) {
	const hashed = await hash256(message);
	return Promise.resolve();
}
