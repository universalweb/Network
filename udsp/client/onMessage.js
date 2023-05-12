import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket } from '#udsp/decodePacket';
imported('Server onMessage');
import { reKey } from '#udsp/reKey';
export async function onMessage(packetEncoded) {
	const {
		receiveKey,
		nonce,
		keypair
	} = this;
	msgReceived('Message Received');
	const packet = await decodePacket({
		receiveKey,
		nonce,
		packetEncoded
	});
	const [headers] = packet;
	if (headers?.key) {
		msgReceived(`New PublicKey received ${headers.key.length}`);
		this.destination.publicKey = headers.key;
		reKey(this.transmitKey, this.receiveKey, keypair.publicKey, keypair.privateKey, headers.key);
	}
	this.processMessage(packet);
}

