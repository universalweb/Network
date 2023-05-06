import { isEmpty, promise, eachArray } from 'Acid';
import { processPacketEvent } from './server/processPacketEvent.js';
export class Reply {
	constructor(message, thisServer) {
		const thisReply = this;
		const {
			replyQueue,
			packetIdGenerator
		} = thisServer;
		const timeStamp = Date.now();
		thisReply.created = timeStamp;
		thisReply.server = function() {
			return thisServer;
		};
		const { sid } = message;
		thisReply.sid = sid;
		replyQueue.set(sid, thisReply);
		thisReply.received(message);
		return thisReply;
	}
	// Incoming
	incomingPayload = {};
	incomingPackets = [];
	incomingChunks = [];
	totalIncomingPackets = 0;
	totalIncomingPayloadSize = 0;
	// Must be checked for uniqueness
	totalReceivedPackets = 0;
	// Outgoing
	outgoingPayload = {};
	outgoingPackets = [];
	outgoingChunks = [];
	totalOutgoingPackets = 0;
	totalOutgoingPayloadSize = 0;
	/*
		0 Created
		1 Receiving
		2 Completed
		3 Sending
		4 Sent
		5 Acknowledged
	*/
	state = 0;
	// Flush Ask Data to Free Memory
	flushAsk() {
		this.incomingPayload = {};
		this.incomingPackets = [];
		this.incomingChunks = [];
		this.totalIncomingPackets = 0;
		this.totalIncomingPayloadSize = 0;
	}
	// Flush Reply Data to Free Memory
	flushReply() {
		this.outgoingPayload = {};
		this.outgoingPackets = [];
		this.outgoingChunks = [];
		this.totalOutgoingPackets = 0;
		this.totalOutgoingPayloadSize = 0;
	}
	// Flush all data
	flush() {
		this.flushReply();
		this.flushAsk();
	}
	// Flush All data and remove this reply from the map
	destroy() {
		this.flush();
		this.server().replyQueue.delete(this.sid);
	}
	// Raw Send Packet
	send(message) {
		this.server().send(message);
	}
	reply(packetIDs) {
		const thisReply = this;
		eachArray(packetIDs, (id) => {
			thisReply.send(thisReply.outgoingPackets[id]);
		});
	}
	replyAll() {
		const thisReply = this;
		eachArray(thisReply.outgoingPackets, (packet) => {
			thisReply.send(packet);
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
			tp
		} = message;
		if (tp) {
			thisReply.totalIncomingPackets = tp;
		}
		if (pid) {
			if (!thisReply.packets[pid]) {
				thisReply.packets[pid] = message;
				thisReply.totalReceivedPackets++;
			}
		}
		if (thisReply.totalIncomingPackets === thisReply.totalReceivedPackets) {
			thisReply.state = 2;
		}
		if (thisReply.state === 2) {
			thisReply.process();
		}
	}
	// Incoming Packets have been received begin to process response by first providing the Reply for API processing
	process() {
		processPacketEvent(this);
	}
}
