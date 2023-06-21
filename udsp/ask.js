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
			packetIdGenerator,
			maxPacketSize
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
		const streamId = packetIdGenerator.get();
		request.sid = streamId;
		this.request = request;
		this.id = streamId;
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
		this.maxPacketSize = maxPacketSize;
		queue.set(streamId, thisAsk);
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
	destroy(err) {
		this.state = 2;
		if (err) {
			this.err = err;
		}
		console.log(`Destroying Ask ${this.id}`);
		this.flush();
		this.client().queue.delete(this.id);
	}
	sendCompleted() {
		const thisAsk = this;
		const { id: sid } = thisAsk;
		thisAsk.sendPacket({
			message: {
				sid,
				cmplt: true
			}
		});
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
		const { maxPacketSize } = this;
		for (let index = 0; index < packetLength;index += maxPacketSize) {
			const chunk = body.subarray(index, index + maxPacketSize);
			chunks.push(chunk);
		}
		return chunks;
	}
	async buildRequestPackets() {
		const thisAsk = this;
		const {
			request,
			id: sid
		} = thisAsk;
		if (request.body && request.body.length > chunkSize) {
			console.log(request.body.length);
			const chunks = await thisAsk.chunk(request.body);
			const packetLength = chunks.length;
			thisAsk.totalOutgoingPackets = packetLength;
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
				thisAsk.outgoingPackets[pid] = outgoingPacket;
			});
		} else {
			request.pt = 0;
			thisAsk.outgoingPackets[0] = request;
		}
	}
	async buildRequest() {
		const dataEncoding = this.dataEncoding;
		const request = this.request;
		const thisAsk = this;
		if (request.body) {
			if (!isBuffer(request.body)) {
				request.body = encode(request.body);
			}
		}
		await this.buildRequestPackets(request);
		thisAsk.sendAll();
	}
	sendIDs(packetIDs) {
		const thisAsk = this;
		const server = this.server();
		const client = this.client();
		eachArray(packetIDs, (id) => {
			thisAsk.sendPacket({
				message: thisAsk.outgoingPackets[id]
			});
		});
	}
	async sendAll() {
		const thisAsk = this;
		const client = this.client();
		console.log('Ask.sendAll', thisAsk.outgoingPackets);
		eachArray(thisAsk.outgoingPackets, (message) => {
			thisAsk.sendPacket({
				message
			});
		});
	}
	async onPacket(packet) {
		const thisAsk = this;
		thisAsk.lastPacketTime = Date.now();
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
			// Dat payload size
			tps: totalIncomingPayloadSize,
			// Data Encoding
			de: incomingDataEncoding,
			// Complete
			cmplt,
			// Finale Packet
			finale,
			// Acknowledgement
			ack,
			// Negative Acknowledgement
			nack,
			err
		} = message;
		console.log(`Stream Id ${streamId}`);
		if (hasValue(totalIncomingUniquePackets)) {
			thisAsk.totalIncomingUniquePackets = totalIncomingUniquePackets;
		}
		if (hasValue(totalIncomingPayloadSize)) {
			thisAsk.totalIncomingPayloadSize = totalIncomingPayloadSize;
		}
		if (incomingDataEncoding) {
			thisAsk.incomingDataEncoding = incomingDataEncoding;
		}
		thisAsk.totalReceivedPackets++;
		if (hasValue(packetId)) {
			if (!thisAsk.incomingPackets[packetId]) {
				thisAsk.incomingPackets[packetId] = message;
				if (body) {
					await this.onData(message);
				}
				thisAsk.totalReceivedUniquePackets++;
			}
		} else {
			thisAsk.incomingPackets[0] = message;
			thisAsk.totalReceivedUniquePackets = 1;
			thisAsk.totalIncomingUniquePackets = 1;
		}
		if (cmplt) {
			thisAsk.state = 2;
		}
		if (err) {
			return this.destroy(err);
		}
		if (thisAsk.state === 2 || cmplt) {
			thisAsk.assemble();
		}
		console.log('On Packet event', thisAsk);
	}
	async onData(message) {
		console.log('On Data event');
		const {
			pid,
			body
		} = message;
		this.data[pid] = body;
		this.currentPayloadSize += body.length;
		if (this.totalIncomingPayloadSize) {
			this.progress = this.totalIncomingPayloadSize / this.currentPayloadSize;
			console.log('Progress', this.progress);
		}
		if (this.events.data) {
			this.events.data(body, pid);
		}
	}
	async assemble() {
		const thisAsk = this;
		if (hasLength(thisAsk.data)) {
			const { incomingDataEncoding } = thisAsk;
			thisAsk.response.body = Buffer.concat(thisAsk.data);
			if (incomingDataEncoding === 'struct' || !incomingDataEncoding) {
				try {
					thisAsk.response.body = decode(thisAsk.response.body);
				} catch (err) {
					return this.destroy('Failed to decode incoming data');
				}
			}
		}
		console.log('Assemble', thisAsk.response.body);
		thisAsk.accept(thisAsk);
		thisAsk.destroy();
	}
	on(events) {
		const thisAsk = this;
		each(events, (item, propertyName) => {
			thisAsk.events[propertyName] = (data) => {
				return item.call(thisAsk, data);
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
	currentPayloadSize = 0;
	progress = 0;
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
