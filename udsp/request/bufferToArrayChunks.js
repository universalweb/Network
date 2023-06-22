export async function bufferToArrayChunks(body, packetMaxPayloadSafeEstimate) {
	const chunks = [];
	const packetLength = body.length;
	for (let index = 0; index < packetLength;index += packetMaxPayloadSafeEstimate) {
		const chunk = body.subarray(index, index + packetMaxPayloadSafeEstimate);
		chunks.push(chunk);
	}
	return chunks;
}
