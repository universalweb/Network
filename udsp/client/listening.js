import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { promise, stringify } from '@universalweb/utilitylib';
export function onListening() {
	const connection = this.socket.address();
	success(`Universal Web Client Listening`, stringify(connection));
	this.fire(this.events, 'socket.listening', this);
}
