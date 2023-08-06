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
		console.log('data size', dataSize);
		while (currentBytePosition < dataSize) {
			const message = source.getPacketTemplate();
			const endIndex = currentBytePosition + maxDataSize;
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const data = outgoingData.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', data.length, currentBytePosition, endIndex);
			message.pid = packetId;
			message.index = safeEndIndex;
			message.data = data;
			outgoingDataPackets[packetId] = message;
			if (safeEndIndex === dataSize) {
				message.last = true;
				break;
			}
			currentBytePosition += maxDataSize;
			packetId++;
		}
	} else {
		const message = source.getPacketTemplate();
		message.pid = 0;
		message.last = true;
		message.data = outgoingData;
		// console.log(source);
		outgoingDataPackets[0] = message;
	}
	console.log('bufferToPackets', outgoingDataPackets);
}
