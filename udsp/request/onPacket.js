import { hasValue } from '@universalweb/acid';
import { destroy } from './destory';
export async function onPacket(packet) {
	const source = this;
	source.lastPacketTime = Date.now();
	const { message } = packet;
	const {
		body,
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
		cmplt,
		// Finale Packet
		finale,
		// Acknowledgement
		ack,
		// Negative Acknowledgement
		nack,
		err
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
	source.totalReceivedPackets++;
	if (hasValue(packetId)) {
		if (!source.incomingPackets[packetId]) {
			source.incomingPackets[packetId] = message;
			if (body) {
				await this.onData(message);
			}
			source.totalReceivedUniquePackets++;
		}
	} else {
		source.incomingPackets[0] = message;
		source.totalReceivedUniquePackets = 1;
		source.totalIncomingUniquePackets = 1;
	}
	if (cmplt) {
		source.state = 2;
	}
	if (err) {
		return this.destroy(err);
	}
	if (source.state === 2 || cmplt) {
		source.assemble();
	}
	console.log('On Packet event', source);
}
