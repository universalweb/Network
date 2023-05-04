export function chunking(message) {
	const { body } = message;
	const bodyLength = body.length;
	console.log(body, bodyLength);
}
