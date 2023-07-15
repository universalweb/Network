import { info } from '#logs';
export async function sendPacket(packet) {
	await source.send(packet);
}
