// Import the necessary utilities from @universalweb/acid
// Assuming acid also provides isString and isEmpty for robust checks.
import { isArray, isEmpty, isString } from '@universalweb/acid';
/**
 * Extracts a valid JSON object or array from a given string.
 * It searches for the first occurrence of a JSON-like structure ({...} or [...])
 * and then attempts to parse it.
 *
 * This version uses utility functions from @universalweb/acid where applicable.
 * Returns the parsed JSON object/array if found and valid, otherwise `undefined`.
 *
 * @param {string} text - The string to search within.
 * @returns {object|array|undefined} The parsed JSON object/array if found and valid, otherwise undefined.
 */
export function extractAndValidateJson(text) {
	if (!isString(text) || text.length < 2) {
		return undefined;
	}
	const jsonRegex = /\{[^]*\}|\[[^]*\]/;
	let match = text.match(jsonRegex);
	while (match) {
		const potentialJsonString = match[0];
		if (!potentialJsonString || potentialJsonString.length < 2) {
			return;
		}
		try {
			const parsedJson = JSON.parse(potentialJsonString);
			if ((typeof parsedJson === 'object' && parsedJson !== null) || isArray(parsedJson)) {
				return parsedJson;
			}
		} catch (e) {
			return;
		}
		const remainingText = text.substring(match.index + potentialJsonString.length);
		match = remainingText.match(jsonRegex);
	}
	return;
}
export default extractAndValidateJson;
// console.log('--- Valid JSON examples ---');
// const str1 = 'Some random text before {"name": "Alice", "age": {"name": "Alice", "age": 30}} and some after.';
// console.log('Extracted 1:', extractAndValidateJson(str1));
// const str2 = 'This string contains an array: [1, 2, {"key": "value"}, 4]. End of string.';
// console.log('Extracted 2:', extractAndValidateJson(str2));
// const str3 = '{"single": "object"}';
// console.log('Extracted 3:', extractAndValidateJson(str3));
// console.log('\n--- Invalid/No JSON examples (now return undefined) ---');
// const str7 = 'Just some plain text.';
// console.log('Extracted 7:', extractAndValidateJson(str7));
// const str8 = 'Malformed JSON: {"name": "Bob", "age": } invalid syntax';
// console.log('Extracted 8:', extractAndValidateJson(str8));
// const str9 = 'Missing closing brace: {"item": 1';
// console.log('Extracted 9:', extractAndValidateJson(str9));
// const str10 = 'Empty string: \'\'';
// console.log('Extracted 10:', extractAndValidateJson(''));
// const str11 = 'Spaces only: \'   \'';
// console.log('Extracted 11:', extractAndValidateJson('   '));
// console.log('\n--- Type checks ---');
// const resultUndefined = extractAndValidateJson('No JSON here');
// console.log('Is result undefined (explicit check)?', resultUndefined === undefined);
// console.log('Is result null (explicit check)?', resultUndefined === null);
