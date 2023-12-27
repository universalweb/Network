import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
export async function connected() {
	this.lastAct = Date.now();
	clearTimeout(this.connectionGracePeriod);
	success(`client Connected -> ID: ${this.id}`);
}
