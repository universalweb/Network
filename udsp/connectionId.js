import Benchmark from 'benchmark';
import { hasValue } from '@universalweb/acid';
import { randomConnectionId } from '#utilities/crypto';
const eight = 8;
const characters = 'abcdef0123456789';
const charactersLength = characters.length;
function convertPrepend(prepend, minSize) {
	if (!prepend) {
		return '';
	}
	if (prepend.length < minSize) {
		const target = '0'.repeat(minSize - 1);
		return `${target}${prepend}`;
	}
	return prepend;
}
export function generateConnectionId(size = eight, prependArg, minSize = 1) {
	let result = '';
	const hexSize = size * 2;
	for (let i = 0; i < hexSize; i++) {
		const randomIndex = Math.floor(Math.random() * charactersLength);
		result += characters.charAt(randomIndex);
	}
	if (hasValue(prependArg)) {
		const prepend = convertPrepend(String(prependArg), minSize);
		result = `${prepend}${result.substring(prepend.length)}`;
		// console.log('ConnectionID created', result);
	}
	return result;
}
export function connectionIdToBuffer(source) {
	return Buffer.from(source, 'hex');
}
export function connectionIdToString(source) {
	return source.toString('hex');
}
export function getConnectionIdReservedSpaceString(source, size) {
	return Number(source.toString('hex').substring(0, size));
}
// console.log(generateConnectionId(8, 1, 2));
// const serverConnectionIdString = connectionIdToBuffer(generateConnectionId(8, 1, 2));
// console.log(getConnectionIdReservedSpaceString(serverConnectionIdString, 2));
