import {
	promise, assign, omit,
	eachArray, stringify,
	get,
	isBuffer, isPlainObject,
	isArray, isMap, construct
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed, info, msgReceived, msgSent
} from '#logs';
const chunkSize = 700;
const dataEncodingTypesChunked = /stream|file|image|string/;
const dataEncodingTypesStructured = /json|msgpack|struct|/;
/**
 * @todo Prepare Request into singular object.
 * @todo Chunk body data while adding packit number to it.
 * @todo Send all chunks (consider sending pkt1 twice).
 * @todo
 */
export class Ask {
	constructor(config) {
		const {
			message,
			head,
			body,
			options,
			client,
			headers,
			footer,
			sourceContext,
			isClient
		} = config;
		const thisAsk = this;
		const {
			requestQueue,
			packetIdGenerator
		} = client;
		let request;
		if (message) {
			console.log('Message Ask', message);
			request = message;
		} else {
			request = {};
			if (head) {
				request.head = head;
			}
			if (body) {
				request.body = body;
			}
		}
		if (headers) {
			thisAsk.headers = headers;
		}
		if (footer) {
			thisAsk.footer = footer;
		}
		const timeStamp = Date.now();
		thisAsk.created = timeStamp;
		// sid is a Stream ID
		const sid = packetIdGenerator.get();
		request.sid = sid;
		this.request = request;
		this.id = sid;
		if (options.dataEncoding) {
			this.dataEncoding = options.dataEncoding;
		}
		this.client = function() {
			return client;
		};
		requestQueue.set(sid, thisAsk);
		return thisAsk;
	}
	request = {};
	response = {};
	headers = {};
	options = {};
	outgoingPackets = [];
	incomingPackets = [];
	incomingAks = [];
	incomingNacks = [];
	outgoingAcks = [];
	outgoingNacks = [];
	totalOutgoingPackets = 0;
	totalOutgoingPayloadSize = 0;
	// Must be checked for uniqueness
	totalSentConfirmedPackets = 0;
	totalIncomingPackets = 0;
	totalIncomingPayloadSize = 0;
	// Must be checked for uniqueness
	totalReceivedPackets = 0;
	/* `state = 0;` is initializing the `state` property of the `Ask` class to `0`. This property is used
	to keep track of the state of the request, where `0` represents an unsent request, `1` represents a
	request that is currently being sent, and `2` represents a completed request. */
	state = 0;
	flushOut() {
		this.outgoingPayload = {};
		this.outgoingPackets = [];
		this.outgoingChunks = [];
		this.totalOutgoingPackets = 0;
		this.totalOutgoingPayloadSize = 0;
	}
	// Flush all body
	flush() {
		this.flushOut();
		this.flushAsk();
	}
	// Flush All body and remove this reply from the map
	destroy() {
		this.flush();
		this.client().requestQueue.delete(this.sid);
	}
	async sendPacket(arg) {
		const {
			message,
			options,
			headers,
			footer
		} = arg;
		const client = this.client();
		if (options) {
			console.log(`Sending msg with options var`);
		}
		if (headers) {
			console.log(`Sending msg with headers var`);
		}
		if (footer) {
			console.log(`Sending msg with footer var`);
		}
		console.log('Handover to Server Reply Packet to Send');
		if (message.act) {
			console.log(message.act);
		}
		await client.send(arg);
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
	async buildRequestPackets() {
		const thisReply = this;
		const { request } = thisReply;
		const { sid } = request;
		if (request.body && request.body.length > chunkSize) {
			console.log(request.body.length);
			const chunks = await thisReply.chunk(request.body);
			const packetLength = chunks.length;
			thisReply.totalOutgoingPackets = packetLength;
			eachArray(chunks, (item, pid) => {
				const outgoingPacket = {
					pid,
					sid
				};
				if (pid === 0) {
					outgoingPacket.pt = packetLength;
					assign(outgoingPacket, omit(request, ['body']));
				}
				outgoingPacket.body = item;
				thisReply.outgoingPackets[pid] = outgoingPacket;
			});
		} else {
			request.pt = 0;
			thisReply.outgoingPackets[0] = request;
		}
	}
	async buildRequest() {
		const dataEncoding = this.dataEncoding;
		const request = this.request;
		const thisReply = this;
		if (request.body) {
			if (!isBuffer(request.body)) {
				request.body = encode(request.body);
			}
		}
		await this.buildRequestPackets(request);
		thisReply.sendAll();
	}
	sendIDs(packetIDs) {
		const thisReply = this;
		const server = this.server();
		const client = this.client();
		eachArray(packetIDs, (id) => {
			thisReply.sendPacket({
				message: thisReply.outgoingPackets[id]
			});
		});
	}
	async sendAll() {
		const thisReply = this;
		const client = this.client();
		console.log('Ask.sendAll', thisReply.outgoingPackets);
		eachArray(thisReply.outgoingPackets, (message) => {
			thisReply.sendPacket({
				message
			});
		});
	}
	received(message) {
		const thisReply = this;
		const {
			body,
			head,
			// Stream ID
			sid,
			// Packet ID
			pid,
			// Action
			act,
			// Packet total
			pt,
			// Data Encoding
			de,
			// Complete
			cmplt,
			// Finale Packet
			finale,
			// Acknowledgement
			ack,
			// Negative Acknowledgement
			nack
		} = message;
		if (cmplt) {
			return thisReply.destroy();
		}
		if (pt) {
			thisReply.totalIncomingPackets = pt;
		}
		if (de) {
			thisReply.incomingDataEncoding = de;
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
			thisReply.assemble();
		}
	}
	assemble() {
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
		thisReply.process();
		thisReply.flushOut();
	}
	async fetch() {
		const thisAsk = this;
		await this.buildRequest();
		const awaitingResult = promise((accept) => {
			thisAsk.accept = accept;
		});
		return awaitingResult;
	}
	callback(results) {
		console.log('Request Results', results);
		this.accept(results);
	}
}
export async function ask(source) {
	return construct(Ask, omit);
}
