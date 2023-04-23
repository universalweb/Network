export function buildStringSize(encryptedLength, maxStringSizeLength = 3) {
	const encryptedLengthSize = encryptedLength.toString().length;
	let encryptedSizePacket;
	if (encryptedLengthSize < maxStringSizeLength) {
		encryptedSizePacket = '0'.repeat(3 - encryptedLengthSize) + encryptedLength.toString();
	} else {
		encryptedSizePacket = encryptedLength.toString();
	}
	return Buffer.from(encryptedSizePacket);
}
export default buildStringSize;

