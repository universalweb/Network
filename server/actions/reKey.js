import { info } from '#logs';
import { toBase64 } from '#crypto';
export async function reKey(socket, body) {
	info(`${toBase64(body.certificate.key)}`);
	socket.reKey(body.certificate);
}
