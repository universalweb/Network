export const IS_PRODUCTION = globalThis.CONFIG?.production === true;
const colorMap = {
	info: 'color: #3b82f6; font-weight: bold;',
	success: 'color: #10b981; font-weight: bold;',
	warn: 'color: #f59e0b; font-weight: bold;',
	error: 'color: #ef4444; font-weight: bold;',
	debug: 'color: #8b5cf6; font-weight: bold;',
	perf: 'background:#dc2626; color:#fff; padding:2px 8px; border-radius:3px; font-weight:800;',
};
const headerStyles = {
	banner: 'font-size: 18px; font-weight: 800; padding: 6px 12px; border-radius: 6px; background: #111827; color: #f9fafb;',
	title: 'font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid #111827; padding: 2px 0;',
	pill: 'font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #6366f1; color: #fff;',
	gradient: 'font-size: 16px; font-weight: 800; padding: 6px 14px; border-radius: 6px; background: linear-gradient(90deg,#6366f1,#ec4899); color: #fff;',
};
const LEVEL_TO_METHOD = {
	error: 'error',
	warn: 'warn',
	perf: 'warn',
};
function gated(level, fn) {
	if (IS_PRODUCTION && level !== 'error') {
		return () => undefined;
	}
	return fn;
}
function printLine(level, label, message, args) {
	const method = LEVEL_TO_METHOD[level] ?? 'log';
	const head = `%c[${label}]`;
	const style = colorMap[level];
	if (args.length > 0) {
		console[method](head, style, message, ...args);
	} else {
		console[method](head, style, message);
	}
}
// Lazy-message functions may return null/undefined to skip the log entirely.
// When `msg` is a function, any extra args after it are forwarded — callsites
// pass a hoisted (module-level) formatter + plain data instead of allocating
// a fresh closure per call. In production the whole logger is replaced by a
// noop so the formatter never runs and args never get gathered into an array.
function makeLevelLogger(level) {
	return gated(level, (label, msg, ...args) => {
		const resolved = typeof msg === 'function' ? msg(...args) : msg;
		if (resolved == null) {
			return;
		}
		printLine(level, label, resolved, []);
	});
}
function resolveHeaderStyle(style) {
	if (typeof style === 'string' && style.includes(':')) {
		return style;
	}
	return headerStyles[style] || headerStyles.banner;
}
function passthrough(method) {
	return gated('info', (...args) => {
		console[method](...args);
	});
}
function ifAvailable(method, level = 'info') {
	return gated(level, (...args) => {
		console[method]?.(...args);
	});
}
function ifPerf(method) {
	return (label, ...rest) => {
		if (typeof performance !== 'undefined' && performance[method]) {
			performance[method](label, ...rest);
		}
	};
}
export const Logger = {
	info: makeLevelLogger('info'),
	success: makeLevelLogger('success'),
	warn: makeLevelLogger('warn'),
	error: makeLevelLogger('error'),
	debug: makeLevelLogger('debug'),
	perf: makeLevelLogger('perf'),
	header: gated('info', (text, style) => {
		console.log(`%c${text}`, resolveHeaderStyle(style));
	}),
	rule: gated('info', (text) => {
		const bar = '─'.repeat(48);
		if (text) {
			console.log(`%c${bar}\n  ${text}\n${bar}`, 'color:#6b7280;font-weight:600;');
		} else {
			console.log(`%c${bar}`, 'color:#6b7280;');
		}
	}),
	group: gated('info', (label, collapsed) => {
		const fn = collapsed ? 'groupCollapsed' : 'group';
		console[fn](`%c${label}`, headerStyles.title);
	}),
	groupEnd: passthrough('groupEnd'),
	table: passthrough('table'),
	dir: passthrough('dir'),
	count: passthrough('count'),
	countReset: passthrough('countReset'),
	time: passthrough('time'),
	timeLog: passthrough('timeLog'),
	timeEnd: passthrough('timeEnd'),
	clear: passthrough('clear'),
	trace: gated('info', (label, ...args) => {
		console.trace(`%c[${label}]`, colorMap.debug, ...args);
	}),
	assert(condition, label, ...args) {
		console.assert(condition, `%c[${label}]`, colorMap.error, ...args);
	},
	mark: ifPerf('mark'),
	measure: ifPerf('measure'),
	profile: ifAvailable('profile', 'info'),
	profileEnd: ifAvailable('profileEnd', 'info'),
	break(condition) {
		if (IS_PRODUCTION) {
			return;
		}
		if (condition === undefined || condition) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
	},
	breakOn(label, condition) {
		if (IS_PRODUCTION || !condition) {
			return;
		}
		printLine('debug', label, 'breakpoint hit', []);
		// eslint-disable-next-line no-debugger
		debugger;
	},
	inspect(label, value) {
		if (IS_PRODUCTION) {
			return value;
		}
		console.log(`%c[${label}]`, colorMap.debug, value);
		console.dir(value, {
			depth: null,
		});
		return value;
	},
};
