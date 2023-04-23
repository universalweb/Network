import {
	success, failed, imported, msgSent, info
} from '#logs';
import { buildPacketSize } from '#utilities/buildPacketSize.js';
import { buildStringSize } from '#utilities/buildStringSize.js';
import {
	encode,
	decode
} from 'msgpackr';
import {
	assign,
	chunk,
	omit
} from 'Acid';
import {
	encrypt,
	nonceBox,
	toBase64,
	hashSign
} from '#crypto';
// clientId, nonce, encrypted message size, flags, packet size.
async function send(client, rawMessage, options) {
	const {
		address,
		port,
		nonce,
		transmitKey,
		clientIdRaw: clientId
	} = client;
	const { sid } = rawMessage;
	success(`PROCESSING MESSAGE TO SEND`);
	console.log('Packet Options', options);
	console.log('Raw Message', rawMessage);
	success(`clientId: ${toBase64(clientId)}`);
	success(`Transmit Key ${toBase64(transmitKey)}`);
	let size = 0;
	let headLength = 0;
	let bodyLength = 0;
	let {
		head,
		body
	} = rawMessage;
	const message = rawMessage;
	const msgTemplate = omit(rawMessage, ['body', 'head']);
	const queued = {
		sid,
		rawMessage,
		options,
	};
	if (head) {
		head = encode(head);
		console.log(chunk(head, 100));
		message.head = head;
		headLength = head.length;
		queued.headLength = headLength;
		size = size + headLength;
		success('HEAD PAYLOAD', headLength);
	}
	if (body) {
		body = encode(body);
		message.body = body;
		bodyLength = body.length;
		queued.bodyLength = bodyLength;
		size = size + bodyLength;
		success('BODY PAYLOAD', bodyLength);
	}
	queued.size = size;
	if (sid) {
		console.log('Queued Message', queued);
		client.sendQueue.set(sid, queued);
	}
	if (size > this.maxPayloadSize) {
		console.log('SEND - Item is too large will need to chunk into packets.');
		const afterHeadMax = this.maxPayloadSize - headLength;
		queued.headEnd = afterHeadMax;
		message.bSize = bodyLength;
		message.hSize = headLength;
		if (headLength < this.maxPayloadSize) {
			// If the body is larger than the max packet size.
			if (bodyLength > size) {
				/*
						The max body size that can be sent in the first packet
						is equal to the header size subtracted from the max packet size.
					*/
				let currentIndex = 0;
				const firstBody = body.slice(0, afterHeadMax);
				const firstPacket = assign({
					// Body start Index to store info correctly
					bi: 0,
					bl: bodyLength,
					// Head State - true means completed within a single packet
					hs: true,
					head,
					hl: headLength,
					body: firstBody
				}, msgTemplate);
				this.sendPacket(firstPacket, address, port, nonce, transmitKey, clientId);
				while (currentIndex < bodyLength) {
					currentIndex = currentIndex + 800;
					const packetChunk = assign({
						// Body start Index to store info correctly
						bi: currentIndex,
						body: body.slice(currentIndex, currentIndex + 800)
					}, msgTemplate);
					this.sendPacket(packetChunk, address, port, nonce, transmitKey, clientId);
				}
			}
		} else if (headLength > this.maxPayloadSize) {
		}
		/**
				* Both head and body are treated as the same array of data.
				* If the head is 200bytes and the body is 200bytes the total range is 400.
				* At index range 0 it would be at the start of the header data while 201 may be the start of the body.
				* This is used to setup ranges for efficient reliability algorithms & chunking.
			*/
		console.log('Room left after head size calculated', afterHeadMax);
	} else {
		return this.sendPacket(rawMessage, address, port, nonce, transmitKey, clientId);
	}
}
