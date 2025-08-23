import {
	each,
	initialString,
	isArray,
	isBuffer,
	isPrimitive,
	stringify
} from '@universalweb/utilitylib';
import chalk from 'chalk';
const arrayNumberRegex = /\[([\d\s,]*?)\]/gm;
function truncateArray(match) {
	return match.replace(/\s/gm, '');
}
function shortenArrays(item) {
	return item.replace(arrayNumberRegex, truncateArray);
}
export function prettyObjects(args, consoleBase, isError) {
	return each(args, (item) => {
		console.log(consoleBase((isPrimitive(item) || isArray(item) || isBuffer(item)) ? item : shortenArrays(stringify(item, null, `  `))));
	});
}
function logFactory(bg, color, header, footer, isError = false) {
	const consoleBase = bg ? chalk[bg].hex(color) : chalk.hex(color);
	return function(...args) {
		if (footer) {
			const fullHeader = ` ---------------- ${header} START ---------------- `;
			console.log(consoleBase(fullHeader));
			prettyObjects(args, consoleBase, isError);
			if (isError) {
				console.trace(`Error`);
			}
			console.log(consoleBase(` ---------------- ${header} END ---------------- `, `\n`));
		} else {
			const fullHeader = `${header}  =>  `;
			console.log(consoleBase(fullHeader));
			if (isError) {
				console.trace(`Error`);
			}
			prettyObjects(args, consoleBase, isError);
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
export const connectedLog = logFactory(null, '#00e636', 'CONNECTED');
