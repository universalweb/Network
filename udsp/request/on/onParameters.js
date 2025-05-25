export async function onParameters(message) {
	this.logInfo('On Params event');
	if (this.events.params) {
		this.events.params(message.params, message.pid);
	}
}
