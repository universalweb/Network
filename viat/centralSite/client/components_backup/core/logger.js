const target = (typeof globalThis === 'undefined') ? window : globalThis;
const isProduction = target.CONFIG?.production === true;
const colorMap = {
	info: 'color: #3b82f6; font-weight: bold;',
	success: 'color: #10b981; font-weight: bold;',
	warn: 'color: #f59e0b; font-weight: bold;',
	error: 'color: #ef4444; font-weight: bold;',
	debug: 'color: #8b5cf6; font-weight: bold;',
};
const headerStyles = {
	banner: 'font-size: 18px; font-weight: 800; padding: 6px 12px; border-radius: 6px; background: #111827; color: #f9fafb;',
	title: 'font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid #111827; padding: 2px 0;',
	pill: 'font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #6366f1; color: #fff;',
	gradient: 'font-size: 16px; font-weight: 800; padding: 6px 14px; border-radius: 6px; background: linear-gradient(90deg,#6366f1,#ec4899); color: #fff;',
};
function pickMethod(level) {
	if (level === 'error') {
		return 'error';
	}
	if (level === 'warn') {
		return 'warn';
	}
	return 'log';
}
function shouldSilence(level) {
	return isProduction && level !== 'error';
}
function printLine(level, label, message, args) {
	if (shouldSilence(level)) {
		return;
	}
	const method = pickMethod(level);
	if (args.length > 0) {
		console[method](`%c[${label}]`, colorMap[level], message, ...args);
	} else {
		console[method](`%c[${label}]`, colorMap[level], message);
	}
}
function resolveHeaderStyle(style) {
	if (typeof style === 'string' && style.includes(':')) {
		return style;
	}
	return headerStyles[style] || headerStyles.banner;
}
export const Logger = {
	info(label, msg, ...args) {
		return printLine('info', label, msg, args);
	},
	success(label, msg, ...args) {
		return printLine('success', label, msg, args);
	},
	warn(label, msg, ...args) {
		return printLine('warn', label, msg, args);
	},
	error(label, msg, ...args) {
		return printLine('error', label, msg, args);
	},
	debug(label, msg, ...args) {
		return printLine('debug', label, msg, args);
	},
	header(text, style) {
		if (shouldSilence('info')) {
			return;
		}
		console.log(`%c${text}`, resolveHeaderStyle(style));
	},
	rule(text) {
		if (shouldSilence('info')) {
			return;
		}
		const bar = '─'.repeat(48);
		if (text) {
			console.log(`%c${bar}\n  ${text}\n${bar}`, 'color:#6b7280;font-weight:600;');
		} else {
			console.log(`%c${bar}`, 'color:#6b7280;');
		}
	},
	group(label, collapsed) {
		if (shouldSilence('info')) {
			return;
		}
		const fn = collapsed ? 'groupCollapsed' : 'group';
		console[fn](`%c${label}`, headerStyles.title);
	},
	groupEnd() {
		if (shouldSilence('info')) {
			return;
		}
		console.groupEnd();
	},
	table(data, columns) {
		if (shouldSilence('info')) {
			return;
		}
		console.table(data, columns);
	},
	dir(value, options) {
		if (shouldSilence('info')) {
			return;
		}
		console.dir(value, options);
	},
	trace(label, ...args) {
		if (shouldSilence('info')) {
			return;
		}
		console.trace(`%c[${label}]`, colorMap.debug, ...args);
	},
	assert(condition, label, ...args) {
		console.assert(condition, `%c[${label}]`, colorMap.error, ...args);
	},
	count(label) {
		if (shouldSilence('info')) {
			return;
		}
		console.count(label);
	},
	countReset(label) {
		if (shouldSilence('info')) {
			return;
		}
		console.countReset(label);
	},
	time(label) {
		if (shouldSilence('info')) {
			return;
		}
		console.time(label);
	},
	timeLog(label, ...args) {
		if (shouldSilence('info')) {
			return;
		}
		console.timeLog(label, ...args);
	},
	timeEnd(label) {
		if (shouldSilence('info')) {
			return;
		}
		console.timeEnd(label);
	},
	mark(label) {
		if (typeof performance !== 'undefined' && performance.mark) {
			performance.mark(label);
		}
	},
	measure(label, startMark, endMark) {
		if (typeof performance !== 'undefined' && performance.measure) {
			performance.measure(label, startMark, endMark);
		}
	},
	clear() {
		if (shouldSilence('info')) {
			return;
		}
		console.clear();
	},
	profile(label) {
		if (typeof console.profile === 'function') {
			console.profile(label);
		}
	},
	profileEnd(label) {
		if (typeof console.profileEnd === 'function') {
			console.profileEnd(label);
		}
	},
	break(condition) {
		if (isProduction) {
			return;
		}
		if (condition === undefined || condition) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
	},
	breakOn(label, condition) {
		if (isProduction || !condition) {
			return;
		}
		printLine('debug', label, 'breakpoint hit', []);
		// eslint-disable-next-line no-debugger
		debugger;
	},
	inspect(label, value) {
		if (shouldSilence('debug')) {
			return value;
		}
		console.log(`%c[${label}]`, colorMap.debug, value);
		console.dir(value, {
			depth: null,
		});
		return value;
	},
};
