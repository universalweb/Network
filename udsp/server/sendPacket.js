import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
// clientId, nonce, encrypted message size, flags, packet size.
export async function sendPacket(message, address, port) {
	success(`SENDING MESSAGE`);
	const thisServer = this;
	console.log(message);
	return promise((accept, reject) => {
		thisServer.server.send(message, port, address, (error) => {
			if (error) {
				reject(error);
				return failed(error);
			}
			msgSent('Message Sent', message.length);
			accept();
		});
	});
}
