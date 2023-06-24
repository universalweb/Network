import { connected } from '#logs';
import { decode } from 'msgpackr';
export async function connect(message = {}) {
	console.log('-------CLIENT CONNECTING-------\n');
	const thisClient = this;
	// opn stands for open meaning connect to a server
	message.intro = 'Hello Server!';
	const result = await thisClient.fetch('opn', message);
	console.log('Connect response', result.response.data);
	const {
		data,
		state,
		time,
		// server connection ID
		sid
	} = result;
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
	return result;
}
