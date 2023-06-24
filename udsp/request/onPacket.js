import { hasValue } from '@universalweb/acid';
import { destroy } from './destory.js';
export async function onPacket(packet) {
	const source = this;
	source.lastPacketTime = Date.now();
	const { message } = packet;
	const {
		data,
		head,
		// Stream ID
		sid: streamId,
		// Packet ID
		pid: packetId,
		// Action
		act,
		// Packet total
		pt: totalIncomingUniquePackets,
		// Dat payload size
		tps: totalIncomingPayloadSize,
		// Data Encoding
		de: incomingDataEncoding,
		// Complete
		done,
		// Finale Packet
		finale,
		// Acknowledgement
		ack,
		// Negative Acknowledgement
		nack,
		err,
		end
	} = message;
	console.log(`Stream Id ${streamId}`);
	if (hasValue(totalIncomingUniquePackets)) {
		source.totalIncomingUniquePackets = totalIncomingUniquePackets;
	}
	if (hasValue(totalIncomingPayloadSize)) {
		source.totalIncomingPayloadSize = totalIncomingPayloadSize;
	}
	if (incomingDataEncoding) {
		source.incomingDataEncoding = incomingDataEncoding;
	}
	source.totalIncomingPackets++;
	if (hasValue(packetId)) {
		if (!source.incomingPackets[packetId]) {
			source.incomingPackets[packetId] = message;
			if (data) {
				await this.onData(message);
			}
			source.totalReceivedUniquePackets++;
		}
	}
	if (end) {
		if (source.totalIncomingUniquePackets === source.totalReceivedUniquePackets) {
			source.state = 2;
		}
	}
	if (err) {
		return this.destroy(err);
	}
	if (source.state === 2 || end) {
		source.assemble();
	}
	console.log('On Packet event', source);
}
