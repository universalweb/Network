export async function onPath(message) {
	this.logInfo('On Path event');
	if (this.events.path) {
		this.events.path(message.path, message.pid);
	}
}
