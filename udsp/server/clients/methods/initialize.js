import {
	assign,
	construct,
	hasValue,
	intersection,
	isBoolean,
	keys,
} from '@universalweb/utilitylib';
import { connectionIdToBuffer, generateConnectionIdString } from '#udsp/utilities/connectionId';
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
	//  NOTE: Consider accessing these vars via .app or .server instead of copying
	client.scale = scale;
	client.initialGracePeriod = initialGracePeriod;
	client.heartbeat = heartbeat;
	client.realtime = realtime;
	client.connectionIdSize = connectionIdSize;
	client.reservedConnectionIdSize = reservedConnectionIdSize;
	if (certificate) {
		this.logInfo('Certificate Crypto Algos attached');
		client.keyExchange = certificate.keyExchangeAlgorithm;
		client.signatureAlgorithm = certificate.signatureAlgorithm;
	}
	if (serverPublicKey) {
		client.publicKey = serverPublicKey;
	}
	if (serverPrivateKey) {
		client.privateKey = serverPrivateKey;
	}
	const serverConnectionIdString = generateConnectionIdString(connectionIdSize, serverId, reservedConnectionIdSize);
	const serverClientId = connectionIdToBuffer(serverConnectionIdString);
	this.logInfo(`Server Connection ID: ${serverConnectionIdString} SIZE: ${connectionIdSize} SERVER ID: ${serverId} RESERVED SIZE: ${reservedConnectionIdSize}`);
	client.id = serverClientId;
	client.connectionIdString = serverConnectionIdString;
	assign(client.destination, {
		ip,
		port,
	});
	if (client.keyExchange.onServerClientInitialization) {
		await client.keyExchange.onServerClientInitialization(client, server);
	}
	if (initialGracePeriod) {
		await this.initialGracePeriodCheck();
	}
	return client;
}

