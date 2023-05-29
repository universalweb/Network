import { success, failed } from './logs.js';
export function pluckBuffer(messageBuffer, startIndex, endIndex, bufferName, charFormat) {
	const plucked = messageBuffer.subarray(startIndex, endIndex);
	if (!plucked) {
		failed(`${bufferName}`);
		return;
	}
	success(`${bufferName} ${plucked.toString(charFormat)}`);
	return plucked;
}
export function pluckBuffer64(messageBuffer, startIndex, endIndex, bufferName) {
	const plucked = messageBuffer.subarray(startIndex, endIndex);
	if (!plucked) {
		failed(`${bufferName}`);
		return;
	}
	success(`${bufferName} ${plucked.toString('base64')}`);
	return plucked.toString('base64');
}
