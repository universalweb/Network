import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { promise, stringify } from '@universalweb/acid';
export function socketOnError() {
	this.logInfo('CLIENT SOCKET SERVER ERROR');
	this.fire(this.events, 'socket.error', this);
}
