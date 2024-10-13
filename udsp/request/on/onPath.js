export async function onPath(message) {
	console.log('On Path event');
	if (this.events.path) {
		this.events.path(message.path, message.pid);
	}
}
