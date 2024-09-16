import { dilithium44 } from './dilithium44.js';
import { ed25519 } from './ed25519.js';
export async function getEd25519PublicKey(publicKey) {
	return publicKey.slice(0, 32);
}
export async function getEd25519PrivateKey(privateKey) {
	return privateKey.slice(0, 64);
}
export async function getDilithiumPublicKey(publicKey) {
	return publicKey.slice(32);
}
export async function getDilithiumPrivateKey(privateKey) {
	return privateKey.slice(64);
}
export async function sign(message, privateKey) {
	const ed25519PrivateKey = getEd25519PrivateKey(privateKey);
	const dilithiumPrivateKey = getDilithiumPrivateKey(privateKey);
	const ed25519Signature = await ed25519.signDetached(message, ed25519PrivateKey);
	console.log(ed25519Signature.length);
	const dilithiumSignature = await dilithium44.sign(message, dilithiumPrivateKey);
	console.log(dilithiumSignature.length);
	const signature = Buffer.concat([ed25519Signature, dilithiumSignature]);
	return signature;
}
export async function verifySignature(signature, message, publicKey) {
	const ed25519Signature = signature.slice(0, 64);
	const dilithiumSignature = signature.slice(64);
	const ed25519PublicKey = getEd25519PublicKey(publicKey);
	const dilithiumPublicKey = getDilithiumPublicKey(publicKey);
	const ed25519Verify = ed25519.verifySignatureDetached(ed25519Signature, ed25519PublicKey, message);
	const dilithiumVerify = await dilithium44.verifySignature(dilithiumSignature, dilithiumPublicKey, message);
	console.log(ed25519Verify, dilithiumVerify);
	return (ed25519Verify === dilithiumVerify) ? ed25519Verify : false;
}
export async function signatureKeypair(target) {
	const ed25519NewKeypair = await ed25519.signatureKeypair();
	const dilithiumNewKeypair =	await dilithium44.signatureKeypair();
	const publicKey = Buffer.concat([ed25519NewKeypair.publicKey, dilithiumNewKeypair.publicKey]);
	const privateKey = Buffer.concat([ed25519NewKeypair.privateKey, dilithiumNewKeypair.privateKey]);
	if (target) {
		target.publicKey = publicKey;
		target.privateKey = privateKey;
		return target;
	}
	return {
		publicKey,
		privateKey
	};
}
export const dilithium44_ed25519 = {
	name: 'dilithium44_ed25519',
	alias: 'dilithium44_ed25519',
	id: 4,
	verifySignature,
	signatureKeypair,
	sign,
	getDilithiumPrivateKey,
	getDilithiumPublicKey,
	getEd25519PrivateKey,
	getEd25519PublicKey
};
