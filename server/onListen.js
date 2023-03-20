import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
import { stringify } from 'Acid';
export function onListen() {
	const connection = this.server.address();
	success(`Universal Web Server Listening ${stringify(connection)}`);
}
