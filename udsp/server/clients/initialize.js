import {
	assign,
	construct,
	hasValue,
	intersection,
	isBoolean,
	keys
} from '@universalweb/acid';
import { connectionIdToBuffer, generateConnectionId } from '#udsp/connectionId';
import {
	decrypt,
	keypair,
	randomBuffer,
	randomConnectionId,
	serverSessionKeys,
	toBase64
} from '#crypto';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { created } from './created.js';
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
			publicKeySize,
			heartbeat,
			connectionIdSize,
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
	success(`Client Connection ID: ${clientId.toString('hex')}`);
	const publicKey = header[2];
	console.log('Client initialize Packet Header', packet.header);
	if (!publicKey) {
		console.trace('Client Public Key is missing');
		return;
	}
	success(`key: ${toBase64(publicKey)}`);
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
	const serverConnectionIdString = generateConnectionId(connectionIdSize, serverId);
	const serverClientId = connectionIdToBuffer(serverConnectionIdString);
	console.log(`Server Connection ID: ${serverClientId} SIZE: ${connectionIdSize} CLIENT: ${clientId.toString('hex')}`);
	client.id = serverClientId;
	client.connectionIdString = serverConnectionIdString;
	assign(client.destination, {
		encryptionKeypair: {
			publicKey
		},
		connectionIdKeypair: {
			publicKey
		},
		ip,
		port,
		id: clientId,
		connectionIdSize: clientId.length,
	});
	client.calculatePacketOverhead();
	await client.setSessionKeys();
	if (!realtime && gracePeriod) {
		client.gracePeriod = setTimeout(() => {
			const lastActive = Date.now() - client.lastActive;
			console.log('Client Grace Period reached killing connection', lastActive > gracePeriod, client);
			if (client.state <= 1 || lastActive > heartbeat) {
				client.destroy(1);
			}
		}, gracePeriod);
	}
	success(`client Created: ID:${serverConnectionIdString} - Client CID${client.clientIdString} => ${ip}:${port}`);
	clients.set(serverConnectionIdString, client);
	await client.created();
	return client;
}

