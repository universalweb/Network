import {
	completedLog,
	errorLog,
	fatalLog,
	infoLog,
	noteLog,
	successLog,
	verboseLog,
	warningLog
} from '#utilities/logs/logs';
import { isUndefined } from '@universalweb/acid';
export function consoleLog(source, loglevel, err, logFunction = console.log) {
	// Remove for production
	if (source && isUndefined(source?.logLevel)) {
		return;
	}
	if (source.logLevel <= loglevel) {
		if (source.connectionIdString) {
			return logFunction(`${source.type} ${source.connectionIdString ? source.connectionIdString : ''}`, ...err);
		} else {
			return logFunction(`${source.type}`, ...err);
		}
	}
}
export function logError(...err) {
	return consoleLog(this, 0, err, errorLog);
}
export function logWarning(...err) {
	return consoleLog(this, 1, err, warningLog);
}
export function logInfo(...err) {
	return consoleLog(this, 2, err, infoLog);
}
export function logVerbose(...err) {
	return consoleLog(this, 3, err, verboseLog);
}
export function logSuccess(...err) {
	return consoleLog(this, 3, err, successLog);
}
