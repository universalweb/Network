import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
import { encodePacket } from '#udsp/encodePacket';
imported('Client Send');
export async function send(packet) {
	info(`Send to server`);
	const {
		destination,
		server,
	} = this;
	const encodedPacket = await encodePacket({
		source: this,
		destination,
		packet
	});
	msgSent(`Packet Size ${packet.length}`, packet, destination.port, destination.ip);
	return promise((accept, reject) => {
		server.send(encodedPacket, destination.port, destination.ip, (error) => {
			if (error) {
				failed(error);
				return reject(error);
			}
			accept();
		});
	});
}
