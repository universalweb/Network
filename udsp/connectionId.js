import Benchmark from 'benchmark';
import { hasValue } from '@universalweb/acid';
import { randomConnectionId } from '#utilities/crypto';
const eight = 8;
const characters = 'abcdef0123456789';
const charactersLength = characters.length;
export function generateConnectionId(size = eight, prepend) {
	let result = '';
	const hexSize = size * 2;
	for (let i = 0; i < hexSize; i++) {
		const randomIndex = Math.floor(Math.random() * charactersLength);
		result += characters.charAt(randomIndex);
	}
	if (hasValue(prepend)) {
		result = `${prepend}${result.substring(prepend.length)}`;
		console.log('ConnectionID created', result);
	}
	return result;
}
export function connectionIdToBuffer(source) {
	return Buffer.from(source, 'hex');
}
export function connectionIdToString(source) {
	return source.toString('hex');
}
export function getConnectionIdReservedSpace(source, size) {
	return source.subarray(0, size);
}
export function getConnectionIdReservedSpaceString(source, size) {
	return source.subarray(0, size).toString('hex');
}
// const serverConnectionIdString = generateConnectionId(4, '01d');
// console.log(connectionIdToBuffer(serverConnectionIdString).toString('hex'));
