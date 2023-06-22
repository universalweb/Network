import {
	isEmpty, isBuffer, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#udsp/processEvent';
const incomingDataEncodingTypesChunked = /stream|file|image|binary|string/;
import { flushOutgoing, flushIncoming, flush } from './request/flush.js';
import { destroy } from './request/destory';
import { bufferToArrayChunks } from './request/bufferToArrayChunks';
import { buildReplyPackets } from './request/bufferToPackets';
import { send } from './request/sendPackets';
import { sendPacketsById } from './request/sendPacketsById';
import { sendOutgoing } from './request/sendOutgoing';
import { onPacket } from './request/onPacket';
/**
	* @todo Add promise to send use the method that Ask uses assign the accept, return it, and when completed execute.
*/
export class Reply {
	constructor(request, source) {
		const thisReply = this;
		const { message } = request;
		const { sid } = message;
		console.log(source);
		const {
			queue,
			packetIdGenerator
		} = source;
		const timeStamp = Date.now();
		thisReply.t = timeStamp;
		thisReply.source = function() {
			return source;
		};
		const server = source.server();
		thisReply.server = function() {
			return server;
		};
		thisReply.packetMaxPayload = server.packetMaxPayload;
		thisReply.packetMaxPayloadSafeEstimate = server.packetMaxPayloadSafeEstimate;
		thisReply.sid = sid;
		thisReply.responsePacketTemplate.sid = sid;
		thisReply.response.sid = sid;
		queue.set(sid, thisReply);
		thisReply.sendPacket = function(config) {
			return source.send(config);
		};
		if (source.lastActive) {
			source.lastActive = Date.now();
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
	responsePacketTemplate = {};
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
	flushIncoming = flushIncoming;
	flush = flush;
	destroy = destroy;
	// incomingDataEncoding types: json, stream, file,
	send = send;
	sendPacketsById = sendPacketsById;
	sendOutgoing = sendOutgoing;
	onPacket = onPacket;
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
