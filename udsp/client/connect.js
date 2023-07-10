import { connectedLog } from '#logs';
import { decode } from 'msgpackr';
import { randomBuffer } from '#utilities/crypto';
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
		// server connection ID
		sid
	} = connectResponse;
	if (state === 1 && sid) {
		connectedLog(data);
		this.state = 1;
		this.connected = true;
		this.realtime = true;
		this.destination.id = sid;
		this.lastPacketTime = Date.now();
		this.lastPacketGivenTime = time;
		// const dataDecoded = decode(data);
		// console.log(dataDecoded);
		// if (dataDecoded.reKey) {
		//  this.reKey(dataDecoded.reKey);
		// }
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return connectResponse;
}
