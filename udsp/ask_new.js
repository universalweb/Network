import {
	isEmpty, promise, eachArray, assign, construct, stringify, hasValue, get
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
const chunkSize = 700;
const transferEncodingTypesChunked = /stream|file|image|string/;
export class Ask {
	constructor(request, client) {
		const thisAsk = this;
		const {
			askQueue,
			packetIdGenerator
		} = client;
		const sid = packetIdGenerator.get();
		const timeStamp = Date.now();
		thisAsk.created = timeStamp;
		thisAsk.client = function() {
			return client;
		};
		thisAsk.sid = sid;
		thisAsk.request.sid = sid;
		askQueue.set(sid, thisAsk);
		thisAsk.received(request);
		return thisAsk;
	}
	// Incoming
	message = {};
	// Outgoing origin Request
	request = {};
	// Response from destination
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
	flushIn() {
		this.incomingPayload = {};
		this.incomingPackets = [];
		this.incomingChunks = [];
		this.totalIncomingPackets = 0;
		this.totalIncomingPayloadSize = 0;
	}
	// Flush Ask Body to Free Memory
	flushOut() {
		this.outgoingPayload = {};
		this.outgoingPackets = [];
		this.outgoingChunks = [];
		this.totalOutgoingPackets = 0;
		this.totalOutgoingPayloadSize = 0;
	}
	// Flush all body
	flush() {
		this.flushIn();
		this.flushOut();
	}
	// Flush All body and remove this ask from the map
	destroy() {
		this.flush();
		this.server().askQueue.delete(this.sid);
	}
	// Raw Send Packet
	sendPacket(message, serverArg, client) {
		if (serverArg) {
			return serverArg.send(client, message);
		}
		const server = this.server();
		server.send(server.client(), message);
	}
	chunk(body) {
		const chunks = [];
		const packetLength = body.length;
		for (let index = 0; index < packetLength;index += chunkSize) {
			const chunk = body.subarray(index, index + chunkSize);
			chunks.push(chunk);
		}
		return chunks;
	}
	sendChunked(packet, transferEncoding) {
		const thisAsk = this;
		if (packet.body && packet.body.length > 700) {
			const chunks = thisAsk.chunk(packet.body);
			const packetLength = chunks.length;
			thisAsk.totalOutgoingPackets = packetLength;
			eachArray(chunks, (item, id) => {
				const outgoingPacket = assign({}, packet);
				if (id === 0) {
					outgoingPacket.te = transferEncoding;
					outgoingPacket.pt = packetLength;
				}
				outgoingPacket.pid = id;
				outgoingPacket.body = item;
				thisAsk.outgoingPackets[id] = outgoingPacket;
			});
		} else {
			packet.en = transferEncoding;
			packet.pt = 0;
			thisAsk.outgoingPackets[0] = packet;
		}
	}
	// transferEncoding types: json, stream, file,
	send(transferEncoding) {
		const request = this.request;
		const thisAsk = this;
		msgSent('ASK.SEND', request);
		if (request.body) {
			if (transferEncodingTypesChunked.test(transferEncoding)) {
				this.sendChunked(request, transferEncoding);
			} else if (transferEncoding === 'struct' || transferEncoding === 'json') {
				request.body = encode(request.body);
				this.sendChunked(request, transferEncoding);
			}
		}
		thisAsk.askAll();
	}
	askIDs(packetIDs) {
		const thisAsk = this;
		const server = this.server();
		const client = this.client();
		eachArray(packetIDs, (id) => {
			server.send(client, thisAsk.outgoingPackets[id]);
		});
	}
	askAll() {
		const thisAsk = this;
		const server = this.server();
		const client = this.client();
		console.log('Ask.askAll', thisAsk.outgoingPackets);
		eachArray(thisAsk.outgoingPackets, (packet) => {
			server.send(client, packet);
		});
	}
	ack(packet) {
		msgReceived('ACK', packet);
	}
	nack(packet) {
		msgReceived('NACK', packet);
	}
	received(packet) {
		const thisAsk = this;
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
		} = packet;
		if (cmplt) {
			return thisAsk.destroy();
		}
		if (pt) {
			thisAsk.totalIncomingPackets = pt;
		}
		if (te) {
			thisAsk.transferEncoding = te;
		}
		if (pid) {
			if (!thisAsk.incomingPackets[pid]) {
				thisAsk.incomingPackets[pid] = packet;
				thisAsk.totalReceivedPackets++;
			}
		} else {
			thisAsk.incomingPackets[0] = packet;
			thisAsk.totalReceivedPackets = 1;
			thisAsk.totalIncomingPackets = 1;
		}
		if (thisAsk.totalIncomingPackets === thisAsk.totalReceivedPackets) {
			thisAsk.state = 2;
		}
		if (thisAsk.state === 2) {
			thisAsk.assemble();
		}
	}
	assemble() {
		const thisAsk = this;
		const { transferEncoding } = thisAsk;
		if (thisAsk.totalIncomingPackets === 1) {
			thisAsk.response = thisAsk.incomingPackets[0];
			return thisAsk.process();
		}
		const packet = thisAsk.incomingPackets[0];
		eachArray(thisAsk.incomingPackets, (item) => {
			if (item.body) {
				Buffer.concat([packet.body, item.body]);
			}
		});
		if (transferEncoding === 'struct' || !transferEncoding) {
			msgReceived(thisAsk.response);
			if (thisAsk.response.body) {
				thisAsk.response.body = decode(thisAsk.response.body);
			}
		}
		thisAsk.flushIn();
	}
	async process() {
		const response = this.response;
		const {
			body,
			sid,
			evnt,
			act
		} = response;
		const {
			events,
			actions
		} = this.server();
		const thisAsk = this;
		const eventName = act || evnt;
		const method = (act) ? actions.get(act) : events.get(evnt);
		if (method) {
			info(`Request:${eventName} RequestID: ${sid}`);
			console.log(response);
			const hasRequest = await method(response, this);
			return;
		} else {
			return failed(`Invalid method name given. ${stringify(response)}`);
		}
	}
}
export function ask(message, client) {
	const { askQueue } = client;
	const { sid } = message;
	msgReceived(`Stream ID: ${sid}`);
	if (askQueue.has(sid)) {
		msgReceived(`ASK FOUND: ${sid}`);
		return askQueue.get(sid);
	}
	msgReceived(`CREATE ASK: ${sid}`, message);
	return construct(Ask, [message, client]);
}
