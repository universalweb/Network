import {
	bannerLog,
	completedLog,
	errorLog,
	fatalLog,
	infoLog,
	noteLog,
	successLog,
	verboseLog,
	warningLog,
} from '#utilities/logs/logs';
import {
	blue, bold, green, red, underline, yellow,
} from 'colorette';
import {
	isNumber, isString, isUndefined, upperCase,
} from '@universalweb/utilitylib';
import boxen from 'boxen';
function typeStyle(source, typeColor = blue) {
	return bold(underline(typeColor(upperCase(source))));
}
const arrow = yellow('=>');
export function consoleLog(source, loglevel, data, logFunction = console.log, typeColor = typeStyle) {
	// console.log(source.constructor.name, source?.logLevel);
	if (!source || isUndefined(source?.logLevel)) {
		return;
	}
	if (loglevel <= source.logLevel) {
		if (loglevel === 4) {
			return logFunction(...data);
		}
		const type = source?.type || source?.constructor?.name || '';
		if (source.connectionIdString || source.id) {
			const idString = source.connectionIdString || source.id;
			return logFunction(type, isString(idString) ? `ID:${idString} ${arrow}` : '', false, ...data);
		}
		return logFunction(type, '', true, ...data);
	}
}
export function logError(...err) {
	return consoleLog(this, 0, err, errorLog, red);
}
export function logWarning(...err) {
	return consoleLog(this, 1, err, warningLog, yellow);
}
export function logInfo(...source) {
	return consoleLog(this, 2, source, infoLog);
}
export function logVerbose(...data) {
	return consoleLog(this, 3, data, verboseLog);
}
export function logSuccess(...data) {
	return consoleLog(this, 3, data, successLog, green);
}
export function logBanner(...source) {
	return consoleLog(this, 4, source, bannerLog);
}
export const methods = {
	logError,
	logWarning,
	logInfo,
	logVerbose,
	logSuccess,
	logBanner,
};
export default methods;
