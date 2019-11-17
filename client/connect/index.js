module.exports = async (udspPrototype) => {
	const {
		cnsl
	} = udspPrototype;
	async function connect(requestBody, requestHead) {
		console.log('-------CLIENT CONNECTING-------\n');
		const socket = this;
		const result = await socket.request('open', requestBody, requestHead);
		console.log(result);
		const {
			body,
			status,
			time,
			scid
		} = result.response;
		if (status === 101 && scid) {
			cnsl('Connected', body);
			socket.status.code = 1;
			socket.serverId = scid;
			socket.lastPacketTime = Date.now();
			socket.lastPacketGivenTime = time;
		}
		console.log('-------CLIENT CONNECTED-------\n');
		return result;
	}
	udspPrototype.connect = connect;
};
