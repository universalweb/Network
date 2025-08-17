/*
	* This is a quick and dirty implementation of a connectionId generator.
	* Depending on your use case you may want to use a more secure method or scalable method.
	* This is a simple implementation that is meant to be quick and easy to use for a majority of use cases.
*/
import { hasValue, isString } from '@universalweb/acid';
import Benchmark from 'benchmark';
import { randomConnectionId } from '#utilities/crypto';
const eight = 8;
const characters = 'abcdef0123456789';
const charactersLength = characters.length;
export const stringToHex = (str) => {
	return Buffer.from(str, 'utf8').toString('hex');
};
export function convertPrepend(prepend, minSize) {
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
		const prependHex = String(prependArg);
		const prepend = convertPrepend(prependHex, minSize);
		console.log(prepend);
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
// console.log(connectionIdToString(generateConnectionId(8, 'a2405', 5)), connectionIdToBuffer(generateConnectionId(8, 'a2405', 5)).length);
// const serverConnectionIdString = connectionIdToBuffer(generateConnectionId(8, 1, 2));
// console.log(getConnectionIdReservedSpaceString(serverConnectionIdString, 2));
