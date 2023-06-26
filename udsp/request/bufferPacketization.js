import { assign } from '@universalweb/acid';
export async function bufferPacketization(data, sid, packets = [], maxPacketSize, contentType) {
	const totalPayloadSize = data?.length;
	let currentBytePosition = 0;
	let packetId = 0;
	if (totalPayloadSize > maxPacketSize) {
		console.log('Body size', data.length);
		while (currentBytePosition < totalPayloadSize) {
			const endIndex = currentBytePosition + maxPacketSize;
			const safeEndIndex = endIndex > totalPayloadSize ? totalPayloadSize : endIndex;
			const chunk = data.subarray(currentBytePosition, safeEndIndex);
			console.log('chunksize', chunk.length, currentBytePosition, endIndex);
			const packet = assign({
				pid: packetId,
				sid
			});
			if (packetId === 0) {
				if (contentType) {
					packet.de = contentType;
				}
				packet.tps = totalPayloadSize;
			}
			packet.data = chunk;
			packets[packetId] = packets;
			if (endIndex >= totalPayloadSize) {
				packet.end = true;
				break;
			}
			currentBytePosition = currentBytePosition + maxPacketSize;
			packetId++;
		}
	} else {
		const packet = {
			pid: 0,
			end: true
		};
		if (contentType) {
			packet.de = contentType;
		}
		packets[0] = packet;
	}
	console.log('bufferToPackets', packets);
	return packets;
}
