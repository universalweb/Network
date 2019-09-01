module.exports = (state) => {
	const {
		crypto: {
			hashSign,
		},
		utility: {
			assign,
			keys,
			remove,
			isNumber,
			isPlainObject
		},
		logImprt
	} = state;
	logImprt('Sign', __dirname);
	function getCertificateKeys(certificate, exclude) {
		const certKeys = keys(certificate);
		if (exclude) {
			remove(certKeys, exclude);
		}
		// Sort Keys in ABC order
		certKeys.sort();
		console.log('Certificate Keys Sorted for signature', certKeys);
		return certKeys;
	}
	function pluckCertificate(certificate, exclude, pluckedValuesArray = []) {
		const certKeys = getCertificateKeys(certificate, exclude);
		const certKeysLength = certKeys.length;
		let pluckedValuesLength = 0;
		for (let index = 0; index < certKeysLength; index++) {
			const item = certificate[certKeys[index]];
			let buffered;
			if (Buffer.isBuffer(item)) {
				buffered = item;
			} else if (isNumber(item)) {
				buffered = Buffer.from(`${item}`);
			} else if (isPlainObject(item)) {
				buffered = pluckCertificate(item);
			} else {
				buffered = Buffer.from(item);
			}
			pluckedValuesArray.push(buffered);
			pluckedValuesLength += buffered.length;
		}
		const pluckedValues = Buffer.concat(pluckedValuesArray, pluckedValuesLength);
		return pluckedValues;
	}
	const api = {
		sign(certificate, authority, exclude) {
			console.log('Sign Certificate');
			const concatValues = pluckCertificate(certificate, exclude);
			return hashSign(concatValues, authority.private);
		},
		getCertificateKeys,
		pluckCertificate
	};
	assign(state.certificate, api);
};
