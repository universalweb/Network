const getGlobal = (typeof globalThis === 'undefined') ? window : globalThis;
const isProduction = getGlobal.CONFIG?.production === true;
const colorMap = {
	info: 'color: #3b82f6; font-weight: bold;',
	success: 'color: #10b981; font-weight: bold;',
	warn: 'color: #f59e0b; font-weight: bold;',
	error: 'color: #ef4444; font-weight: bold;',
	debug: 'color: #8b5cf6; font-weight: bold;',
};
const printLine = (level, label, message, args) => {
	if (isProduction && level !== 'error') {
		return;
	}
	// eslint-disable-next-line no-nested-ternary
	const consoleMethod = (level === 'error') ? 'error' : (level === 'warn') ? 'warn' : 'log';
	if (args.length > 0) {
		console[consoleMethod](`%c[${label}]`, colorMap[level], message, ...args);
	} else {
		console[consoleMethod](`%c[${label}]`, colorMap[level], message);
	}
};
export const Logger = {
	info: (label, msg, ...args) => {
		return printLine('info', label, msg, args);
	},
	success: (label, msg, ...args) => {
		return printLine('success', label, msg, args);
	},
	warn: (label, msg, ...args) => {
		return printLine('warn', label, msg, args);
	},
	error: (label, msg, ...args) => {
		return printLine('error', label, msg, args);
	},
	debug: (label, msg, ...args) => {
		return printLine('debug', label, msg, args);
	},
};
