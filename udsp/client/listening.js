import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
export function onListening() {
	const connection = this.server.address();
	success(`Universal Web Client Server Listening`, connection);
}
