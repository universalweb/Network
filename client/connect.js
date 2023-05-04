import { connected } from '#logs';
export async function connect(payload = {}) {
	console.log('-------CLIENT CONNECTING-------\n');
	const thisClient = this;
	// opn stands for open meaning connect to a server
	payload.act = 'opn';
	const result = await thisClient.request(payload);
	console.log(result);
	const {
		body,
		state,
		time,
		scid
	} = result.response;
	if (state === 1 && scid) {
		connected(body);
		thisClient.state = 1;
		thisClient.serverId = scid;
		thisClient.lastPacketTime = Date.now();
		thisClient.lastPacketGivenTime = time;
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return result;
}
