import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { stringify } from '@universalweb/acid';
export function onListen() {
	const connection = this.socket.address();
	success(`Universal Web Server Listening ${stringify(connection)}`);
}
