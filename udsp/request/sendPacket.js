import { info } from '#logs';
export async function sendPacket(packet) {
	const {
		message,
		options,
		header,
		footer
	} = packet;
	const source = this.source();
	if (options) {
		info(`Sending Packet with options`);
	}
	if (header) {
		info(`Sending Packet with header`);
	}
	if (message) {
		info(`Sending Packet with message`);
		if (message.method) {
			info(`Sending Packet with act ${message.method}`);
		}
	}
	if (footer) {
		info(`Sending Packet with footer`);
	}
	await source.send(packet);
}
