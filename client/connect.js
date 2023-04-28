import { connected } from '#logs';
export async function connect(requestObject) {
	console.log('-------CLIENT CONNECTING-------\n');
	const thisClient = this;
	// opn stands for open meaning connect to a server
	requestObject.act = 'opn';
	const result = await thisClient.request(requestObject);
	console.log(result);
	const {
		body,
		stage,
		time,
		scid
	} = result.response;
	if (stage === 101 && scid) {
		connected(body);
		thisClient.stage.code = 1;
		thisClient.serverId = scid;
		thisClient.lastPacketTime = Date.now();
		thisClient.lastPacketGivenTime = time;
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return result;
}
