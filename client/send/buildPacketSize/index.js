module.exports = async (state) => {
  const maxPacketSizeLength = 4;
  function buildPacketSize(encryptedLength) {
    const encryptedLengthSize = encryptedLength.toString().length;
    let encryptedSizePacket;
    if (encryptedLengthSize < maxPacketSizeLength) {
      encryptedSizePacket = '0'.repeat(4 - encryptedLengthSize) + encryptedLength.toString();
    } else {
      encryptedSizePacket = encryptedLengthSize.toString();
    }
    return Buffer.from(encryptedSizePacket);
  }
  state.maxPacketSizeLength = maxPacketSizeLength;
  state.buildPacketSize = buildPacketSize;
};
