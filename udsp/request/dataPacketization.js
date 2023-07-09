import { assign } from '@universalweb/acid';
import { buildMessage } from './buildMessage.js';
import { request } from '#udsp/request';
export async function dataPacketization(source) {
	const {
		maxDataSize,
		id: sid,
		isAsk,
		outgoingDataPackets,
		outgoingData
	} = source;
	const dataSize = outgoingData?.length;
	let currentBytePosition = 0;
	let packetId = outgoingDataPackets.length;
	if (dataSize > maxDataSize) {
		console.log('data size', outgoingData.length);
		while (currentBytePosition < dataSize) {
			const endIndex = currentBytePosition + maxDataSize;
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const chunk = outgoingData.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', chunk.length, currentBytePosition, endIndex);
			const packet = {
				pid: packetId,
				endIndex: safeEndIndex,
				sid
			};
			packet.data = chunk;
			outgoingDataPackets[packetId] = outgoingDataPackets;
			if (safeEndIndex === dataSize) {
				packet.last = true;
				break;
			}
			currentBytePosition += maxDataSize;
			packetId++;
		}
	} else {
		const packet = {
			pid: 0,
			end: true,
			data: outgoingData
		};
		console.log(source);
		outgoingDataPackets[0] = packet;
	}
	console.log('bufferToPackets', outgoingDataPackets);
}
