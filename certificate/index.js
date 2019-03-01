module.exports = async (state) => {
  const {
    logImprt,
    cnsl,
    alert,
    certLog,
    utility: {
      jsonParse
    },
    file: {
      read
    },
    crypto: {
      toBuffer
    }
  } = state;
  logImprt('CERTIFICATE', __dirname);
  function bufferKeypairs(certificate) {
    if (certificate.key) {
      certificate.key = toBuffer(certificate.key);
    }
    if (certificate.private) {
      certificate.private = toBuffer(certificate.private);
    }
    if (certificate.signature) {
      certificate.signature = toBuffer(certificate.signature);
    }
    if (certificate.print) {
      certificate.print = toBuffer(certificate.print);
    }
  }
  async function parse(raw, toBufferFlag) {
    let master;
    certLog('GOT => ', raw);
    const certificate = jsonParse(raw);
    certLog('GOT => ', certificate);
    if (toBufferFlag) {
      bufferKeypairs(certificate);
      if (certificate.ephemeral) {
        bufferKeypairs(certificate.ephemeral);
      }
    }
    return certificate;
  }
  async function verify(parent, child) {
    const parentCertificate = parent;
    const childCertificate = child;
    cnsl(parentCertificate, childCertificate);
  }
  const currentDirectory = __dirname.replace('/certificate', '');
  async function get(location, toBufferFlag) {
    certLog('Get => ', location.replace(currentDirectory, ''));
    const file = await read(location);
    if (file) {
      return parse(file, toBufferFlag);
    } else {
      alert('FAILED TO LOAD CERT', location.replace(currentDirectory, ''));
    }
  }
  state.certificates = {};
  state.certificate = {
    get,
    parse,
    verify,
  };
};
