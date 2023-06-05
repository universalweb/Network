import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
imported('Client Send');
export async function send(packet) {
	info(`Sending to server`);
	const packetConfig = {
		source: this,
		packet,
	};
	return sendPacket(packetConfig);
}
