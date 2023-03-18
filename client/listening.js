import {
	success, failed, imported, msgSent, info
} from '../utilities/logs.js';	imported('Server onListen');
export function onListening() {
	const connection = this.server.address();
	success(`Universal Web Client Server Listening`, connection);
}
export function listen() {
	this.server.on('listening', onListening);
}
