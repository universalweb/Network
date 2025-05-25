import { isNumber } from '@universalweb/acid';
export async function attachSocketEvents() {
	const thisServer = this;
	this.socket.on('error', (err) => {
		return thisServer.onError(err);
	});
	this.socket.on('listening', () => {
		return thisServer.onListen();
	});
	this.socket.on('message', (packet, rinfo) => {
		return thisServer.onPacket(packet, rinfo);
	});
}
export async function configureNetwork() {
	const { options } = this;
	const ip = options.ip;
	if (options.ip) {
		this.ip = ip;
	}
	await this.setPort();
	this.logInfo('Config Network', this.ip, this.port);
}
export async function setPort() {
	const { options } = this;
	if (isNumber(options.port)) {
		this.port = options.port;
	}
	if (isNaN(this.port)) {
		this.port = 80;
	}
	this.logInfo('Port Set', this.port);
}
