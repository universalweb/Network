import {
	apply,
	hasValue,
	mapWhile,
} from '@universalweb/utilitylib';
const regEx = /^([a-zA-Z0-9.]+)$/;
const sensitiveWords = /(constructor|prototype|window|self|top|alert|confirm|eval|function|Object|Array)/;
const errorNoneExistentProperty = 'None existent property';
const errorPropertyStringAccess = 'Property string access';
export function isPropertyValid(string) {
	return regEx.test(string) && !sensitiveWords.test(string);
}
function goDownTree(currentPosition, item) {
	if (apply(Object.prototype.hasOwnProperty, currentPosition, [item])) {
		return true;
	}
}
export function getPropertyFromString(string, objectMain, error) {
	let object = objectMain;
	const arraySplit = string.split('.');
	mapWhile(arraySplit, (item) => {
		if (goDownTree(object, item)) {
			object = object[item];
		} else {
			error(errorPropertyStringAccess, errorNoneExistentProperty, string);
			object = false;
			return !hasValue(object);
		}
	});
	return object;
}
