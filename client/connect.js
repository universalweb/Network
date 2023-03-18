import { connected } from '../utilities/logs.js';
export async function connect(requestBody, requestHead) {
	console.log('-------CLIENT CONNECTING-------\n');
	const thisClient = this;
	const result = await thisClient.request('open', requestBody, requestHead);
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
