export async function onError(id, rpc, packetId, data, frame, source) {
	source.destroy(data);
	return;
}
