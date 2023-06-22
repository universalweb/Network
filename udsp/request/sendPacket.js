import { info } from '#logs';
export async function sendPacket(arg) {
	const {
		message,
		options,
		headers,
		footer
	} = arg;
	const source = this.source();
	if (options) {
		info(`Sending Packet with options`);
	}
	if (headers) {
		info(`Sending Packet with headers`);
	}
	if (footer) {
		info(`Sending Packet with footer`);
	}
	if (footer) {
		info(`Sending Packet with footer`);
	}
	if (message.act) {
		info(`Sending Packet with act ${message.act}`);
	}
	await source.send(arg);
}
