import { promise, stringify } from '@universalweb/utilitylib';
export function onSocketError() {
	this.logError('CLIENT SOCKET SERVER ERROR');
	this.emitEvent('socket.error');
}
