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
import {
	construct, keys, isBoolean, intersection
} from '@universalweb/acid';
import { Client } from './index.js';
import { getAlgorithm } from '../../cryptoMiddleware/index.js';
export async function initialize(config) {
	const {
		packet: {
			header: {
				id: clientId,
				key: publicKey,
				cs: cipherSuite,
				css: cipherSuites,
				v: version
			},
		},
		server,
		connection,
	} = config;
	const {
		encryptionKeypair,
		clients,
		configuration: { id: serverId }
	} = server;
	const {
		address: ip,
		port
	} = connection;
	const client = this;
	let selectedCipherSuite = cipherSuite;
	if (cipherSuites) {
		const cipherSelection = intersection(cipherSuites, keys(server.ciphers));
		if (cipherSelection.length) {
			selectedCipherSuite = cipherSelection[0];
		}
	}
	if (selectedCipherSuite) {
		client.cipherSuite = getAlgorithm(selectedCipherSuite);
	} else {
		client.cipherSuite = getAlgorithm(server.cipherSuite);
	}
	client.calculatePacketOverhead();
	client.certificate = server.certificate;
	// When changing to a new key you must first create new keys from scratch to replace these.
	client.keypair = server.keypair;
	client.encryptionKeypair = server.encryptionKeypair;
	client.connectionIdKeypair = server.connectionIdKeypair;
	success(`key: ${toBase64(publicKey)}`);
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
		client.encryptConnectionId = true;
	}
	client.destination = {
		encryptionKeypair: {
			publicKey
		},
		connectionIdKeypair: {
			publicKey
		},
		ip,
		port,
		id: clientId
	};
	await client.setSessionKeys();
	if (!server.realtime && server.connectionGracePeriod) {
		client.connectionGracePeriod = setTimeout(() => {
			const lastActive = (Date.now() - client.lastActive) / 1000;
			if (client.state === 1 || lastActive > 30) {
				client.destroy(1);
			}
		}, 30000);
	}
	success(`client Created: ID:${serverConnectionIdString} ${ip}:${port}`);
	await server.clientEvent('constructed', `Server CID${serverConnectionIdString}`, `Client CID${client.clientIdString}`);
	await client.created();
	return client;
}

