import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { sessionKeys } from '#crypto';
export async function reKey(client, certificate, server) {
	const {
		publicKey,
		secretKey
	} = client.reKey;
	const newSessionKeys = sessionKeys(publicKey, secretKey, certificate.key);
	client.ephemeralKeypair = client.reKey;
	client.transmitKey = newSessionKeys.transmitKey;
	client.receiveKey = newSessionKeys.receiveKey;
	client.lastReKey = Date.now();
	await server.clientEvent('reKey', client);
	success(`client reKeyed -> ID: ${client.id}`);
}
