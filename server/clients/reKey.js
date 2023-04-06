import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
import { serverSession } from 'utilities/crypto.js';
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
	await server.nodeEvent('reKey', client);
	success(`client reKeyed -> ID: ${client.id}`);
}
