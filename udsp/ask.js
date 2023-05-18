import {
	promise, assign, omit, eachArray, stringify, get, isBuffer, isPlainObject, isArray, isMap
} from 'Acid';
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
	constructor(request, options) {
		const thisAsk = this;
		this.request = request;
		const timeStamp = Date.now();
		const {
			client,
			header,
			footer
		} = options;
		const {
			requestQueue,
			packetIdGenerator
		} = client;
		// sid is a Stream ID
		const sid = packetIdGenerator.get();
		request.sid = sid;
		thisAsk.created = timeStamp;
		if (options.dataEncoding) {
			this.dataEncoding = options.dataEncoding;
		}
		this.client = function() {
			return client;
		};
		const awaitingResult = promise((accept) => {
			thisAsk.accept = accept;
		});
		requestQueue.set(sid, thisAsk);
		thisAsk.proccessRequest(request);
		return awaitingResult;
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
	async sendPacket(request) {
		const client = this.client();
		const options = this.options;
		const headers = this.headers;
		const footer = this.footer;
		if (this.options) {
			console.log(`Sending msg with options var`, options);
		}
		if (this.headers) {
			console.log(`Sending msg with headers var`, headers);
		}
		if (this.footer) {
			console.log(`Sending msg with footer var`, footer);
		}
		console.log('Handover to Server Reply Packet to Send', request, headers, options);
		client.send(request, headers, footer, options);
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
	async buildRequestPackets() {
		const thisReply = this;
		const { request } = thisReply;
		const { sid } = request;
		console.log(request.body.length);
		if (request.body && request.body.length > chunkSize) {
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
			thisReply.sendPacket(thisReply.outgoingPackets[id]);
		});
	}
	async sendAll() {
		const thisReply = this;
		const client = this.client();
		console.log('Ask.sendAll', thisReply.outgoingPackets);
		eachArray(thisReply.outgoingPackets, (packet) => {
			thisReply.sendPacket(packet);
		});
	}
	received(message) {
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
			thisReply.dataEncoding = te;
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
		const { dataEncoding } = thisReply;
		if (thisReply.totalIncomingPackets === 1) {
			thisReply.request = thisReply.incomingPackets[0];
			return thisReply.process();
		}
		const packet = thisReply.incomingPackets[0];
		eachArray(thisReply.incomingPackets, (item) => {
			if (item.body) {
				Buffer.concat([packet.body, item.body]);
			}
		});
		if (dataEncoding === 'struct' || !dataEncoding) {
			msgReceived(thisReply.request);
			if (thisReply.request.body) {
				thisReply.request.body = decode(thisReply.request.body);
			}
		}
		thisReply.flushOut();
	}
	async proccessRequest() {
		await this.buildRequest();
	}
	callback(results) {
		console.log('Request Results', results);
		this.accept(results);
	}
}
