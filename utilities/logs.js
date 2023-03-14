import chalk from 'chalk';
import {
	stringify,
	mapArray,
	isPlainObject
} from 'Acid';
export function prettyObjects(values) {
	return mapArray(values, (item) => {
		return (isPlainObject(item)) ? stringify(item, null, `  `) : item;
	});
}
function logFactory(bg, color, header, footer) {
	const consoleBase = (bg) ? chalk[bg].hex(color) : chalk.hex(color);
	return function(...args) {
		const descriptor = this?.descriptor || '';
		const prettyItems = prettyObjects(args);
		if (footer) {
			const fullHeader = (descriptor) ? ` ---------------- ${descriptor}: ${header} START ---------------- ` : ` ---------------- ${header} START ---------------- `;
			console.log(consoleBase(fullHeader, `\n`));
			console.log(consoleBase(...prettyItems, `\n`));
			console.log(consoleBase(` ---------------- ${header} END ---------------- `, `\n`));
		} else {
			const fullHeader = (descriptor) ? `${descriptor}: ${header}   =>  ` : `${header}  =>  `;
			console.log(consoleBase(fullHeader, ...prettyItems, `\n`));
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
export const cert = logFactory(null, '#ffab00', 'CERTIFICATE', true);
export const attention = logFactory(null, '#FF0000', 'ATTENTION');
export const success = logFactory(null, '#00e676', 'SUCCESS');
export const connected = logFactory(null, '#00e636', 'CONNECTED');
imported(`Console`);
