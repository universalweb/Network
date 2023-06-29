import { assign } from '@universalweb/acid';
import { buildMessage } from './buildMessage.js';
import { request } from '#udsp/request';
export async function dataPacketization(source) {
	const {
		maxPacketSize,
		id: sid,
		isAsk,
		outgoingPackets
	} = source;
	const message = (isAsk) ? source.request : source.response;
	const data = message.data;
	const dataSize = data?.length;
	let currentBytePosition = 0;
	let packetId = outgoingPackets.length;
	if (dataSize > maxPacketSize) {
		console.log('data size', data.length);
		while (currentBytePosition < dataSize) {
			const endIndex = currentBytePosition + maxPacketSize;
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const chunk = data.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', chunk.length, currentBytePosition, endIndex);
			const packet = {
				pid: packetId,
				endIndex: safeEndIndex,
				sid
			};
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
		console.log(source);
		outgoingPackets[0] = packet;
	}
	console.log('bufferToPackets', outgoingPackets);
}
