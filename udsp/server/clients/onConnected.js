import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
export async function onConnected() {
	this.lastAct = Date.now();
	success(`client Connected -> ID: ${this.id}`);
}
