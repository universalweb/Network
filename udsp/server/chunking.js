export function chunking(message) {
	const { data } = message;
	const dataLength = data.length;
	console.log(data, dataLength);
}
