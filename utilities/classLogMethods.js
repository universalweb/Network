import {
	completedLog,
	errorLog,
	fatalLog,
	infoLog,
	noteLog,
	successLog,
	verboseLog,
	warningLog
} from '#logs';
import { isUndefined } from '@universalweb/acid';
export async function consoleLog(source, loglevel, err, logFunction = console.log) {
	// Remove for production
	if (source && isUndefined(source?.logLevel)) {
		return;
	}
	if (source.logLevel <= loglevel) {
		if (source.connectionIdString) {
			await logFunction(`${source.type} ${source.connectionIdString ? source.connectionIdString : ''}`, ...err);
		} else {
			await logFunction(`${source.type}`, ...err);
		}
	}
}
export async function logError(...err) {
	await consoleLog(this, 0, err, errorLog);
}
export async function logWarning(...err) {
	await consoleLog(this, 1, err, warningLog);
}
export async function logInfo(...err) {
	await consoleLog(this, 2, err, infoLog);
}
export async function logVerbose(...err) {
	await consoleLog(this, 3, err, verboseLog);
}
export async function logSuccess(...err) {
	await consoleLog(this, 3, err, successLog);
}
