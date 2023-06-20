import {
	promise, assign, omit,
	eachArray, stringify,
	get,
	isBuffer, isPlainObject,
	isArray, isMap, construct,
	each, hasLength,
	hasValue
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed, info, msgReceived, msgSent
} from '#logs';
const chunkSize = 700;
const dataEncodingTypesChunked = /stream|file|image|string/;
const dataEncodingTypesStructured = /json|Packetpack|struct|/;
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
			queue,
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
		const { onData, } = options;
		this.on({
			onData,
		});
		queue.set(sid, thisAsk);
		return thisAsk;
	}
	flushOutgoing() {
		this.outgoingAcks = null;
		this.outgoingNacks = null;
		this.outgoingPayload = null;
		this.outgoingPackets = null;
		this.outgoingChunks = null;
		this.totalSentConfirmedPackets = null;
		this.totalOutgoingPayloadSize = null;
	}
	flushIncoming() {
		this.incomingPackets = null;
		this.incomingAks = null;
		this.incomingNacks = null;
		this.totalOutgoingPackets = null;
		this.totalOutgoingPayloadSize = null;
		this.totalReceivedPackets = null;
	}
	// Flush all body
	flush() {
		this.flushOutgoing();
		this.flushIncoming();
		this.completed = Date.now();
	}
	// Flush All body and remove this reply from the map
	destroy() {
		console.log(`Destroying Ask ${this.id}`);
		this.flush();
		this.client().queue.delete(this.id);
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
			info(`Sending Packet with options`);
		}
		if (headers) {
			info(`Sending Packet with headers`);
		}
		if (footer) {
			info(`Sending Packet with footer`);
		}
		if (footer) {
			info(`Sending Packet with footer`);
		}
		if (message.act) {
			info(`Sending Packet with act ${message.act}`);
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
	async onPacket(packet) {
		const thisReply = this;
		const { message } = packet;
		const {
			body,
			head,
			// Stream ID
			sid: streamId,
			// Packet ID
			pid: packetId,
			// Action
			act,
			// Packet total
			pt: totalIncomingUniquePackets,
			// Data Encoding
			de: incomingDataEncoding,
			// Complete
			cmplt,
			// Finale Packet
			finale,
			// Acknowledgement
			ack,
			// Negative Acknowledgement
			nack
		} = message;
		console.log(`Stream Id ${streamId}`);
		if (hasValue(totalIncomingUniquePackets)) {
			thisReply.totalIncomingUniquePackets = totalIncomingUniquePackets;
		}
		if (incomingDataEncoding) {
			thisReply.incomingDataEncoding = incomingDataEncoding;
		}
		thisReply.totalReceivedPackets++;
		if (hasValue(packetId)) {
			if (!thisReply.incomingPackets[packetId]) {
				thisReply.incomingPackets[packetId] = message;
				if (body) {
					await this.onData(message);
				}
				thisReply.totalReceivedUniquePackets++;
			}
		} else {
			thisReply.incomingPackets[0] = message;
			thisReply.totalReceivedUniquePackets = 1;
			thisReply.totalIncomingUniquePackets = 1;
		}
		if (thisReply.totalIncomingUniquePackets === thisReply.totalReceivedUniquePackets) {
			thisReply.state = 2;
		}
		if (thisReply.state === 2 || cmplt) {
			thisReply.assemble();
		}
		console.log('On Packet event', thisReply);
	}
	async onData(message) {
		console.log('On Data event');
		const {
			pid,
			body
		} = message;
		this.data[pid] = body;
		if (this.events.data) {
			this.events.data(body, pid);
		}
	}
	async assemble() {
		const thisReply = this;
		if (hasLength(thisReply.data)) {
			const { incomingDataEncoding } = thisReply;
			thisReply.response.body = Buffer.concat(thisReply.data);
			if (incomingDataEncoding === 'struct' || !incomingDataEncoding) {
				thisReply.response.body = decode(thisReply.response.body);
			}
		}
		console.log('Assemble', thisReply.response.body);
		thisReply.accept(thisReply);
		thisReply.destroy();
	}
	on(events) {
		const thisReply = this;
		each(events, (item, propertyName) => {
			thisReply.events[propertyName] = (data) => {
				return item.call(thisReply, data);
			};
		});
	}
	async fetch() {
		const thisAsk = this;
		await this.buildRequest();
		const awaitingResult = promise((accept) => {
			thisAsk.accept = accept;
		});
		return awaitingResult;
	}
	isAsk = true;
	request = {};
	response = {};
	// this is the data in order may have missing packets at times but will remain in order
	data = [];
	// This is as the data came in over the wire out of order
	stream = [];
	events = {};
	headers = {};
	options = {};
	outgoingPackets = [];
	incomingPackets = [];
	incomingAks = [];
	incomingNacks = [];
	outgoingAcks = [];
	outgoingNacks = [];
	totalReceivedUniquePackets = 0;
	totalOutgoingPackets = 0;
	totalOutgoingPayloadSize = 0;
	// Must be checked for uniqueness
	totalSentConfirmedPackets = 0;
	totalIncomingUniquePackets = 1;
	totalIncomingPayloadSize = 0;
	// Must be checked for uniqueness
	totalReceivedPackets = 0;
	/* `state = 0;` is initializing the `state` property of the `Ask` class to `0`. This property is used
	to keep track of the state of the request, where `0` represents an unsent request, `1` represents a
	request that is currently being sent, and `2` represents a completed request. */
	state = 0;
}
export async function ask(source) {
	return construct(Ask, omit);
}
