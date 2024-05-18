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
import { getCipherSuite } from '../../cryptoMiddleware/index.js';
export async function initialize(config) {
	const {
		packet,
		server,
		server: {
			id: serverId,
			realtime,
			gracePeriod,
			heartbeat,
			cipherSuites: serverCipherSuites,
			cipherSuite: serverCipherSuite,
			publicKey: serverPublicKey,
			privateKey: serverPrivateKey,
			connectionIdSize,
			certificate
		},
		connection: {
			address: ip,
			port
		},
	} = config;
	const header = packet.header;
	const publicKey = header[2];
	console.log('Client initialize Packet Header', packet.header);
	if (!publicKey) {
		console.trace('Client Public Key is missing');
		return;
	}
	success(`key: ${toBase64(publicKey)}`);
	const client = this;
	const clientId = header[3];
	success(`Client Connection ID: ${clientId.toString('hex')}`);
	const cipherSuiteId = header[4];
	const version = header[5];
	const cipherSuites = header[6];
	if (hasValue(cipherSuiteId)) {
		client.cipherSuite = certificate.getCipherSuite(cipherSuiteId);
	} else if (cipherSuites) {
		// Add support for multiple cipher suites array permit server to prioritize cipher suites.
		client.cipherSuite = certificate.selectCipherSuite(cipherSuites[0]);
	}
	if (!client.cipherSuite) {
		this.close();
	}
	client.connectionIdSize = connectionIdSize;
	// When changing to a new key you must first create new keys from scratch to replace these.
	client.publicKey = serverPublicKey;
	client.privateKey = serverPrivateKey;
	const serverConnectionIdString = generateConnectionId(connectionIdSize, serverId);
	const serverClientId = connectionIdToBuffer(serverConnectionIdString);
	console.log(`Server Connection ID: ${serverClientId} SIZE: ${connectionIdSize} CLIENT: ${clientId.toString('hex')}`);
	client.id = serverClientId;
	client.connectionIdString = serverConnectionIdString;
	assign(client.destination, {
		publicKey,
		ip,
		port,
		id: clientId,
		connectionIdSize: clientId.length,
	});
	client.calculatePacketOverhead();
	await client.setSession();
	if (!realtime && gracePeriod) {
		client.gracePeriodTimeout = setTimeout(() => {
			const lastActive = Date.now() - client.lastActive;
			console.log('Client Grace Period reached killing connection', lastActive > gracePeriod, client);
			if (client.state <= 1 || lastActive > heartbeat) {
				client.close(1);
			}
		}, gracePeriod);
	}
	success(`client Created: ID:${serverConnectionIdString} - Client CID${client.clientIdString} => ${ip}:${port}`);
	return client;
}

