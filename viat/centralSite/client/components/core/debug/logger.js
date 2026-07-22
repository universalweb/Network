import { isFunction, isString } from '../utilities.js';
export const IS_PRODUCTION = globalThis.CONFIG?.production === true;
/*
 * Numeric severity ranks. A line prints only when its rank ≤ the active
 * threshold. `debug` is the highest (noisiest) rank — the per-render lifecycle
 * traces (patch pass, onRender, disconnect) all sit here.
 */
const LEVEL_RANK = Object.freeze({
	silent: 0,
	error: 1,
	warn: 2,
	success: 3,
	info: 3,
	debug: 4,
	/*
	 * `perf` is the NOISIEST rank on purpose: its diagnostics (wasted-set
	 * detection) run an O(n) `plainEqual` deep-compare per state write. Sitting
	 * above `debug` means even full `debug` verbosity won't pay that compare —
	 * only an explicit `setLevel('perf')` arms it for active perf hunting.
	 */
	perf: 5,
});
/*
 * Production: errors only. Dev default: `info` — keeps boot banners, warnings
 * and one-shot info, but MUTES the per-render `debug` flood that otherwise
 * dumps thousands of styled console.log calls through a hot mount (measured at
 * ~2/3 of cold-create wall time — pure console I/O the production build never
 * pays). Opt back into the full trace with `globalThis.CONFIG.logLevel='debug'`
 * at boot, or `defaultLogger.setLevel('debug')` at runtime.
 */
