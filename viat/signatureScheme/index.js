import { assign } from '@universalweb/utilitylib';
import { encode } from '#root/utilities/serialize';
/*
	NOTE: OFFLINE SIGN STRUCTURE PROTOTYPES
	Replay protections for offline or standalone signatures
	Network ids for different chains
	version ID - Fork support
	dApp protections via customization strings
	purpose IDs for different signature types (transaction signing, message signing, etc.)
	NOTE: Transactions implicitly do this on the network already via referencing next block hash.
*/
export function signatureAppStructure(appID, versionID, purposeID, customization) {
	return [
		appID, versionID, purposeID, customization,
	];
}
export function signatureStructure(networkID, versionID, purposeID, customization, message) {
	return [
		networkID, versionID, purposeID, customization, message,
	];
}
export function createSignatureDigest(sourceBuffer, hashFunction_64bytes) {
	return hashFunction_64bytes(sourceBuffer);
}
export function sign(networkID, versionID, purposeID, customization, message, privateKey, signFunction, hashFunction) {
	const targetStruct = signatureStructure(networkID, versionID, purposeID, customization, message);
	return signFunction(hashFunction(encode(targetStruct), hashFunction), privateKey);
}
export function signDetached(message, privateKey, signFunction, hashFunction) {
	const signatureDigest = hashFunction(message, hashFunction);
	return signFunction(signatureDigest, privateKey);
}
export function signMessage(message, privateKey, signFunction, hashFunction) {
	const signatureDigest = hashFunction(message, hashFunction);
	return signFunction(signatureDigest, privateKey);
}
export function verify(verifyFunction, hashFunction, networkID, versionID, purposeID, customization, message, signature, publicKey) {
	const targetStruct = signatureStructure(networkID, versionID, purposeID, customization, message);
	return verifyFunction(signature, hashFunction(encode(targetStruct), hashFunction), publicKey);
}
export function hashSignatureAppStructure(networkID, versionID, purposeID, customization) {
	return [
		networkID, versionID, purposeID, customization,
	];
}
export function hashSignatureStructure(key, message, customization, hashFunction) {
	return hashFunction(key, message, customization, hashFunction);
}
/*
	Array Structure [...meta, message buffer]
	64 Byte hash of array structure
	Sign hash with private key
	Verify with public key & hash of array structure
*/
