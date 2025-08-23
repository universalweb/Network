import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { stringify } from '@universalweb/utilitylib';
export function onListen() {
	const connection = this.socket.address();
	success(`Universal Web Server Listening ${stringify(connection)}`);
}
