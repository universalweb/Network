import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { isUndefined } from '@universalweb/acid';
const logCodes = ['LOG'];
const logLevels = [
	'ERROR',
	'WARNING',
	'INFO',
	'VERBOSE',
];
function getLogCode(code = 0) {
	return logCodes[code];
}
export async function consoleLog(source, code, err, logFunction = console.log) {
	// Remove for production
	const logLevel = source.logLevel || 3;
	if (isUndefined(source.logLevel)) {
		return;
	}
	if (source.logLevel <= logLevel) {
		if (source.connectionIdString) {
			logFunction(`${getLogCode(code)}[${code}]: ${source.type} ${source.connectionIdString ? source.connectionIdString : ''}`);
		} else {
			logFunction(`${getLogCode(code)}[${code}]: ${source.type}`);
		}
		if (err) {
			logFunction(...err);
		}
	}
}
export async function logError(...err) {
	await consoleLog(this, 0, err);
}
export async function logWarning(...err) {
	await consoleLog(this, 1, err);
}
export async function logInfo(...err) {
	await consoleLog(this, 2, err);
}
export async function logVerbose(...err) {
	await consoleLog(this, 3, err);
}
