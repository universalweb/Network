import { sendPacket } from './sendPacket.js';
import { destroy } from './destory.js';
import { bufferToOutgoingPackets } from './bufferToOutgoingPackets.js';
import { sendCompleted } from './sendCompleted.js';
import { on } from './on.js';
import { initiate } from './fetch.js';
import { flushOutgoing, flushIncoming, flush } from './request/flush.js';
import { sendPacketsById } from './sendPacketsById.js';
import { sendOutgoing } from './sendOutgoing.js';
import { onPacket } from './onPacket.js';
export class Base {
	destroy = destroy;
	sendCompleted = sendCompleted;
	sendPacketsById = sendPacketsById;
	sendOutgoing = sendOutgoing;
	onPacket = onPacket;
	sendPacket = sendPacket;
	bufferToOutgoingPackets = bufferToOutgoingPackets;
	on = on;
	fetch = initiate;
	currentPayloadSize = 0;
	progress = 0;
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
	packetTemplate = {};
}
