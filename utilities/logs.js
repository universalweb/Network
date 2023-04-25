import chalk from 'chalk';
import {
	stringify,
	each,
	isPlainObject
} from 'Acid';
export function prettyObjects(args, consoleBase) {
	return each(args, (item) => {
		console.log(consoleBase((isPlainObject(item)) ? stringify(item, null, `  `) : item));
	});
}
function logFactory(bg, color, header, footer) {
	const consoleBase = (bg) ? chalk[bg].hex(color) : chalk.hex(color);
	return function(...args) {
		const descriptor = this?.descriptor || '';
		if (footer) {
			const fullHeader = (descriptor) ? ` ---------------- ${descriptor}: ${header} START ---------------- ` : ` ---------------- ${header} START ---------------- `;
			console.log(consoleBase(fullHeader, `\n`));
			prettyObjects(args, consoleBase);
			console.log(consoleBase(` ---------------- ${header} END ---------------- `, `\n`));
		} else {
			const fullHeader = (descriptor) ? `${descriptor}: ${header}   =>  ` : `${header}  =>  `;
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
