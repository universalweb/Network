export async function onError(id, rpc, packetId, data, frame, source, rinfo) {
	source.destroy(data);
	return;
}
