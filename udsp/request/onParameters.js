export async function onParameters(message) {
	console.log('On Params event');
	if (this.events.params) {
		this.events.params(message.params, message.pid);
	}
}
