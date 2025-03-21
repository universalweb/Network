export async function onConnected() {
	this.lastAct = Date.now();
	this.logSuccess(`client Connected -> ID: ${this.id}`);
}
