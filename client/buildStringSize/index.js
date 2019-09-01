module.exports = (udspPrototype) => {
	const maxStringSizeLength = 3;
	function buildStringSize(encryptedLength) {
		const encryptedLengthSize = encryptedLength.toString().length;
		let encryptedSizePacket;
		if (encryptedLengthSize < maxStringSizeLength) {
			encryptedSizePacket = '0'.repeat(3 - encryptedLengthSize) + encryptedLength.toString();
		} else {
			encryptedSizePacket = encryptedLength.toString();
		}
		return Buffer.from(encryptedSizePacket);
	}
	udspPrototype.maxStringSizeLength = maxStringSizeLength;
	udspPrototype.buildStringSize = buildStringSize;
};
