import { assign } from '@universalweb/utilitylib';
import { encode } from '#utilities/serialize';
import { numberEncodedSize } from './numberEncodedSize.js';
export async function dataPacketization(source) {
	const {
		maxFrameSize,
		isAsk,
		outgoingDataPackets,
		outgoingData,
		streamIdSize
	} = source;
	const dataSize = outgoingData?.length;
	const numberEncodedSizeMax = numberEncodedSize(dataSize);
	let currentBytePosition = 0;
	let packetId = 0;
	const maxSafePacketDataSize = maxFrameSize - numberEncodedSizeMax - streamIdSize;
	if (dataSize > maxSafePacketDataSize) {
		source.logInfo('data size', dataSize);
		while (currentBytePosition < dataSize) {
			const message = source.getPacketTemplate(8);
			message.push(packetId);
			const frameSize = numberEncodedSize(packetId) + numberEncodedSize(currentBytePosition);
			const endIndex = currentBytePosition + (maxSafePacketDataSize - frameSize);
			const safeEndIndex = endIndex > dataSize ? dataSize : endIndex;
			const data = outgoingData.subarray(currentBytePosition, safeEndIndex);
			source.logInfo('chunksize', currentBytePosition, safeEndIndex, data.length);
			message.push(data);
			outgoingDataPackets[packetId] = message;
			if (safeEndIndex === dataSize) {
				message.push(true);
				break;
			}
			currentBytePosition = safeEndIndex;
			packetId++;
		}
	} else {
		const message = source.getPacketTemplate(9);
		message.push(0, outgoingData);
		// source.logInfo(source);
		outgoingDataPackets[0] = message;
	}
	source.logInfo('bufferToPackets', outgoingDataPackets);
}
