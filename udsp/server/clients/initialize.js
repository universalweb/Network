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
			initialGracePeriod,
			heartbeat,
			cipherSuites: serverCipherSuites,
			cipherSuite: serverCipherSuite,
			publicKey: serverPublicKey,
			privateKey: serverPrivateKey,
			connectionIdSize,
			reservedConnectionIdSize,
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
	client.reservedConnectionIdSize = reservedConnectionIdSize;
	// When changing to a new key you must first create new keys from scratch to replace these.
	client.publicKey = serverPublicKey;
	client.privateKey = serverPrivateKey;
	const serverConnectionIdString = generateConnectionId(connectionIdSize, serverId, reservedConnectionIdSize);
	const serverClientId = connectionIdToBuffer(serverConnectionIdString);
	console.log(`Server Connection ID: ${serverConnectionIdString} SIZE: ${connectionIdSize} SERVER ID: ${serverId} RESERVED SIZE: ${reservedConnectionIdSize}`);
	client.id = serverClientId;
	client.connectionIdString = serverConnectionIdString;
	assign(client.destination, {
		ip,
		port
	});
	this.initialGracePeriod = initialGracePeriod;
	this.heartbeat = heartbeat;
	this.realtime = realtime;
	if (!realtime && initialGracePeriod) {
		this.initialGracePeriodCheck();
	}
	return client;
}

