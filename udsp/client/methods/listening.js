import { promise, stringify } from '@universalweb/utilitylib';
export function onListening() {
	const connection = this.socket.address();
	this.logSuccess(`Universal Web Client Listening`, stringify(connection));
	this.emitEvent('socket.listening', connection);
}
