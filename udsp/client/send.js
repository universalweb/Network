import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from '@universalweb/acid';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
imported('Client Send');
export async function send(packet, options) {
	console.log(`client.send to Server`, this.destination.port, this.destination.ip);
	return sendPacket(packet, this, this.socket);
}
