/* Dilithium Utilities */
import { ed25519 } from './ed25519.js';
const {
	privateKeySize: ed25519PrivateKeySize,
	publicKeySize: ed25519PublicKeySize,
	signatureSize: ed25519SignatureSize
} = ed25519;
export function getDilithiumPublicKey(publicKey, endIndex) {
	return publicKey.subarray(ed25519PublicKeySize, endIndex);
}
export function getDilithiumPrivateKey(privateKey, endIndex) {
	return privateKey.subarray(ed25519PrivateKeySize, endIndex);
}
export function getDilithiumSignature(signature, endIndex) {
	return signature.subarray(ed25519SignatureSize, endIndex);
}
export function getEd5519Signature(sig) {
	return sig.subarray(0, ed25519SignatureSize);
}
export function getEd25519PublicKey(publicKey) {
	return publicKey.subarray(0, ed25519PublicKeySize);
}
export function getEd25519PrivateKey(privateKey) {
	return privateKey.subarray(0, ed25519PrivateKeySize);
}
