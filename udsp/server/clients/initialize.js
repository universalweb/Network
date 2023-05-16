import { created } from './created.js';
import {
	toBase64, emptyNonce, randombytes_buf, keypair, signVerifyHash, decrypt, sessionKeys
} from '#crypto';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { construct, keys } from 'Acid';
import { Client } from './index.js';
export async function initialize(config) {
	const {
		client,
		packet,
		server,
		connection,
		receiveKey,
		transmitKey
	} = config;
	const {
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
	} = server;
	const publicKey = packet.headers.key;
	const clientId = packet.headers.id;
	const nonce = packet.headers.nonce;
	success(`key: ${toBase64(publicKey)}`);
	success(`receiveKey: ${toBase64(receiveKey)}`);
	success(`transmitKey: ${toBase64(transmitKey)}`);
	success(`nonce: ${toBase64(nonce)}`);
	success(`idc: ${toBase64(packet.message.idc)}`);
	success(`sig: ${toBase64(packet.message.sig)}`);
	const idc = packet.message.idc;
	const sig = packet.message.sig;
	if (!idc) {
		return failed('No Identity Provided', connection);
	}
	if (!sig) {
		return failed('No Sig Provided', connection);
	}
	success(`Decrypted`);
	const sigVerify = signVerifyHash(sig, Buffer.concat([nonce, publicKey]), idc.key);
	console.log('Concat Sig', Buffer.concat([nonce, publicKey]));
	console.log('SIGNature Hash', sig);
	console.log('Ephemeral Key', publicKey);
	const {
		clients,
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
	if (clients.has(serverIdString)) {
		failed('ID IN USE NEED TO MAKE SOME RANDOM BITS - PATCH THIS');
	} else {
		success(`Server client ID is open ${serverIdString}`);
	}
	// success(`MESSAGE SENT TIME: ${sentTime}`);
	clients.set(serverIdString, client);
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
	client.publicKey = publicKey;
	client.id = serverIdString;
	client.clientIdRaw = clientId;
	client.serverIdRaw = serverIdBuffer;
	client.address = address;
	client.port = port;
	client.transmitKey = transmitKey;
	client.receiveKey = receiveKey;
	if (!server.realtime && server.gracePeriod) {
		client.gracePeriod = setTimeout(() => {
			const lastActive = (Date.now() - client.lastActive) / 1000;
			if (client.state === 1 || lastActive > 30) {
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
	await server.clientEvent('constructed', `SID${client.id}`, `CID${client.clientIdString}`);
	await client.created();
	return client;
}

