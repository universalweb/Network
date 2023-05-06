import { normalize } from 'path';
const illegalRe = /[?<>\\:*|":]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
export function cleanPath(filepath) {
	return normalize(filepath)
		.replace(illegalRe, '')
		.replace(controlRe, '')
		.replace(reservedRe, '')
		.replace(windowsReservedRe, '');
}
export function isPathAllowed(filepath) {
	const checkingRegex = illegalRe.test() === 0 &&
	 controlRe.test() === 0 &&
	  controlRe.test() === 0 &&
	  reservedRe.test() === 0 &&
	   windowsReservedRe.test() === 0;
	return checkingRegex;
}
export default cleanPath;
