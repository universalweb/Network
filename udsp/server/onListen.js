import { stringify } from '@universalweb/acid';
export function onListen() {
	const connection = this.socket.address();
	this.logSuccess(`Universal Web Server Listening ${stringify(connection)}`);
}
