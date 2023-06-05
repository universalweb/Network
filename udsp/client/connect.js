import { connected } from '#logs';
import { decode } from 'msgpackr';
export async function connect(message = {}) {
	console.log('-------CLIENT CONNECTING-------\n');
	const thisClient = this;
	// opn stands for open meaning connect to a server
	message.intro = 'Hello Server!';
	const result = await thisClient.request('opn', message);
	console.log(result);
	const {
		body,
		state,
		time,
		sid
	} = result;
	if (state === 1 && sid) {
		connected(body);
		thisClient.state = 1;
		thisClient.destination.id = sid;
		thisClient.lastPacketTime = Date.now();
		thisClient.lastPacketGivenTime = time;
		const bodyDecoded = decode(body);
		console.log(bodyDecoded);
		if (bodyDecoded.reKey) {
			// thisClient.reKey(bodyDecoded.reKey);
		}
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return result;
}
