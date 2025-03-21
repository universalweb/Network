import { promise, stringify } from '@universalweb/acid';
export function socketOnError() {
	this.logError('CLIENT SOCKET SERVER ERROR');
	this.fire(this.events, 'socket.error', this);
}
