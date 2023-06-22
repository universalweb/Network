import { assign } from '@universalweb/acid';
export async function bufferToOutgoingPackets(thisSource, response, incomingDataEncoding) {
	const {
		responsePacketTemplate,
		packetMaxPayload,
		packetMaxPayloadSafeEstimate
	} = thisSource;
	const { body } = response;
	console.log('Body size', body.length);
	const totalPayloadSize = body?.length;
	thisSource.totalReplyDataSize = totalPayloadSize;
	let currentBytePosition = 0;
	let id = 0;
	if (totalPayloadSize > packetMaxPayloadSafeEstimate) {
		while (currentBytePosition < totalPayloadSize) {
			const endIndex = currentBytePosition + packetMaxPayloadSafeEstimate;
			const safeEndIndex = endIndex > totalPayloadSize ? totalPayloadSize : endIndex;
			const chunk = body.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', chunk.length, currentBytePosition, endIndex);
			const outgoingPacket = assign({
				pid: id
			}, responsePacketTemplate);
			if (id === 0) {
				if (incomingDataEncoding) {
					outgoingPacket.de = incomingDataEncoding;
				}
				outgoingPacket.tps = totalPayloadSize;
			}
			outgoingPacket.body = chunk;
			thisSource.outgoingPackets[id] = outgoingPacket;
			if (endIndex >= totalPayloadSize) {
				outgoingPacket.cmplt = true;
				break;
			}
			currentBytePosition = currentBytePosition + packetMaxPayloadSafeEstimate;
			id++;
		}
	} else {
		if (incomingDataEncoding) {
			response.de = incomingDataEncoding;
		}
		response.pid = 0;
		response.pt = 1;
		response.cmplt = true;
		thisSource.outgoingPackets[0] = response;
	}
	console.log('buildReplyPackets', thisSource.outgoingPackets);
}
