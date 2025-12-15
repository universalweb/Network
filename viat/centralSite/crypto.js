import ed25519 from '#crypto/signature/ed25519.js';
import { hash256 } from '#crypto/hash/shake.js';
async function verifySignature(signature, message, publicKey) {
	return ed25519.verifySignature(signature, message, publicKey);
}
async function createKeypair() {
	return ed25519.signatureKeypair();
}
async function signMessage(message, privateKey) {
	return ed25519.sign(message, privateKey);
}
export {
	hash256,
	ed25519,
	verifySignature,
	signMessage,
	createKeypair,
};
async function exampleUsage() {
	const keys = await createKeypair();
	console.log('Generated Keypair:', {
		publicKey: keys.publicKey.toString('base64'),
		privateKey: keys.privateKey.toString('base64'),
	});
	const testMessage = Buffer.from('Test message for signing');
	const signature = await signMessage(testMessage, keys.privateKey);
	console.log('Signature:', signature.toString('base64'));
	const isValid = await verifySignature(signature, testMessage, keys.publicKey);
	console.log('Signature valid:', isValid);
// Test transaction creation with signature verification
}
