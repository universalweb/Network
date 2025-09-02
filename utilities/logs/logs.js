import {
	bgBlack,
	bgBlackBright,
	bgBlue,
	bgCyan,
	bgGreen,
	bgMagenta,
	bgRed,
	bgWhite,
	bgYellow,
	black,
	blue,
	bold,
	cyan,
	cyanBright,
	green,
	italic,
	magenta,
	red,
	underline,
	white,
	yellow,
} from 'colorette';
import {
	each,
	initialString,
	isArray,
	isBuffer,
	isPrimitive,
	stringify,
	upperCase,
} from '@universalweb/utilitylib';
import boxen from 'boxen';
// Icons for different log types
const ICONS = {
	success: '✔',
	warning: '⚠',
	error: '✖',
	info: 'ℹ',
	verbose: '➤',
	debug: '☞',
	fatal: '✘',
	trace: '◎',
	completed: '☑',
	note: '•',
};
// Logging functions with icons
function formatTitle(primary, primaryColor, secondaryColor, showTitle) {
	if (!showTitle) {
		return '';
	}
	let formatted = '';
	if (primary) {
		let colored = primaryColor(` ${upperCase(primary)} `);
		colored = bold(colored);
		formatted += colored;
	}
	return formatted;
	// End of log functions
	// End of rootLog and log functions
	// End of rootLog and log functions
}
function rootLog(config) {
	const {
		icon,
		defaultTitle,
		secondaryTitle,
		primaryColor,
		secondaryColor,
		message,
		data = [
			1, 2, 4,
		],
		showTitle = false,
	} = config;
	const titleStr = formatTitle(
		defaultTitle,
		primaryColor,
		secondaryColor,
		showTitle
	);
	const iconStr = icon ? secondaryColor(bold(icon)) : '';
	const secondaryTitleStr = secondaryTitle ? underline(secondaryColor(upperCase(secondaryTitle))) : '';
	const arrow = italic(yellow('▶'));
	if (showTitle) {
		console.log(`${iconStr} ${titleStr} ${secondaryTitleStr} ${arrow} ${message}`, ...data);
	} else {
		console.log(`${iconStr} ${secondaryTitleStr} ${arrow} ${message}`, ...data);
	}
}
function successLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.success,
		defaultTitle: 'SUCCESS',
		secondaryTitle,
		primaryColor: bgGreen,
		secondaryColor: green,
		message,
		data,
		showTitle,
	});
}
function noteLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.note,
		defaultTitle: 'NOTE',
		secondaryTitle,
		primaryColor: bgBlue,
		secondaryColor: blue,
		message,
		data,
		showTitle,
	});
}
function completedLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.completed,
		defaultTitle: 'COMPLETED',
		secondaryTitle,
		primaryColor: bgGreen,
		secondaryColor: green,
		message,
		data,
		showTitle,
	});
}
function errorLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.error,
		defaultTitle: 'ERROR',
		secondaryTitle,
		primaryColor: bgRed,
		secondaryColor: red,
		message,
		data,
		showTitle,
	});
}
function verboseLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.verbose,
		defaultTitle: 'VERBOSE',
		secondaryTitle,
		primaryColor: bgMagenta,
		secondaryColor: magenta,
		message,
		data,
		showTitle,
	});
}
function infoLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.info,
		defaultTitle: 'INFO',
		secondaryTitle,
		primaryColor: bgCyan,
		secondaryColor: cyan,
		message,
		data,
		showTitle,
	});
}
function fatalLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.fatal,
		defaultTitle: 'FATAL',
		secondaryTitle,
		primaryColor: bgRed,
		secondaryColor: red,
		message,
		data,
		showTitle,
	});
}
function warningLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.warning,
		defaultTitle: 'WARNING',
		secondaryTitle,
		primaryColor: bgYellow,
		secondaryColor: yellow,
		message,
		data,
		showTitle,
	});
}
function traceLog(secondaryTitle, message, showTitle = false, ...data) {
	rootLog({
		icon: ICONS.trace,
		defaultTitle: 'TRACE',
		secondaryTitle,
		primaryColor: bgBlack,
		secondaryColor: black,
		message,
		data,
		showTitle,
	});
}
function bannerLog(data, title = '', borderColor = 'cyan', borderStyle = 'round') {
	console.log(boxen(upperCase(data), {
		title: upperCase(title),
		titleAlignment: 'center',
		textAlignment: 'center',
		borderColor,
		borderStyle,
		padding: 1,
		height: 1,
		float: 'center',
		fullscreen: true,
	}));
}
export {
	errorLog,
	infoLog,
	successLog,
	verboseLog,
	warningLog,
	bannerLog,
	fatalLog,
	traceLog,
	rootLog,
	noteLog,
	completedLog,
	ICONS,
};
// errorLog('SERVER', 'texting');
// infoLog('SERVER', 'texting');
// successLog('SERVER', 'texting');
// verboseLog('SERVER', 'texting');
// debugLog('SERVER', 'texting');
// traceLog('SERVER', 'texting');
// bannerLog('SERVER', 'texting', 'green', 'double');
