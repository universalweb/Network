export function numberEncodedSize(source) {
	const sourceString = source.toString();
	const sourceLength = sourceString.length;
	if (source > 0 && source <= 3) {
		return 1;
	} else if (source > 3 && source <= 5) {
		return 3;
	} else if (source > 5 && source <= 11) {
		return 5;
	} else if (source > 11 && source <= 16) {
		return 9;
	} else {
		console.log('Larger than max safe integer in javascript detected.');
		return sourceString;
	}
}
