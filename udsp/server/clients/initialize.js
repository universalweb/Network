import { created } from './created.js';
import {
	decrypt, emptyNonce, keypair, randombytes_buf,
	sessionKeys, signVerifyHash, toBase64, boxUnseal,
	encodeConnectionId, randomConnectionId,
	getConnectionId,
	randomBuffer
} from '#crypto';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { construct, keys } from 'Acid';
import { Client } from './index.js';
export async function initialize(config) {
	const {
		client,
		server,
		connection,
		nonce,
		id,
		key
	} = config;
	const {
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
		connectionIdKey,
		clients,
		configuration: { id: serverId }
	} = server;
	const {
		address,
		port
	} = connection;
	const publicKey = boxUnseal(key, serverPublicKey, serverPrivateKey);
	if (!publicKey) {
		return failed(publicKey, 'Client Key Decrypt Failed');
	}
	const sessionKey = sessionKeys(serverPublicKey, serverPrivateKey, publicKey);
	const {
		receiveKey,
		transmitKey,
	} = sessionKey;
	success(`key: ${toBase64(publicKey)}`);
	success(`receiveKey: ${toBase64(receiveKey)}`);
	success(`transmitKey: ${toBase64(transmitKey)}`);
	success(`nonce: ${toBase64(nonce)}`);
	success(`Ephemeral Key: ${toBase64(publicKey)}`);
	/*
		When the client sends to server it includes the client ID in the header
		This also validates origin as any following requests must use this Server Connection ID
		Server IDs are typically larger encrypted
		Server IDs can be random with some actionable info
		The client ID can be used as the base of the server ID and then generate the rest to form a unique server specific ID
	*/
	success(`Client Connection ID: ${toBase64(id)}`);
	/*
		The server's connection ID is used for loadbalancing, internal packet analysis,
		client/server privacy, client/server security, congestion control, connection migration, and external analysis obfuscation.
		It should be typically encrypted and contain a random value plus a nonce. This encryption is the same thats used for packets.
		Encrypting the connection ID allows for the server to be able to identify the client without leaking any internal network information.
		The nonce is used to identify the client on the end server.
		The loadbalancer can use the
		This strategy is effective for replay attacks
	*/
	// The connection id header is the full value that is found in the id field for packets leaving the server.
	const serverConnectionId = Buffer.concat([server.id, randomBuffer(4)]);
	const serverConnectionIdHeader = encodeConnectionId(serverConnectionId, connectionIdKey);
	// The server connection id is the value that is used to identify the client to the server.
	const serverConnectionIdString = toBase64(serverConnectionId);
	console.log(`Server Connection ID: ${toBase64(serverConnectionId)}`);
	if (clients.has(serverConnectionIdString)) {
		failed('ID IN USE NEED TO RE-CHECK FOR A NEW ID');
	} else {
		success(`Server client ID is open ${serverConnectionIdString}`);
	}
	clients.set(serverConnectionIdString, client);
	client.idString = serverConnectionIdString;
	client.serverConnectionId = serverConnectionId;
	client.id = serverConnectionIdHeader;
	client.clientId = id;
	client.clientIdString = toBase64(id);
	client.publicKey = publicKey;
	client.address = address;
	client.port = port;
	client.transmitKey = transmitKey;
	client.receiveKey = receiveKey;
	if (!server.realtime && server.gracePeriod) {
		client.gracePeriod = setTimeout(() => {
			const lastActive = (Date.now() - client.lastActive) / 1000;
			if (client.state === 1 || lastActive > 30) {
				client.destroy(1);
			}
		}, 30000);
	}
	client.nonce = emptyNonce();
	// client.publicCertificate = publicCertificate;
	/*
		Packets that need to be sent and confirmed
	*/
	success(`client Created: ID:${serverConnectionIdString} ${address}:${port}`);
	await server.clientEvent('constructed', `SID${serverConnectionIdString}`, `CID${client.clientIdString}`);
	await client.created();
	client.cachePacketSendConfig();
	return client;
}

