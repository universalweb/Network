import {
	each,
	initialString,
	isArray,
	isBuffer,
	isPrimitive,
	stringify
} from '@universalweb/acid';
import signale from 'signale';
const {
	warn: warningLog,
	fatal: fatalLog,
	info: infoLog,
	success: successLog,
	log: verboseLog,
	note: noteLog,
	complete: completedLog,
	error: errorLog,
} = signale;
export {
	warningLog,
	fatalLog,
	infoLog,
	successLog,
	verboseLog,
	noteLog,
	completedLog,
	errorLog
};
