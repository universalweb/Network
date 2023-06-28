export function buildMessage({
	method,
	contentType,
	dataSize,
	packet
}) {
	if (contentType) {
		packet.head.contentType = contentType;
	}
	if (dataSize) {
		packet.head.dataSize = dataSize;
	}
	if (method) {
		packet.method = method;
	}
}
