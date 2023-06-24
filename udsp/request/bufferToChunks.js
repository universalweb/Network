export async function bufferToChunks(data, packetMaxPayloadSafeEstimate) {
	const chunks = [];
	const packetLength = data.length;
	for (let index = 0; index < packetLength;index += packetMaxPayloadSafeEstimate) {
		const chunk = data.subarray(index, index + packetMaxPayloadSafeEstimate);
		chunks.push(chunk);
	}
	return chunks;
}
