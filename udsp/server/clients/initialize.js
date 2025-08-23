import {
	assign,
	construct,
	hasValue,
	intersection,
	isBoolean,
	keys,
} from '@universalweb/utilitylib';
import { connectionIdToBuffer, generateConnectionId } from '#udsp/connectionId';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success,
} from '#logs';
export async function initialize(config) {
	const {
		packet,
		server,
		server: {
			id: serverId,
			realtime,
			initialGracePeriod,
			initialRealtimeGracePeriod,
			heartbeat,
			cipherSuites: serverCipherSuites,
			cipherSuite: serverCipherSuite,
			publicKey: serverPublicKey,
			privateKey: serverPrivateKey,
			connectionIdSize,
			reservedConnectionIdSize,
			certificate,
			scale,
		},
		connection: {
			address: ip,
			port,
		},
	} = config;
	const client = this;
	client.scale = scale;
	client.initialGracePeriod = initialGracePeriod;
	client.heartbeat = heartbeat;
	client.realtime = realtime;
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
		port,
	});
	if (initialGracePeriod) {
		this.initialGracePeriodCheck();
	}
	return client;
}

