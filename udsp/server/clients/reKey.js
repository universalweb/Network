import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { serverSessionKeys } from '#crypto';
export async function reKey(client, serverKeypair, server) {
	const {
		publicKey,
		transmitKey,
		receiveKey
	} = client.reKey;
	const newSessionKeys = serverSessionKeys(serverKeypair.publicKey, serverKeypair.privateKey, publicKey, transmitKey, receiveKey);
	client.lastReKey = Date.now();
	await server.clientEvent('reKey', client);
	success(`client reKeyed -> ID: ${client.id}`);
}
