export function buildMessage({
	method,
	serialization,
	dataSize,
	packet
}) {
	if (serialization) {
		packet.head.serialization = serialization;
	}
	if (dataSize) {
		packet.head.dataSize = dataSize;
	}
	if (method) {
		packet.method = method;
	}
}
