import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from '@universalweb/acid';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
imported('Client Send');
export async function send(packet) {
	info(`Sending to server`);
	const packetConfig = {
		source: this,
		packet,
	};
	msgSent(`Packet Size ${packet.length}`, packet, this.destination.port, this.destination.ip);
	return sendPacket(packetConfig);
}
