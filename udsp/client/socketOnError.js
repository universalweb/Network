import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { promise, stringify } from '@universalweb/utilitylib';
export function socketOnError() {
	console.log('CLIENT SOCKET SERVER ERROR');
	this.fire(this.events, 'socket.error', this);
}
