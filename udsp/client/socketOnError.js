import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { promise, stringify } from '@universalweb/acid';
export function socketOnError() {
	console.log('CLIENT SOCKET SERVER ERROR');
	this.trigger(this.events, 'socket.error', this);
}
