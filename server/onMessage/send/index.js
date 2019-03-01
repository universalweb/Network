module.exports = async (state) => {
  await require('./buildPacketSize')(state);
  await require('./buildStringSize')(state);
  const {
    server,
    logImprt,
    error: errorLog,
    logSent,
    utility: {
      stringify,
      promise
    },
    crypto: {
      encrypt,
      randombytes_buf,
      toBase64
    },
    success,
    buildPacketSize,
    puzzleFlag,
  } = state;
  logImprt('Send', __dirname);
  // StreamID, nonce, encrypted message size, flags, packet size.
  const packetDefaultsLength = 8 + 24 + 4 + 2 + 4;
  async function send(messageObject, address, port, nonce, transmitKey, streamId, streamIdBuffer) {
    success(`SENDING MESSAGE:`, messageObject);
    success(`StreamID: ${streamId}`);
    success(`Transmit Key ${toBase64(transmitKey)}`);
    const json = stringify(messageObject);
    const jsonBuffer = Buffer.from(`${json}`);
    randombytes_buf(nonce);
    success(`Nonce ${toBase64(nonce)} Size: ${nonce.length}`);
    const ad = [
      puzzleFlag, // Puzzle Flag - Used to challenge the client
      streamIdBuffer,
      nonce,
    ];
    const additionalDataBuffer = Buffer.concat(ad);
    success('Additional Data Buffer', additionalDataBuffer.toString('base64'));
    const encryptedMessage = encrypt(jsonBuffer, additionalDataBuffer, nonce, transmitKey);
    const encryptedLength = encryptedMessage.length;
    if (!encryptedMessage) {
      return errorLog('Encryption failed');
    }
    success(`Encrypted Message: Size:${encryptedMessage.length} ${encryptedMessage.toString('base64')}`);
    const encryptedSizePacket = buildPacketSize(encryptedLength);
    const sendBuffer = [
      ...ad,
      encryptedSizePacket,
      encryptedMessage,
    ];
    const realPacketSize = encryptedLength + packetDefaultsLength + 3;
    const packetSize = buildPacketSize(realPacketSize);
    sendBuffer.unshift(packetSize);
    const buffered = sendBuffer;
    return promise((accept, reject) => {
      server.send(buffered, port, address, (error) => {
        if (error) {
          reject(error);
          return errorLog(error);
        }
        success('Message Sent');
        logSent(buffered.toString('base64'), `Size:${buffered.length}`);
        accept();
      });
    });
  }
  state.send = send;
};
