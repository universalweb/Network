import { connected } from '#logs';
import { decode } from 'msgpackr';
import { randomBuffer } from '#utilities/crypto';
export async function connect(message) {
	console.log('-------CLIENT CONNECTING-------\n');
	const thisClient = this;
	// opn stands for open meaning connect to a server
	const connectRequest = thisClient.request({
		message: randomBuffer()
	}, 'connect');
	console.log('Connect request', connectRequest);
	const connectResponse = await connectRequest.send();
	const {
		data,
		state,
		time,
		// server connection ID
		sid
	} = connectResponse;
	if (state === 1 && sid) {
		connected(data);
		thisClient.state = 1;
		thisClient.destination.id = sid;
		thisClient.lastPacketTime = Date.now();
		thisClient.lastPacketGivenTime = time;
		const dataDecoded = decode(data);
		console.log(dataDecoded);
		if (dataDecoded.reKey) {
			// thisClient.reKey(dataDecoded.reKey);
		}
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return connectResponse;
}
