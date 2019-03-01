module.exports = async (state) => {
  const {
    error: logError,
    success,
    parseMessage,
    crypto: {
      decrypt,
      serverSession,
    },
    public: {
      onMessage
    },
    certificates: {
      active: {
        ephemeral: {
          private: serverPrivateKey,
          key: serverPublicKey
        }
      }
    },
    alert,
    logReceived,
    pluckBuffer,
    pluckBuffer64,
    utility: {
      jsonParse
    },
    createStream
  } = state;
  let count = 0;
  alert(serverPrivateKey.toString('base64'));
  async function createStreamMessage(connection, packet) {
    const ephemeralCertificateSize = pluckBuffer(packet, 2, 5, `ephemeralCertificateSize`);
    if (!ephemeralCertificateSize) {
      return;
    }
    const certificateEndIndex = Number(ephemeralCertificateSize.toString()) + 5;
    const ephemeralCertificate = pluckBuffer(packet, 5, certificateEndIndex, `ephemeralCertificate`);
    if (!ephemeralCertificate) {
      return;
    }
    const streamIDEndIndex = certificateEndIndex + 8;
    const streamID = pluckBuffer(packet, certificateEndIndex, streamIDEndIndex, `streamID`, 'base64');
    if (!streamID) {
      return;
    }
    const nonceEndIndex = streamIDEndIndex + 24;
    const nonce = pluckBuffer(packet, streamIDEndIndex, nonceEndIndex, `nonce`, 'base64');
    if (!nonce) {
      return;
    }
    const encryptedLengthEndIndex = nonceEndIndex + 4;
    success(`encryptedEndIndex: ${encryptedLengthEndIndex}`);
    const encryptedLength = pluckBuffer(packet, nonceEndIndex, encryptedLengthEndIndex, `encrypted`);
    if (!encryptedLength) {
      return;
    }
    const ad = pluckBuffer(packet, 0, nonceEndIndex, `Additional Data`);
    const encryptedEndIndex = Number(encryptedLength.toString()) + encryptedLengthEndIndex;
    const encrypted = pluckBuffer(packet, encryptedLengthEndIndex, encryptedEndIndex, `encrypted Message`, 'base64');
    if (!encrypted) {
      return;
    }
    success(`Encrypted Message Size: ${encrypted.length}`);
    const publicCertificate = jsonParse(ephemeralCertificate);
    const sessionKey = serverSession(serverPublicKey, serverPrivateKey, Buffer.from(publicCertificate.key, 'base64'));
    const receiveKey = sessionKey.receiveKey;
    const transmitKey = sessionKey.transmitKey;
    success(`receiveKey: ${receiveKey.toString('base64')}`);
    success(`transmitKey: ${transmitKey.toString('base64')}`);
    console.log(ad.toString('base64'));
    console.log(ad.toString('base64').length);
    const decrypted = decrypt(encrypted, ad, nonce, receiveKey);
    if (!decrypted) {
      return logError(`Decrypt Failed`);
    }
    success(`Decrypted ${decrypted.toString()}`);
    const jsonString = decrypted.toString();
    if (jsonString) {
      if (jsonString.length > 1100) {
        return logError('Client sent large datagram not allowed');
      }
      const json = parseMessage(jsonString);
      logReceived(json);
      if (!json) {
        return logError('JSON ERROR', connection);
      }
      count++;
      const stream = await createStream(connection, receiveKey, transmitKey, streamID);
      await onMessage(stream, json);
      success(`Messages Received: ${count}`);
    }
  }
  state.createStreamMessage = createStreamMessage;
};
