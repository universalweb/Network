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
	} = connectResponse;
	if (state === 1) {
		connectedLog(data);
		this.connected = true;
	}
	console.log('-------CLIENT HANDSHAKE CONNECTED-------\n');
	return connectResponse;
}
