import { hasValue } from '@universalweb/acid';
import { destroy } from './destory.js';
export async function onPacket(packet) {
	const source = this;
	this.lastPacketTime = Date.now();
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
		// serialization
		ct: serialization,
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
		this.totalIncomingUniquePackets = totalIncomingUniquePackets;
	}
	if (hasValue(totalIncomingPayloadSize)) {
		this.totalIncomingPayloadSize = totalIncomingPayloadSize;
	}
	if (serialization) {
		this.serialization = serialization;
	}
	this.totalIncomingPackets++;
	if (hasValue(packetId)) {
		if (!this.incomingPackets[packetId]) {
			this.incomingPackets[packetId] = message;
			if (data) {
				await this.onData(message);
			}
			this.totalReceivedUniquePackets++;
		}
	}
	if (end) {
		if (this.totalIncomingUniquePackets === this.totalReceivedUniquePackets) {
			this.state = 2;
		}
	}
	if (err) {
		return this.destroy(err);
	}
	if (this.state === 2 || end) {
		this.assemble();
	}
	console.log('On Packet event', this);
}