const DEFAULT_LEVEL = IS_PRODUCTION ? 'error' : 'info';
let activeRank = LEVEL_RANK[globalThis.CONFIG?.logLevel] ?? LEVEL_RANK[DEFAULT_LEVEL];
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
function noop() {
	return undefined;
}
function gated(level, fn) {
	/**
	 * Production: only `error` ever runs — captured once as a literal noop so the
	 * disabled paths cost nothing (no per-call branch, no closure allocation).
	 */
	if (IS_PRODUCTION && level !== 'error') {
		return noop;
	}
	/*
	 * Dev: gate at CALL time against the runtime-adjustable rank so `setLevel`
	 * re-mutes/-unmutes live. The rank compare short-circuits BEFORE the wrapped
	 * formatter (and any lazy message closure it would invoke) runs.
	 */
	const rank = LEVEL_RANK[level];
	return function gatedLog(...args) {
		if (rank > activeRank) {
			return undefined;
		}
		return fn(...args);
	};
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
function resolveHeaderStyle(style) {
	if (isString(style) && style.includes(':')) {
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
/**
 * Cheap boolean gate for a hot callsite: true only in dev when `level` is at or
 * below the active rank. Reads only already-declared module state (no forward
 * refs) so it is safe to call from the Logger instance (and from setLevel).
 */
function computeFlag(level) {
	return !IS_PRODUCTION && LEVEL_RANK[level] <= activeRank;
}
function setActiveLevel(level) {
	const rank = LEVEL_RANK[level];
	if (rank !== undefined) {
		activeRank = rank;
	}
	return activeRank;
}
// Pre-bound action fns (gated / passthrough at load) keep instance methods as
// simple named shorthands (per js-style) with zero per-call wrapper alloc for
// the control paths. Transforms for default labels happen before delegating.
function logHeader(text, style) {
	console.log(`%c${text}`, resolveHeaderStyle(style));
}
function logRule(text) {
	const bar = '─'.repeat(48);
	if (text) {
		console.log(`%c${bar}\n  ${text}\n${bar}`, 'color:#6b7280;font-weight:600;');
	} else {
		console.log(`%c${bar}`, 'color:#6b7280;');
	}
}
function logGroup(label, collapsed) {
	const method = collapsed ? 'groupCollapsed' : 'group';
	console[method](`%c${label}`, headerStyles.title);
}
function logTrace(label, ...args) {
	console.trace(`%c[${label}]`, colorMap.debug, ...args);
}
const headerAction = gated('info', logHeader);
const ruleAction = gated('info', logRule);
const groupAction = gated('info', logGroup);
const traceAction = gated('info', logTrace);
const groupEndAction = passthrough('groupEnd');
const tableAction = passthrough('table');
const dirAction = passthrough('dir');
const countAction = passthrough('count');
const countResetAction = passthrough('countReset');
const timeAction = passthrough('time');
const timeLogAction = passthrough('timeLog');
const timeEndAction = passthrough('timeEnd');
const clearAction = passthrough('clear');
const markAction = ifPerf('mark');
const measureAction = ifPerf('measure');
const profileAction = ifAvailable('profile', 'info');
const profileEndAction = ifAvailable('profileEnd', 'info');
/**
 * Base logger class. Provides the full logging API (level methods, flags,
 * passthroughs, debug helpers). Use the pre-exported `defaultLogger` for
 * app-wide logging or `componentLogger` for component-scoped (set `.label`
 * or pass label as first arg to methods). Instantiate directly with a
 * defaultLabel for custom cases.
 */
class Logger {
	/**
	 * Default label bound at construction. When set,
	 * level-log calls can omit the label arg and it is supplied automatically.
	 * Sub-labels supported via `log.info('subcat', msg)` → effective label
	 * becomes "Comp:subcat".
	 */
	label = null;
	constructor(defaultLabel = null) {
		this.label = defaultLabel;
	}
	/**
	 * Global verbosity. Affects every logger instance. No-op in production.
	 * @returns {number} the numeric rank that was applied.
	 */
	static setLevel(level) {
		return setActiveLevel(level);
	}
	setLevel(level) {
		return Logger.setLevel(level);
	}
	/**
	 * Current verbosity rank (0=silent … 5=perf).
	 * @returns {number} current active rank.
	 */
	static getLevel() {
		return activeRank;
	}
	/**
	 * Current verbosity rank (0=silent … 5=perf).
	 * @returns {number} current active rank.
	 */
	getLevel() {
		return activeRank;
	}
	/*
	 * Live boolean gates for hot callsites (per-render etc). A getter read +
	 * branch lets disabled levels avoid *all* work at the guard site.
	 * `perfOn` additionally protects the deep-equals inside perf diagnostics.
	 */
	get debugOn() {
		return computeFlag('debug');
	}
	get perfOn() {
		return computeFlag('perf');
	}
	// Levelled loggers. The ...callArgs form lets us normalize label when a
	// defaultLabel is present on this instance without allocating per-method.
	info(...callArgs) {
		return this.#levelLog('info', ...callArgs);
	}
	success(...callArgs) {
		return this.#levelLog('success', ...callArgs);
	}
	warn(...callArgs) {
		return this.#levelLog('warn', ...callArgs);
	}
	error(...callArgs) {
		return this.#levelLog('error', ...callArgs);
	}
	debug(...callArgs) {
		return this.#levelLog('debug', ...callArgs);
	}
	perf(...callArgs) {
		return this.#levelLog('perf', ...callArgs);
	}
	/*
	 * Lazy-message form: a function `msg` is invoked with the trailing args
	 * (module-level formatter + data beats a per-call closure) and may return
	 * null/undefined to skip the line. Plain form: trailing args are DATA and
	 * are forwarded to the console — dropping them loses the error objects
	 * and state snapshots the error sinks pass.
	 */
	#levelLog(level, ...callArgs) {
		if (IS_PRODUCTION && level !== 'error') {
			return undefined;
		}
		const rank = LEVEL_RANK[level];
		if (rank > activeRank) {
			return undefined;
		}
		let label;
		let msg;
		let extra;
		if (this.label === null || this.label === undefined) {
			label = callArgs[0];
			msg = callArgs[1];
			extra = callArgs.slice(2);
		} else if (callArgs.length > 1 && isString(callArgs[0])) {
			label = `${this.label}:${callArgs[0]}`;
			msg = callArgs[1];
			extra = callArgs.slice(2);
		} else {
			label = this.label;
			msg = callArgs[0];
			extra = callArgs.slice(1);
		}
		if (isFunction(msg)) {
			const resolved = msg(...extra);
			if (resolved == null) {
				return;
			}
			printLine(level, label, resolved, []);
			return;
		}
		if (msg == null) {
			return;
		}
		printLine(level, label, msg, extra);
	}
	header(text, style) {
		return headerAction(text, style);
	}
	rule(text) {
		return ruleAction(text);
	}
	group(title, collapsed) {
		let useLabel = title;
		let resolvedCollapsed = collapsed;
		if (this.label !== null && this.label !== undefined) {
			if (arguments.length > 0) {
				useLabel = `${this.label}:${title}`;
				resolvedCollapsed = collapsed;
			} else {
				useLabel = this.label;
				resolvedCollapsed = title;
			}
		}
		return groupAction(useLabel, resolvedCollapsed);
	}
	groupEnd() {
		return groupEndAction();
	}
	table(...args) {
		return tableAction(...args);
	}
	dir(...args) {
		return dirAction(...args);
	}
	count(...args) {
		return countAction(...args);
	}
	countReset(...args) {
		return countResetAction(...args);
	}
	time(...args) {
		return timeAction(...args);
	}
	timeLog(...args) {
		return timeLogAction(...args);
	}
	timeEnd(...args) {
		return timeEndAction(...args);
	}
	clear(...args) {
		return clearAction(...args);
	}
	trace(...callArgs) {
		let label;
		let extraArgs;
		if (this.label === null || this.label === undefined) {
			label = callArgs[0];
			extraArgs = callArgs.slice(1);
		} else if (callArgs.length > 1 && isString(callArgs[0])) {
			label = `${this.label}:${callArgs[0]}`;
			extraArgs = callArgs.slice(1);
		} else {
			label = this.label;
			extraArgs = callArgs;
		}
		return traceAction(label, ...extraArgs);
	}
	assert(condition, first, ...args) {
		let label = first;
		let rest = args;
		if (this.label !== null && this.label !== undefined) {
			if (first !== undefined && isString(first)) {
				label = `${this.label}:${first}`;
				rest = args;
			} else {
				label = this.label;
				rest = [first, ...args];
			}
		}
		// else: classic use with explicit label arg
		console.assert(condition, `%c[${label}]`, colorMap.error, ...rest);
	}
	mark(label, ...rest) {
		return markAction(label, ...rest);
	}
	measure(label, ...rest) {
		return measureAction(label, ...rest);
	}
	profile(...args) {
		return profileAction(...args);
	}
	profileEnd(...args) {
		return profileEndAction(...args);
	}
	break(condition) {
		if (IS_PRODUCTION) {
			return;
		}
		if (condition === undefined || condition) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
	}
	breakOn(first, condition) {
		let label = first;
		let resolvedCondition = condition;
		if (this.label === null || this.label === undefined) {
			// no default label: use provided first as label
		} else if (arguments.length > 1) {
			label = `${this.label}:${first}`;
			resolvedCondition = condition;
		} else {
			label = this.label;
			resolvedCondition = first;
		}
		if (IS_PRODUCTION) {
			return;
		}
		if (resolvedCondition) {
			printLine('debug', label, 'breakpoint hit', []);
			// eslint-disable-next-line no-debugger
			debugger;
		}
	}
	inspect(first, value) {
		let label = first;
		let resolvedValue = value;
		if (this.label === null || this.label === undefined) {
			// no default
		} else if (arguments.length > 1) {
			label = `${this.label}:${first}`;
			resolvedValue = value;
		} else {
			label = this.label;
			resolvedValue = first;
		}
		if (IS_PRODUCTION) {
			return resolvedValue;
		}
		console.log(`%c[${label}]`, colorMap.debug, resolvedValue);
		console.dir(resolvedValue, {
			depth: null,
		});
		return resolvedValue;
	}
}
/**
 * Pre-instantiated loggers for common use.
 * - defaultLogger: general app-wide logging (pass label as first arg to methods).
 * - componentLogger: for component code (you can reassign .label or use labels).
 */
export const defaultLogger = new Logger();
export const componentLogger = new Logger('WebComponent');
defaultLogger.info('Logger initialized at level:', Logger.getLevel());
