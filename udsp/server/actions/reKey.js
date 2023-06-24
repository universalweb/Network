import { info } from '#logs';
import { toBase64 } from '#crypto';
export async function reKey(socket, data) {
	info(`${toBase64(data.certificate.key)}`);
	socket.reKey(data.certificate);
}
