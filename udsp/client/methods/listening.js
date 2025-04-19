import { promise, stringify } from '@universalweb/acid';
export function onListening() {
	const connection = this.socket.address();
	this.logSuccess(`Universal Web Client Listening`, stringify(connection));
	this.fire(this.events, 'socket.listening', this);
}
