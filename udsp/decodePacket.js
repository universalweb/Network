import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, } from 'msgpackr';
import { assign, } from 'Acid';
import {
	encrypt, nonceBox, toBase64, hashSign, decrypt, boxUnseal, sessionKeys
} from '#crypto';
import { createClient } from './server/clients/index.js';
export async function decodePacket(config) {
	const {
		connection,
		isClient,
		isServer,
		options,
		packetEncoded,
		server,
		source,
		state
	} = config;
	let client = config.client;
	const target = {
		packet: {},
	};
	msgReceived(`Packet Size ${packetEncoded.length}`);
	const packet = decode(packetEncoded);
	const headersEncoded = packet[0];
	if (!headersEncoded) {
		return failed(`No headers -> Invalid Packet`);
	}
	const headers = decode(headersEncoded);
	if (!headers) {
		return failed(`No headers -> Invalid Packet`);
	}
	if (headers.key) {
		success(`Public Key is given -> Processing as create client`);
	} else {
		success(`No Public Key is given -> Processing as a message`);
		console.log(headers);
	}
	const {
		id,
		nonce,
		key
	} = headers;
	let transmitKey;
	let receiveKey;
	if (isServer) {
		const { clients } = server;
		client = clients.get(toBase64(id));
		if (headers.key && !client) {
			const {
				profile: {
					ephemeral: {
						private: serverPrivateKey,
						key: serverPublicKey
					}
				},
			} = server;
			headers.key = boxUnseal(headers.key, serverPublicKey, serverPrivateKey);
			if (!headers.key) {
				return failed(headers.key, 'Client Key Decrypt Failed');
			}
			const sessionKey = sessionKeys(serverPublicKey, serverPrivateKey, headers.key);
			transmitKey = sessionKey.transmitKey;
			receiveKey = sessionKey.receiveKey;
		} else if (client) {
			transmitKey = client.transmitKey;
			receiveKey = client.receiveKey;
			target.client = client;
		} else {
			return failed('Invalid Client id given', toBase64(id), clients.keys());
		}
	} else {
		transmitKey = client.transmitKey;
		receiveKey = client.receiveKey;
	}
	if (isServer) {
		target.transmitKey = transmitKey;
		target.receiveKey = receiveKey;
	}
	const footer = packet[2] && decode(packet[2]);
	if (packet[2] && !footer) {
		return failed(`Footer failed to decode -> Invalid Packet`);
	}
	const ad = (footer) ? Buffer.concat([packet[0], packet[2]]) : packet[0];
	console.log(receiveKey);
	const encryptedMessage = decrypt(packet[1], ad, nonce, receiveKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const message = decode(encryptedMessage);
	if (message.head) {
		success('head PAYLOAD', message.head.length);
	}
	if (message.body) {
		success('body PAYLOAD', message.body.length);
	}
	info('Raw Message', headers, message);
	info(`clientId: ${toBase64(headers.id)}`);
	info(`Transmit Key ${toBase64(receiveKey)}`);
	info(`Nonce Size: ${headers.nonce.length} ${toBase64(headers.nonce)}`);
	const packetSize = packet.length;
	success(`Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	target.packet.headers = headers;
	target.packet.message = message;
	if (footer) {
		target.packet.footer = footer;
	}
	success(`Encrypted Message Size: ${packetEncoded.length}`);
	if (isServer && !client) {
		msgReceived(`Signature is valid`);
		client = await createClient({
			packet: target.packet,
			server,
			connection,
			receiveKey,
			id,
			transmitKey
		});
		target.client = client;
		console.log('CLIENT CREATED', client);
	}
	return target;
}
