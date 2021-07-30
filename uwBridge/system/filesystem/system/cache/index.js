module.exports = async (app) => {
  const fs = require('fs');
  const cryptoRequire = require('crypto');
  const liveReload = require('./liveReload')(app);
  const {
    config,
    system,
    client,
    utility: {
      isArray,
      isString,
      ifInvoke,
      assign,
      eachArray,
      last,
      watch,
    }
  } = app;
  const hashObject = {};
  const defaultStreamSettings = {
    autoClose: true,
    encoding: 'utf-8',
  };
  const resourceDir = config.resourceDir;
  const generateChecksum = (str) => {
    return cryptoRequire.createHash('md5')
      .update(str, 'utf8')
      .digest('hex');
  };
  const cacheGet = (key) => {
    return {
      checksum: hashObject[`cs-${key}`],
      item: hashObject[key],
    };
  };
  const cacheSet = (key, dataArg, chunksumArg) => {
    const fileName = last(key.split('/'));
    if (fileName[0] === '.') {
      return;
    }
    let chunksum = chunksumArg;
    let dataAsString;
    const data = dataArg;
    if (isArray(data)) {
      if (!chunksum) {
        chunksum = generateChecksum(dataAsString);
      }
    } else if (isString(data)) {
      if (!chunksum) {
        chunksum = generateChecksum(data);
      }
    } else if (!chunksum) {
      chunksum = generateChecksum(data.toString());
    }
    if (hashObject[`cs-${key}`] === chunksum) {
      return cacheGet(key);
    }
    hashObject[`cs-${key}`] = chunksum;
    hashObject[key] = data;
    return {
      chunksum,
      item: data,
    };
  };
  const cache = (key, callbackOrData) => {
    let data;
    if (!key) {
      data = hashObject;
    } else if (callbackOrData) {
      data = cacheSet(key, callbackOrData);
    } else {
      data = cacheGet(key, callbackOrData);
    }
    return data;
  };
  const sendClientUpdate = (filepath) => {
    if (client.cache) {
      ifInvoke(client.cache.update, filepath);
    }
    liveReload(filepath);
  };
  const createStream = (filepath, cs, updateMode) => {
    const readableStream = fs.createReadStream(filepath, defaultStreamSettings);
    const cacheFile = [];
    readableStream.setEncoding('utf8');
    readableStream.on('data', (item) => {
      cacheFile.push(item);
    });
    readableStream.on('end', () => {
      cacheSet(filepath, cacheFile, cs);
      if (updateMode) {
        sendClientUpdate(filepath);
      }
    });
  };
  const checkIfFileExists = (filepath, updateMode) => {
    if (filepath && filepath.includes(resourceDir)) {
      fs.stat(filepath, (err, stats) => {
        if (err) {
          // console.log(err);
          return;
        }
        // console.log(filepath, 'File found create stream /n');
        createStream(filepath, stats.ctime.toString(), updateMode);
      });
    }
  };
  const dirname = config.resourceDir;
  watch(dirname, (filepath) => {
    console.log(filepath);
    checkIfFileExists(filepath, true);
  });
  assign(cache, {
    collection: hashObject,
    get: cacheGet,
    loadFile: checkIfFileExists,
    set: cacheSet,
  });
  const files = await require('./preLoadAssets')(app);
  eachArray(files, (item) => {
    checkIfFileExists(item, false);
  });
  system.cache = cache;
};