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
	construct, keys, isBoolean, intersection, hasValue
} from '@universalweb/acid';
import { Client } from './index.js';
import { getAlgorithm } from '../../cryptoMiddleware/index.js';
export async function initialize(config) {
	const {
		packet,
		server,
		server: {
			encryptionKeypair,
			clients,
			id: serverId,
			realtime,
			gracePeriod,
			cipherSuites: serverCipherSuites,
			cipherSuite: serverCipherSuite,
			keypair: serverKeypair,
			encryptionKeypair: serverEncryptionKeypair,
			connectionIdKeypair: serverConnectionIdKeypair,
			encryptClientConnectionId,
			encryptServerConnectionId,
			publicKeySize
		},
		connection: {
			address: ip,
			port
		},
	} = config;
	const header = packet.header;
	const clientId = packet.id;
	if (!clientId) {
		console.trace('Client ID is missing');
		return;
	}
	const publicKey = header[2];
	if (!publicKey) {
		console.trace('Client Public Key is missing');
		return;
	}
	const client = this;
	let selectedCipherSuite = header[3];
	const version = header[4];
	const cipherSuites = header[5];
	if (hasValue(selectedCipherSuite)) {
		this.cipherSuiteName = selectedCipherSuite;
		client.cipherSuite = getAlgorithm(selectedCipherSuite, this.version);
	} else if (cipherSuites) {
		const cipherSelection = intersection(cipherSuites, keys(serverCipherSuites));
		if (cipherSelection.length) {
			selectedCipherSuite = cipherSelection[0];
		}
	} else {
		console.log(`No cipher suite found going to default ${selectedCipherSuite}`);
		this.cipherSuiteName = serverCipherSuite;
		client.cipherSuite = getAlgorithm(serverCipherSuite, this.version);
	}
	client.publicKeySize = publicKeySize;
	client.calculatePacketOverhead();
	// When changing to a new key you must first create new keys from scratch to replace these.
	client.keypair = serverKeypair;
	client.encryptionKeypair = serverEncryptionKeypair;
	if (serverConnectionIdKeypair) {
		client.connectionIdKeypair = serverConnectionIdKeypair;
		if (isBoolean(encryptClientConnectionId)) {
			client.encryptClientConnectionId = encryptClientConnectionId;
		}
		if (isBoolean(encryptServerConnectionId)) {
			client.encryptServerConnectionId = encryptServerConnectionId;
		}
	}
	success(`key: ${toBase64(publicKey)}`);
	success(`Client Connection ID: ${toBase64(clientId)}`);
	const serverClientId = Buffer.concat([serverId, randomBuffer(4)]);
	const serverConnectionIdString = toBase64(serverClientId);
	console.log(`Server Connection ID: ${toBase64(serverClientId)}`);
	if (clients.has(serverConnectionIdString)) {
		console.trace('ID IN USE NEED TO RE-CHECK FOR A NEW ID');
	} else {
		success(`Server client ID is open ${serverConnectionIdString}`);
	}
	clients.set(serverConnectionIdString, client);
	client.id = serverClientId;
	client.idString = serverConnectionIdString;
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
	if (!realtime && gracePeriod) {
		client.gracePeriod = setTimeout(() => {
			const lastActive = (Date.now() - client.lastActive) / 1000;
			console.log('Client Grace Period reached', gracePeriod, client);
			if (client.state === 1 || lastActive > 30) {
				client.destroy(1);
			}
		}, gracePeriod);
	}
	success(`client Created: ID:${serverConnectionIdString} ${ip}:${port}`);
	await server.clientEvent('constructed', `Server CID${serverConnectionIdString}`, `Client CID${client.clientIdString}`);
	await client.created();
	return client;
}

