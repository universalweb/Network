import { clientSession } from '#crypto';
export function reKey(transmitKey, receiveKey, sourcePublicKey, sourcePrivateKey, destinationPublicKey) {
	clientSession(receiveKey, transmitKey, sourcePublicKey, sourcePrivateKey, destinationPublicKey);
}
