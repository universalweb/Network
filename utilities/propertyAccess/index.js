module.exports = (state) => {
	const {
		utility: {
			apply,
			hasValue,
			mapWhile,
		}
	} = state;
	const regEx = /^([a-zA-Z0-9.]+)$/;
	const sensitiveWords = /(constructor|prototype|window|self|top|alert|confirm|eval|function|Object|Array)/;
	const isPropertyValid = (string) => {
		return regEx.test(string) && !sensitiveWords.test(string);
	};
	const goDownTree = (currentPosition, item) => {
		if (apply(Object.prototype.hasOwnProperty, currentPosition, [item])) {
			return true;
		}
	};
	const errorNoneExistentProperty = 'None existent property';
	const errorPropertyStringAccess = 'Property string access';
	const getPropertyFromString = (string, objectMain, error) => {
		let object = objectMain;
		const arraySplit = string.split('.');
		mapWhile(arraySplit, (item) => {
			if (goDownTree(object, item)) {
				object = object[item];
			} else {
				error(errorPropertyStringAccess, errorNoneExistentProperty, string);
				object = false;
				return !hasValue(object);
			}
		});
		return object;
	};
	state.utility.isPropertyValid = isPropertyValid;
	state.utility.getProperty = getPropertyFromString;
};
