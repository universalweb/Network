import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { serverSession } from '#crypto';
export async function reKey(client, certificate, server) {
	const {
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
	} = server;
	serverSession(serverPublicKey, serverPrivateKey, certificate.key);
	client.lastReKey = Date.now();
	await server.clientEvent('reKey', client);
	success(`client reKeyed -> ID: ${client.id}`);
}
