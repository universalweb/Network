import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { promise, stringify } from '@universalweb/acid';
export function onListening() {
	const connection = this.socket.address();
	success(`Universal Web Client Server Listening`, stringify(connection));
	this.triggerEvent(this.events, 'socket.listening', this);
}
