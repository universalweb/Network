import {
	isEmpty, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize
} from 'Acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#udsp/processEvent';
const chunkSize = 700;
const transferEncodingTypesChunked = /stream|file|image|string/;
/**
	* @todo Add promise to send use the method that Ask uses assign the accept, return it, and when completed execute.
*/
export class Reply {
	constructor(request, client) {
		const thisReply = this;
		const { message } = request;
		console.log(client);
		const {
			replyQueue,
			packetIdGenerator
		} = client;
		const timeStamp = Date.now();
		thisReply.t = timeStamp;
		thisReply.client = function() {
			return client;
		};
		const server = client.server();
		thisReply.server = function() {
			return server;
		};
		const { sid } = message;
		thisReply.sid = sid;
		thisReply.response.sid = sid;
		replyQueue.set(sid, thisReply);
		thisReply.received(message);
		return thisReply;
	}
	headers = {};
	options = {};
	// Incoming
	request = {};
	response = {};
	incomingPackets = [];
	incomingChunks = [];
	totalIncomingPackets = 0;
	totalIncomingPayloadSize = 0;
	// Must be checked for uniqueness
	totalReceivedPackets = 0;
	// Outgoing
	outgoingPayload = {};
	outgoingPackets = [];
	outgoingAcks = [];
	outgoingNacks = [];
	outgoingChunks = [];
	totalOutgoingPackets = 0;
	totalOutgoingPayloadSize = 0;
	/*
		0 Created
		1 Receiving
		2 Received
		3 Sending
		4 Sent
		5 Acknowledged
		6 Completed
	*/
	state = 0;
	// Flush Ask Body to Free Memory
	async flushIn() {
		this.incomingPayload = {};
		this.incomingPackets = [];
		this.incomingChunks = [];
		this.totalIncomingPackets = 0;
		this.totalIncomingPayloadSize = 0;
	}
	// Flush Reply Body to Free Memory
	async flushOut() {
		this.outgoingPayload = {};
		this.outgoingPackets = [];
		this.outgoingChunks = [];
		this.totalOutgoingPackets = 0;
		this.totalOutgoingPayloadSize = 0;
	}
	// Flush all body
	async flush() {
		this.flushOut();
		this.flushAsk();
	}
	// Flush All body and remove this reply from the map
	async destroy() {
		this.flush();
		this.server().replyQueue.delete(this.sid);
	}
	// Raw Send Packet
	async sendPacket(request, client) {
		const options = this.options;
		const headers = this.headers;
		if (this.options) {
			console.log(`Sending msg with options var`, options, `this.options`, this.options);
		}
		if (this.headers) {
			console.log(`Sending msg with headers var`, headers, `this.headers`, this.headers);
		}
		console.log('Handover to Server Reply Packet to Send', request, headers, options);
		client.send(request, headers, options);
	}
	async chunk(body) {
		const chunks = [];
		const packetLength = body.length;
		for (let index = 0; index < packetLength;index += chunkSize) {
			const chunk = body.slice(index, index + chunkSize);
			chunks.push(chunk);
		}
		return chunks;
	}
	sendChunked(packet, transferEncoding) {
		const thisReply = this;
		if (packet.body && packet.body.length > 700) {
			const chunks = thisReply.chunk(packet.body);
			const packetLength = chunks.length;
			thisReply.totalOutgoingPackets = packetLength;
			eachArray(chunks, (item, id) => {
				const outgoingPacket = assign({}, packet);
				if (id === 0) {
					outgoingPacket.te = transferEncoding;
					outgoingPacket.pt = packetLength;
				}
				outgoingPacket.pid = id;
				outgoingPacket.body = item;
				thisReply.outgoingPackets[id] = outgoingPacket;
			});
		} else {
			packet.en = transferEncoding;
			packet.pt = 0;
			thisReply.outgoingPackets[0] = packet;
		}
	}
	// transferEncoding types: json, stream, file,
	send(transferEncoding) {
		const response = this.response;
		const thisReply = this;
		msgSent('REPLY.SEND', response);
		if (response.body) {
			if (transferEncodingTypesChunked.test(transferEncoding)) {
				this.sendChunked(response, transferEncoding);
			} else if (transferEncoding === 'struct' || transferEncoding === 'json') {
				response.body = encode(response.body);
				this.sendChunked(response, transferEncoding);
			}
		}
		thisReply.replyAll();
	}
	replyIDs(packetIDs) {
		const thisReply = this;
		const server = this.server();
		const client = this.client();
		eachArray(packetIDs, (id) => {
			thisReply.sendPacket(thisReply.outgoingPackets[id]);
		});
	}
	replyAll() {
		const thisReply = this;
		const server = this.server();
		const client = this.client();
		console.log('Reply.replyAll', thisReply.outgoingPackets);
		eachArray(thisReply.outgoingPackets, (packet) => {
			thisReply.sendPacket(packet);
		});
	}
	async received(message) {
		const thisReply = this;
		const {
			body,
			head,
			sid,
			pid,
			act,
			pt,
			te,
			cmplt,
			finale,
			ack,
			nack
		} = message;
		if (cmplt) {
			return thisReply.destroy();
		}
		if (pt) {
			thisReply.totalIncomingPackets = pt;
		}
		if (te) {
			thisReply.transferEncoding = te;
		}
		if (pid) {
			if (!thisReply.incomingPackets[pid]) {
				thisReply.incomingPackets[pid] = message;
				thisReply.totalReceivedPackets++;
			}
		} else {
			thisReply.incomingPackets[0] = message;
			thisReply.totalReceivedPackets = 1;
			thisReply.totalIncomingPackets = 1;
		}
		if (thisReply.totalIncomingPackets === thisReply.totalReceivedPackets) {
			thisReply.state = 2;
		}
		if (thisReply.state === 2) {
			await thisReply.assemble();
		}
	}
	async assemble() {
		const thisReply = this;
		const { transferEncoding } = thisReply;
		if (thisReply.totalIncomingPackets === 1) {
			thisReply.request = thisReply.incomingPackets[0];
			return thisReply.processRequest();
		}
		const packet = thisReply.incomingPackets[0];
		eachArray(thisReply.incomingPackets, (item) => {
			if (item.body) {
				Buffer.concat([packet.body, item.body]);
			}
		});
		if (transferEncoding === 'struct' || !transferEncoding) {
			msgReceived(thisReply.request);
			if (thisReply.request.body) {
				thisReply.request.body = decode(thisReply.request.body);
			}
		}
		await thisReply.flushOut();
	}
	async processRequest() {
		const thisReply = this;
		const request = thisReply.request;
		processEvent(request, thisReply);
	}
}
export function reply(packet, client) {
	console.log(client);
	return construct(Reply, [packet, client]);
}
