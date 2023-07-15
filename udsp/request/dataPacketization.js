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
			const data = outgoingData.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', data.length, currentBytePosition, endIndex);
			const message = {
				pid: packetId,
				endIndex: safeEndIndex,
				sid,
				data
			};
			outgoingDataPackets[packetId] = message;
			if (safeEndIndex === dataSize) {
				message.last = true;
				break;
			}
			currentBytePosition += maxDataSize;
			packetId++;
		}
	} else {
		const message = {
			pid: 0,
			end: true,
			data: outgoingData
		};
		// console.log(source);
		outgoingDataPackets[0] = message;
	}
	console.log('bufferToPackets', outgoingDataPackets);
}
