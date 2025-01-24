import * as ed25519Utils from '@noble/ed25519';
import {
	bufferAlloc,
	randomBuffer,
	toBase64,
	toHex,
} from '#crypto';
import { RistrettoPoint } from '@noble/curves/ed25519';
import { shake256 } from '@noble/hashes/sha3';
const publicKeySize = 32;
const privateKeySize = 32;
const signatureSize = 64;
const seedSize = 32;
const randomPrivateKey = ed25519Utils.utils.randomPrivateKey;
const getPublicKey = ed25519Utils.getPublicKeyAsync;
const verify = ed25519Utils.verifyAsync;
const signData = ed25519Utils.signAsync;
const hash256 = shake256;
async function generateKeypair(source) {
	const privateKey = await randomPrivateKey();
	const publicKey = await getPublicKey(privateKey);
	if (source) {
		if (source.publicKey) {
			source.publicKey = publicKey;
		}
		if (source.privateKey) {
			source.privateKey = privateKey;
		}
		return source;
	}
	return {
		publicKey,
		privateKey
	};
}
export async function signatureKeypair(config) {
	return generateKeypair(config);
}
export function getSignature(source) {
	return source.subarray(0, signatureSize);
}
export function getSignatureData(source) {
	return source.subarray(signatureSize);
}
export async function sign(message, privateKey) {
	if (!message || !privateKey) {
		return false;
	}
	const signature = await signData(message, privateKey?.privateKey || privateKey);
	if (!signature) {
		return false;
	}
	return signature;
}
export async function signCombined(message, privateKey) {
	if (!message || !privateKey) {
		return false;
	}
	const signature = await sign(message, privateKey?.privateKey || privateKey);
	if (!signature) {
		return false;
	}
	return Buffer.concat([signature, message]);
}
export async function verifySignature(signature, publicKey, message) {
	if (!signature || !publicKey || !message) {
		return false;
	}
	if (signature.length !== signatureSize) {
		return false;
	}
	const verification = await verify(signature, message, publicKey?.publicKey || publicKey);
	return verification;
}
export async function verifySignatureCombined(signedMessage, publicKey) {
	if (!signedMessage || !publicKey) {
		return false;
	}
	const message = getSignatureData(signedMessage);
	if (!message) {
		return false;
	}
	const signature = getSignature(signedMessage);
	if (signature.length !== signatureSize) {
		return false;
	}
	const verification = await verify(signature, message, publicKey?.publicKey || publicKey);
	return verify && message;
}
export const ed25519 = {
	name: 'ed25519',
	alias: 'default',
	id: 0,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	signatureKeypair,
	sign,
	verifySignature,
	signCombined,
	hash: hash256,
	preferred: true
};
// const key = await signatureKeypair();
// console.log(sign(Buffer.from('hello world'), combined));
// console.log(priv.length, key.privateKey.length);
