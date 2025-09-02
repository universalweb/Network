import { stringify } from '@universalweb/utilitylib';
export function onListen() {
	const connection = this.socket.address();
	this.logSuccess(`Universal Web Server Listening ${connection.family} - ${connection.address}:${connection.port}`);
}
