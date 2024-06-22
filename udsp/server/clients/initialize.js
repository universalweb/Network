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
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
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
			certificate,
			scale
		},
		connection: {
			address: ip,
			port
		},
	} = config;
	this.scale = server?.scale;
	const client = this;
	client.connectionIdSize = connectionIdSize;
	// When changing to a new key you must first create new keys from scratch to replace these.
	client.publicKey = serverPublicKey;
	client.privateKey = serverPrivateKey;
	const serverConnectionIdString = generateConnectionId(connectionIdSize, serverId);
	const serverClientId = connectionIdToBuffer(serverConnectionIdString);
	console.log(`Server Connection ID: ${serverClientId} SIZE: ${connectionIdSize}`);
	client.id = serverClientId;
	client.connectionIdString = serverConnectionIdString;
	assign(client.destination, {
		ip,
		port
	});
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

