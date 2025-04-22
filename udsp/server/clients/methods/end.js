import { endRPC } from '../../../rpc/frameRPC.js';
export async function sendEnd() {
	if (this.state === 0) {
		return;
	}
	this.logInfo('Sending CLIENT END');
	this.setState(0);
	const frame = [
		false,
		endRPC
	];
	return this.send(frame, undefined, undefined, true);
}
export async function end(frame, header) {
	this.logInfo(`END RPC Destroying client ${this.connectionIdString}`, frame, header);
	await this.sendEnd();
	await this.destroy(0);
}
