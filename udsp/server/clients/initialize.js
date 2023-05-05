import { created } from './created.js';
import { toBase64, emptyNonce, randombytes_buf } from '#crypto';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function initialize(client, server, connection, receiveKey, transmitKey, clientId) {
	const {
		nodes,
		configuration: { id: serverIdRaw }
	} = server;
	const {
		address,
		port
	} = connection;
	const serverId = String(serverIdRaw);
	const clientIdString = toBase64(clientId);
	const serverConnectionUUID = Buffer.alloc(8);
	randombytes_buf(serverConnectionUUID);
	/*
		Concatenating the serverConnectionUUID and the Server ID is used for loadbalancing or
		for forwarding requests to the correct server.
	*/
	const serverIdBuffer = Buffer.concat([serverConnectionUUID, Buffer.from(serverId)]);
	const serverIdString = toBase64(serverIdBuffer);
	console.log(`Client Connection ID: ${clientIdString}`);
	console.log(`Server Connection ID: ${serverIdString}`);
	if (nodes.has(serverIdString)) {
		failed('ID IN USE NEED TO MAKE SOME RANDOM BITS - PATCH THIS');
	} else {
		success(`Server client ID is open ${serverIdString}`);
	}
	// success(`MESSAGE SENT TIME: ${sentTime}`);
	nodes.set(serverIdString, client);
	/*
		Sending to client using this
		Client connection Ids are smaller than server connection Ids
	*/
	client.clientId = clientIdString;
	/*
		When the client sends to server it must use this
		This also validates origin as any following requests must use this Server Connection ID
		Server IDs are larger and are used for load balancing for efficient routing
		Server IDs can be random with some actionable info
		The client ID can be used as the base of the server ID and then generate the rest to form a unique server specific ID
	*/
	client.serverId = serverIdString;
	client.id = serverIdString;
	client.clientIdRaw = clientId;
	client.serverIdRaw = serverIdBuffer;
	client.address = address;
	client.port = port;
	client.transmitKey = transmitKey;
	client.receiveKey = receiveKey;
	if (!server.realtime && server.gracePeriod) {
		client.gracePeriod = setTimeout(() => {
			if (client.state === 1) {
				client.destroy(1);
			}
		}, 30000);
	}
	client.nonce = emptyNonce();
	// client.publicCertificate = publicCertificate;
	/*
		Packets that need to be sent and confirmed
	*/
	success(`client Created: ID:${serverIdString} ${address}:${port}`);
	console.log(client);
	await server.nodeEvent('constructed', client);
	await client.created();
	return client;
}
