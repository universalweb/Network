import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { stringify } from '@universalweb/acid';
export function onListen() {
	const connection = this.server.address();
	success(`Universal Web Server Listening ${stringify(connection)}`);
}
