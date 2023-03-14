function buildPacketSize(encryptedLength, maxPacketSizeLength = 4) {
	const encryptedLengthSize = encryptedLength.toString().length;
	let encryptedSizePacket;
	if (encryptedLengthSize < maxPacketSizeLength) {
		encryptedSizePacket = '0'.repeat(4 - encryptedLengthSize) + encryptedLength.toString();
	} else {
		encryptedSizePacket = encryptedLengthSize.toString();
	}
	return Buffer.from(encryptedSizePacket);
}
export default buildPacketSize;
