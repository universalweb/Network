import { assign } from '@universalweb/acid';
import { buildMessage } from './buildMessage.js';
import { request } from '#udsp/request';
export async function dataPacketization(source) {
	const {
		maxDataSize,
		id: sid,
		isAsk,
		outgoingDataPackets
	} = source;
	const message = (isAsk) ? source.request : source.response;
	const data = message.data;
	const dataSize = data?.length;
	let currentBytePosition = 0;
	let packetId = outgoingDataPackets.length;
	if (dataSize > maxDataSize) {
		console.log('data size', data.length);
		while (currentBytePosition < dataSize) {
			const endIndex = currentBytePosition + maxDataSize;
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const chunk = data.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', chunk.length, currentBytePosition, endIndex);
			const packet = {
				pid: packetId,
				endIndex: safeEndIndex,
				sid
			};
			packet.data = chunk;
			outgoingDataPackets[packetId] = outgoingDataPackets;
			if (endIndex >= dataSize) {
				packet.end = true;
				break;
			}
			currentBytePosition = currentBytePosition + maxDataSize;
			packetId++;
		}
	} else {
		const packet = {
			pid: 0,
			end: true,
			data
		};
		console.log(source);
		outgoingDataPackets[0] = packet;
	}
	console.log('bufferToPackets', outgoingDataPackets);
}
