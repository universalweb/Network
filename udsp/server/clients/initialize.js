import { created } from './created.js';
import {
	decrypt, keypair,
	serverSessionKeys, toBase64,
	randomConnectionId,
	randomBuffer
} from '#crypto';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { construct, keys, isBoolean } from 'Acid';
import { Client } from './index.js';
export async function initialize(config, client) {
	const {
		packet: {
			headers: {
				id: clientId,
				key: publicKey
			},
			message
		},
		destination: server,
		connection,
	} = config;
	const {
		encryptKeypair: {
			publicKey: serverPublicKey,
			privateKey: serverPrivateKey
		},
		clients,
		sessionKeys,
		configuration: { id: serverId }
	} = server;
	const {
		address: ip,
		port
	} = connection;
	// When changing to a new sessionKeys you must first create new keys from scratch to replace these.
	client.sessionKeys = sessionKeys;
	// When changing to a new key you must first create new keys from scratch to replace these.
	client.keypair = {
		publicKey: serverPublicKey,
		privateKey: serverPrivateKey
	};
	success(`key: ${toBase64(publicKey)}`);
	success(`receiveKey: ${toBase64(sessionKeys.receiveKey)}`);
	success(`transmitKey: ${toBase64(sessionKeys.transmitKey)}`);
	success(`Ephemeral Key: ${toBase64(publicKey)}`);
	/*
		When the client sends to server it includes the client ID in the header
		This also validates origin as any following requests must use this Server Connection ID
		Server IDs are typically larger encrypted
		Server IDs can be random with some actionable info
		The client ID can be used as the base of the server ID and then generate the rest to form a unique server specific ID
	*/
	success(`Client Connection ID: ${toBase64(clientId)}`);
	/*
		The server's connection ID is used for loadbalancing, internal packet analysis,
		client/server privacy, client/server security, congestion control, connection migration, and external analysis obfuscation.
		The connection ID can be encrypted when being sent to the client it uses the clientID when client sends to the server it uses the provided Server ID. Both are in the same location in the header with a property with the name "id".
		Encrypting the connection ID allows for the server to be able to identify the client without leaking any internal network information & protect it from further analysis & certain attacks.
	*/
	// The server's connection id is a value that is used to identify a specific client to the server.
	const serverClientId = Buffer.concat([server.id, randomBuffer(4)]);
	const serverConnectionIdString = toBase64(serverClientId);
	console.log(`Server Connection ID: ${toBase64(serverClientId)}`);
	if (clients.has(serverConnectionIdString)) {
		failed('ID IN USE NEED TO RE-CHECK FOR A NEW ID');
	} else {
		success(`Server client ID is open ${serverConnectionIdString}`);
	}
	clients.set(serverConnectionIdString, client);
	client.id = serverClientId;
	client.idString = serverConnectionIdString;
	if (isBoolean(server.encryptClientConnectionId)) {
		this.encryptConnectionId = true;
	} else if (message.encryptConnectionId) {
		// allow a public key to be given to encrypt the connection id?
		// Useful when two large apps are speaking to each other but want to reduce MiM analysis
		// could also ask for the session keys to be used instead?
		this.encryptConnectionId = true;
	}
	client.destination = {
		publicKey,
		ip,
		port,
		id: clientId
	};
	if (!server.realtime && server.gracePeriod) {
		client.gracePeriod = setTimeout(() => {
			const lastActive = (Date.now() - client.lastActive) / 1000;
			if (client.state === 1 || lastActive > 30) {
				client.destroy(1);
			}
		}, 30000);
	}
	success(`client Created: ID:${serverConnectionIdString} ${ip}:${port}`);
	await server.clientEvent('constructed', `SID${serverConnectionIdString}`, `CID${client.clientIdString}`);
	await client.created();
	client.cachePacketSendConfig();
	return client;
}

