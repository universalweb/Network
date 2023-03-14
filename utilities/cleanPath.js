module.exports = async (state) => {
	const {
		normalize
	} = require('path');
	const truncate = require('truncate-utf8-bytes');
	const illegalRe = /[?<>\\:*|":]/g;
	const controlRe = /[\x00-\x1f\x80-\x9f]/g;
	const reservedRe = /^\.+$/;
	const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
	const cleanPath = (filepath) => {
		return truncate(normalize(filepath)
			.replace(illegalRe, '')
			.replace(controlRe, '')
			.replace(reservedRe, '')
			.replace(windowsReservedRe, ''), 255);
	};
	state.utility.cleanPath = cleanPath;
};
