export function buildMessage({
	method,
	serialize,
	dataSize,
	packet
}) {
	if (serialize) {
		packet.head.serialize = serialize;
	}
	if (dataSize) {
		packet.head.dataSize = dataSize;
	}
	if (method) {
		packet.method = method;
	}
}
