import { assign } from '@universalweb/acid';
import { buildMessage } from './buildMessage.js';
import { request } from '#udsp/request';
export async function bufferPacketization(source) {
	const {
		maxPacketSize,
		contentType,
		method,
		id: sid,
		isAsk,
		outgoingPackets
	} = source;
	const message = (isAsk) ? this.request : this.response;
	const data = message.data;
	const dataSize = data?.length;
	let currentBytePosition = 0;
	let packetId = 0;
	if (dataSize > maxPacketSize) {
		console.log('Body size', data.length);
		while (currentBytePosition < dataSize) {
			const endIndex = currentBytePosition + maxPacketSize;
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const chunk = data.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', chunk.length, currentBytePosition, endIndex);
			const packet = {
				pid: packetId,
				endIndex: safeEndIndex,
				sid,
				head: {}
			};
			if (packetId === 0) {
				buildMessage({
					method,
					contentType,
					dataSize,
					packet
				});
			}
			packet.data = chunk;
			outgoingPackets[packetId] = outgoingPackets;
			if (endIndex >= dataSize) {
				packet.end = true;
				break;
			}
			currentBytePosition = currentBytePosition + maxPacketSize;
			packetId++;
		}
	} else {
		const packet = {
			pid: 0,
			end: true,
			data
		};
		buildMessage({
			method,
			contentType,
			dataSize,
			packet
		});
		console.log(source);
		outgoingPackets[0] = packet;
	}
	console.log('bufferToPackets', outgoingPackets);
}
