import { assign } from '@universalweb/acid';
import { encode } from 'msgpackr';
import { numberEncodedSize } from './numberEncodedSize.js';
export async function dataPacketization(source) {
	const {
		maxDataSize,
		isAsk,
		outgoingDataPackets,
		outgoingData,
		sidSize
	} = source;
	const dataSize = outgoingData?.length;
	let currentBytePosition = 0;
	let packetId = outgoingDataPackets.length;
	if (dataSize > maxDataSize) {
		console.log('data size', dataSize);
		while (currentBytePosition < dataSize) {
			const message = source.getPacketTemplate();
			message.frame.push(packetId, currentBytePosition);
			const frameSize = numberEncodedSize(packetId) + numberEncodedSize(currentBytePosition);
			const endIndex = currentBytePosition + maxDataSize - frameSize - sidSize;
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const data = outgoingData.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', data.length, currentBytePosition, endIndex);
			message.data = data;
			outgoingDataPackets[packetId] = message;
			if (safeEndIndex === dataSize) {
				break;
			}
			currentBytePosition += maxDataSize;
			packetId++;
		}
	} else {
		const message = source.getPacketTemplate();
		message.frame.push(0, 0);
		// console.log(source);
		outgoingDataPackets[0] = message;
	}
	console.log('bufferToPackets', outgoingDataPackets);
}
