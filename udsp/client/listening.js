import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from '@universalweb/acid';
export function onListening() {
	const connection = this.server.address();
	success(`Universal Web Client Server Listening`, connection);
}
