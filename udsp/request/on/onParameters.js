export async function onParameters(message) {
	this.logInfo('On Params event');
	if (this.hasEvent('params')) {
		this.emitEvent('params', message.params, message.pid);
	}
}
