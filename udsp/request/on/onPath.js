export async function onPath(message) {
	this.logInfo('On Path event');
	if (this.hasEvent('path')) {
		this.emitEvent('path', message.path, message.pid);
	}
}
