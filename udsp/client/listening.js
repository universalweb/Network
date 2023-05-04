import {
	success, failed, imported, msgSent, info
} from '#logs';
export function onListening() {
	const connection = this.server.address();
	success(`Universal Web Client Server Listening`, connection);
}
export function listen() {
	this.server.on('listening', this.onListening);
}
