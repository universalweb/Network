import {
	isEmpty, isBuffer, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#udsp/processEvent';
const incomingDataEncodingTypesChunked = /stream|file|image|binary|string/;
import { Base } from './request/base.js';
/**
	* @todo Add promise to send use the method that Ask uses assign the accept, return it, and when completed execute.
*/
export class Reply extends Base {
	constructor(request, source) {
		super(request, source);
		const thisReply = this;
		const { message } = request;
		const { sid } = message;
		console.log(source);
		const {
			queue,
			packetIdGenerator
		} = source;
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
	isReply = true;
	async assemble() {
		const thisReply = this;
		const { incomingDataEncoding } = thisReply;
		if (thisReply.totalIncomingPackets === 1) {
			thisReply.request = thisReply.incomingPackets[0];
		}
		const packet = thisReply.incomingPackets[0];
		eachArray(thisReply.incomingPackets, (item) => {
			if (item.data) {
				Buffer.concat([packet.data, item.data]);
			}
		});
		if (incomingDataEncoding === 'struct' || !incomingDataEncoding) {
			msgReceived(thisReply.request);
			if (thisReply.request.data) {
				thisReply.request.data = decode(thisReply.request.data);
			}
		}
		await processEvent(this);
	}
}
export function reply(packet, client) {
	console.log(client);
	return construct(Reply, [packet, client]);
}
