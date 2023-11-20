export async function onEnd(id, rpc, packetId, data, frame, source) {
	console.log('End Packet Received');
	source.end();
}
