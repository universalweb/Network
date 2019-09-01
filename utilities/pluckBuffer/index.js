module.exports = (state) => {
	const {
		success,
		error: logError,
	} = state;
	state.pluckBuffer = (messageBuffer, startIndex, endIndex, bufferName, charFormat) => {
		const plucked = messageBuffer.slice(startIndex, endIndex);
		if (!plucked) {
			logError(`${bufferName}`);
			return;
		}
		success(`${bufferName} ${plucked.toString(charFormat)}`);
		return plucked;
	};
	state.pluckBuffer64 = (messageBuffer, startIndex, endIndex, bufferName) => {
		const plucked = messageBuffer.slice(startIndex, endIndex);
		if (!plucked) {
			logError(`${bufferName}`);
			return;
		}
		success(`${bufferName} ${plucked.toString('base64')}`);
		return plucked.toString('base64');
	};
};
