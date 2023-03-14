import { connected } from '../../utilities/logs.js';
export async function connect(requestBody, requestHead) {
	console.log('-------CLIENT CONNECTING-------\n');
	const result = await this.request('open', requestBody, requestHead);
	console.log(result);
	const {
		body,
		stage,
		time,
		scid
	} = result.response;
	if (stage === 101 && scid) {
		connected(body);
		this.stage.code = 1;
		this.serverId = scid;
		this.lastPacketTime = Date.now();
		this.lastPacketGivenTime = time;
	}
	console.log('-------CLIENT CONNECTED-------\n');
	return result;
}
