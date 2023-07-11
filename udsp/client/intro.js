import { connectedLog } from '#logs';
import { decode } from 'msgpackr';
import { randomBuffer } from '#utilities/crypto';
export async function intro(message) {
	console.log('-------CLIENT INTRO-------\n');
	// opn stands for open meaning connect to a server
	const connectRequest = this.request({
		message: randomBuffer()
	}, 'open');
	console.log('HANDSHAKE: Intro request', connectRequest);
	const connectResponse = await connectRequest.send();
	const {
		data,
		state,
		time,
		// server connection ID
		sid
	} = connectResponse;
	if (state === 1 && sid) {
		connectedLog(data);
		this.handshake = true;
		this.state = 1;
		this.connected = true;
		this.destination.id = sid;
		if (data.key) {
			console.log('New Key Provided for Perfect Forward Secrecy');
		}
	}
	console.log('-------CLIENT HANDSHAKE CONNECTED-------\n');
	return connectResponse;
}
