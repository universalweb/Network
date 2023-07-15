import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from '@universalweb/acid';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
export async function send(message, headers, footer) {
	console.log(`client.send to Server`, this.destination.port, this.destination.ip);
	return sendPacket(message, this, this.socket, this.destination, headers, footer);
}
