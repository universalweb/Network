import { connectedLog } from '#logs';
import { decode } from 'msgpackr';
import { randomBuffer } from '#crypto';
export async function connect(message) {
	console.log('-------CLIENT CONNECTING-------\n');
	// opn stands for open meaning connect to a server
	const connectRequest = this.request({
		message: randomBuffer()
	}, 'connect');
	console.log('Connect request', connectRequest);
	const connectResponse = await connectRequest.send();
	const {
		data,
		state,
		time,
	} = connectResponse;
	if (state === 1) {
		connectedLog(data);
		this.realtime = true;
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return connectResponse;
}
