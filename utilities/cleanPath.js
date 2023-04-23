import { normalize } from 'path';
import truncate from 'truncate-utf8-bytes';
const illegalRe = /[?<>\\:*|":]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
export function cleanPath(filepath) {
	return truncate(normalize(filepath)
		.replace(illegalRe, '')
		.replace(controlRe, '')
		.replace(reservedRe, '')
		.replace(windowsReservedRe, ''), 255);
}
export default cleanPath;
