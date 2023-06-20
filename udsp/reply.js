import {
	isEmpty, isBuffer, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#udsp/processEvent';
const chunkSize = 700;
const incomingDataEncodingTypesChunked = /stream|file|image|binary|string/;
/**
	* @todo Add promise to send use the method that Ask uses assign the accept, return it, and when completed execute.
*/
export class Reply {
	constructor(request, client) {
		const thisReply = this;
		const { message } = request;
		console.log(client);
		const {
			queue,
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
		queue.set(sid, thisReply);
		thisReply.sendPacket = function(config) {
			return client.send(config);
		};
		if (client.lastActive) {
			client.lastActive = Date.now();
		}
		thisReply.received(message);
		return thisReply;
	}
	processRequest = function() {
		processEvent(this);
	};
	isReply = true;
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
		this.server().queue.delete(this.sid);
	}
	async chunk(body) {
		const chunks = [];
		const packetLength = body.length;
		for (let index = 0; index < packetLength;index += chunkSize) {
			const chunk = body.subarray(index, index + chunkSize);
			chunks.push(chunk);
		}
		return chunks;
	}
	async buildReplyPackets(response, incomingDataEncoding) {
		const thisReply = this;
		console.log('Body size', response.body.length);
		if (response.body && response.body.length > 700) {
			const chunks = await thisReply.chunk(response.body);
			const packetLength = chunks.length;
			thisReply.totalOutgoingPackets = packetLength;
			eachArray(chunks, (item, id) => {
				const outgoingPacket = assign({
					pid: id
				}, response);
				if (id === 0) {
					if (incomingDataEncoding) {
						outgoingPacket.de = incomingDataEncoding;
					}
					outgoingPacket.pt = packetLength;
				}
				outgoingPacket.body = item;
				thisReply.outgoingPackets[id] = outgoingPacket;
			});
		} else {
			if (incomingDataEncoding) {
				response.de = incomingDataEncoding;
			}
			response.pid = 0;
			response.pt = 1;
			thisReply.outgoingPackets[0] = response;
		}
	}
	// incomingDataEncoding types: json, stream, file,
	async send(incomingDataEncoding) {
		const response = this.response;
		const thisReply = this;
		console.log('Reply.send', response);
		if (response.body) {
			if (isBuffer(response.body)) {
				await this.buildReplyPackets(response, incomingDataEncoding);
			} else if (incomingDataEncoding === 'struct' || incomingDataEncoding === 'json' || !incomingDataEncoding) {
				response.body = encode(response.body);
				await this.buildReplyPackets(response, incomingDataEncoding);
			}
		}
		thisReply.replyAll();
	}
	replyIDs(packetIDs) {
		const thisReply = this;
		eachArray(packetIDs, (id) => {
			thisReply.sendPacket({
				message: thisReply.outgoingPackets[id]
			});
		});
	}
	replyAll() {
		const thisReply = this;
		console.log('outgoingPackets', thisReply.outgoingPackets.length);
		eachArray(thisReply.outgoingPackets, (packet) => {
			thisReply.sendPacket({
				message: packet
			});
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
			de: incomingDataEncoding,
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
		if (incomingDataEncoding) {
			thisReply.incomingDataEncoding = incomingDataEncoding;
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
		const { incomingDataEncoding } = thisReply;
		if (thisReply.totalIncomingPackets === 1) {
			thisReply.request = thisReply.incomingPackets[0];
		}
		const packet = thisReply.incomingPackets[0];
		eachArray(thisReply.incomingPackets, (item) => {
			if (item.body) {
				Buffer.concat([packet.body, item.body]);
			}
		});
		if (incomingDataEncoding === 'struct' || !incomingDataEncoding) {
			msgReceived(thisReply.request);
			if (thisReply.request.body) {
				thisReply.request.body = decode(thisReply.request.body);
			}
		}
		await thisReply.processRequest();
	}
}
export function reply(packet, client) {
	console.log(client);
	return construct(Reply, [packet, client]);
}
