export function numberEncodedSize(source) {
	const sourceString = source.toString();
	const sourceLength = sourceString.length;
	if (sourceLength > 0 && sourceLength <= 3) {
		return 1;
	} else if (sourceLength > 3 && sourceLength <= 5) {
		return 3;
	} else if (sourceLength > 5 && sourceLength <= 11) {
		return 5;
	} else if (sourceLength > 11 && sourceLength <= 16) {
		return 9;
	} else {
		// console.trace('Larger than max safe integer in javascript detected.');
		return false;
	}
}
