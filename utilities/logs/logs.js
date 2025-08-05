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
// ℹ ✖ ✔ ❗️ ❓ 🔍 🔧 🔒 🔑 📦 📄 📊 📈 📉 📅 🗓️ 🕒
// TODO: ADD OPTION FOR stream from SIGNALE
// const {
// 	warn: warningLog,
// 	fatal: fatalLog,
// 	info: infoLog,
// 	note: noteLog,
// 	success: successLog,
// 	complete: completedLog,
// 	error: errorLog,
// 	verbose: verboseLog,
// } = signale;
function bannerLog(data, title = '', borderColor = 'blue', borderStyle = 'round') {
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
	bannerLog,
	// warningLog,
	// fatalLog,
	// infoLog,
	// successLog,
	// verboseLog,
	// noteLog,
	// completedLog,
	// errorLog,
};
