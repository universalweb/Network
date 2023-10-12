import { assign } from '@universalweb/acid';
import { encode } from '#utilities/serialize';
import { numberEncodedSize } from './numberEncodedSize.js';
export async function dataPacketization(source) {
	const {
		maxPacketDataSize,
		isAsk,
		outgoingDataPackets,
		outgoingData,
		streamIdSize
	} = source;
	const dataSize = outgoingData?.length;
	const numberEncodedSizeMax = numberEncodedSize(dataSize);
	let currentBytePosition = 0;
	let packetId = 0;
	const maxSafePacketDataSize = maxPacketDataSize - numberEncodedSizeMax - streamIdSize;
	if (dataSize > maxSafePacketDataSize) {
		console.log('data size', dataSize);
		while (currentBytePosition < dataSize) {
			const message = source.getPacketTemplate();
			message.frame.push(packetId, currentBytePosition);
			const frameSize = numberEncodedSize(packetId) + numberEncodedSize(currentBytePosition);
			const endIndex = currentBytePosition + (maxSafePacketDataSize - frameSize);
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const data = outgoingData.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', currentBytePosition, safeEndIndex, data.length);
			message.data = data;
			message.offset = currentBytePosition;
			outgoingDataPackets[packetId] = message;
			if (safeEndIndex === dataSize) {
				message.last = true;
				break;
			}
			currentBytePosition = safeEndIndex;
			packetId++;
		}
	} else {
		const message = source.getPacketTemplate();
		message.frame.push(0, 0);
		message.data = outgoingData;
		// console.log(source);
		outgoingDataPackets[0] = message;
	}
	console.log('bufferToPackets', outgoingDataPackets);
}
