import chalk from 'chalk';
import {
	stringify,
	each,
	isPrimitive,
	initialString,
	isArray,
	isBuffer
} from 'Acid';
const arrayNumberRegex = /\[([\d\s,]*?)\]/gm;
function truncateArray(match) {
	return match.replace(/\s/gm, '');
}
function shortenArrays(item) {
	return item.replace(arrayNumberRegex, truncateArray);
}
export function prettyObjects(args, consoleBase) {
	return each(args, (item) => {
		console.log(consoleBase((isPrimitive(item) || isArray(item) || isBuffer(item)) ? item : shortenArrays(stringify(item, null, `  `))));
	});
}
function logFactory(bg, color, header, footer) {
	const consoleBase = (bg) ? chalk[bg].hex(color) : chalk.hex(color);
	return function(...args) {
		if (footer) {
			const fullHeader = ` ---------------- ${header} START ---------------- `;
			console.log(consoleBase(fullHeader));
			prettyObjects(args, consoleBase);
			console.log(consoleBase(` ---------------- ${header} END ---------------- `, `\n`));
		} else {
			const fullHeader = `${header}  =>  `;
			console.log(consoleBase(fullHeader));
			prettyObjects(args, consoleBase);
		}
	};
}
export const warning = logFactory('bgYellow', '#000000', 'WARNING');
export const failed = logFactory('bgRed', '#ffffff', 'FAILED');
export const info = logFactory(null, '#2962ff', 'INFO');
export const configure = logFactory('bgMagenta', '#ffffff', 'CONFIGURATION');
export const msgSent = logFactory(null, '#6200ea', 'MESSAGE SEND', true);
export const msgReceived = logFactory(null, '#6200ea', 'MESSAGE RECEIVED', true);
export const imported = logFactory(null, '#f50057', 'IMPORTED');
export const logCert = logFactory(null, '#ffab00', 'CERTIFICATE', true);
export const attention = logFactory(null, '#FF0000', 'ATTENTION');
export const success = logFactory(null, '#00e676', 'SUCCESS');
export const connected = logFactory(null, '#00e636', 'CONNECTED');
imported(`Console`);
