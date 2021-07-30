(function() {
  'use strict';

  const app = {
    config: {},
    utility: self.$
  };

  const {utility: {assign: assign$2, }} = app;
  const post = (id, data, options) => {
    const responseData = {
      data,
      id
    };
    assign$2(responseData, options);
    postMessage(responseData);
  };

  const {config, utility: {assign: assign$1, }} = app;
  const events = {
    appStatus: {
      state: 0
    },
    configure(data) {
      console.log(data);
      assign$1(config, data);
      socketInitialize();
    },
    credit(data) {
      app.creditSave = data;
      console.log('Credits Saved in worker');
    },
    post,
    socket: {}
  };

  const {utility: {assign, uid, stringify, mapArray, last, isFileJS, isFileJSON, isFileCSS, initial, map, eachArray, zipObject, }} = app;
  let socket;
  let alreadySetup;
  const routerData = self.location;
  const tickMark = '\`';
  const isLib = /^js\/lib\//;
  const commaString = ',';
  const convertToTemplateString = /:"([^,]*?)"/gm;
  const convertToTemplateStringReplace = ':`$1`';
  const importRegexGlobal = /\b\w*import\b([^:;=]*?)?(["']*([\w'/$,{}_]+)["'][^\w])/gm;
  const importLocationsRegex = /[`'"](.*?)[`'"]/;
  const importVarsRegex = /[^$]{([^;]*?)}/;
  const slashString = '/';
  const update = function(json) {
    post('_', json);
  };
  const callbacks = {
    update,
  };
  const apiClient = function(data) {
    if (!data.id) {
      return update(data);
    }
    const callback = callbacks[data.id];
    if (callback) {
      return callback(data);
    }
  };
  const mainCallback = function(data, uniq, callable, options) {
    const callbackData = {};
    let cleanup = true;
    callbackData.data = data.data;
    const returned = callable(callbackData);
    if (options.async) {
      if (returned === true) {
        cleanup = false;
      }
    }
    if (cleanup) {
      callbacks[uniq] = null;
      uid.free(uniq);
    }
  };
  // emit function with synthetic callback system
  const request = (config, workerData) => {
    const data = config.data;
    const callback = (json) => {
      let result;
      const workerCallback = config.callback;
      if (workerCallback) {
        result = workerCallback(json.data);
      } else if (workerData) {
        result = post(workerData.id, json.data);
      }
      return result;
    };
    const options = {
      async: config.async,
    };
    if (data.id) {
      data.id = undefined;
    } else {
      const uniq = uid()
        .toString();
      data.id = uniq;
      callbacks[uniq] = function(callbackData) {
        mainCallback(callbackData, uniq, callback, options);
      };
    }
    socket.emit('api', data);
  };
  const socketIsReady = (data) => {
    console.log('Socket Is Ready');
    if (!alreadySetup) {
      post('setupCompleted', {
        language: data.language,
      });
    }
    alreadySetup = 1;
  };
  const upgradeImport = (fileArg, item) => {
    let locations = item.match(importLocationsRegex);
    let replaceString = '';
    let appendCSS = '';
    let file = fileArg;
    let objectString;
    if (!locations || !fileArg) {
      return;
    }
    locations = locations[1];
    let imports = item.match(importVarsRegex);
    if (imports) {
      imports = mapArray(imports[1].split(commaString), (ImportItemArg) => {
        const ImportItem = ImportItemArg.trim();
        if (ImportItem.includes(' as ')) {
          return last(ImportItem.split(' '));
        }
        return ImportItem;
      });
      const fileLocations = locations.split(commaString);
      if (fileLocations.length < 2) {
        objectString = `${tickMark}${locations}${tickMark}`;
      } else {
        objectString = stringify(zipObject(imports, fileLocations))
          .replace(convertToTemplateString, convertToTemplateStringReplace);
      }
      replaceString = `const{${imports}}= `;
    } else {
      appendCSS = ',{appendCSS:true}';
      objectString = `${tickMark}${locations}${tickMark}`;
    }
    replaceString = `${replaceString} await _imprt(${objectString}${appendCSS});`;
    if (!file) {
      return fileArg;
    }
    file = fileArg.replace(item, replaceString);
    return file;
  };
  const replaceImports = function(fileArg) {
    const matches = fileArg.match(importRegexGlobal);
    let file = fileArg;
    if (matches) {
      eachArray(matches, (item) => {
        if (item) {
          file = upgradeImport(file, item);
        }
      });
    }
    return file;
  };
  const getCallback = function(jsonData, config, workerInfo) {
    const item = jsonData.file;
    const checksum = jsonData.cs;
    const cacheCheck = jsonData.cache;
    const key = jsonData.key;
    const fileList = config.fileList;
    const filename = fileList.files[key];
    const completedFiles = config.completedFiles;
    const checksums = config.checksum;
    const islib = isLib.test(filename);
    const isJs = isFileJS(filename);
    const isJson = isFileJSON(filename);
    const isCss = isFileCSS(filename);
    const dirname = initial(filename.split(slashString))
      .join(slashString);
    let sendNow;
    let requestStatus = true;
    /*
      During an active stream data is compiled.
      Based on Key coming in.
      */
    if (item) {
      completedFiles[key] += item;
    } else if (item === false) {
      checksums[key] = false;
      completedFiles[key] = false;
      config.filesLoaded += 1;
      sendNow = true;
    } else if (cacheCheck) {
      completedFiles[key] = true;
      config.filesLoaded += 1;
      sendNow = true;
    } else {
      config.filesLoaded += 1;
      checksums[key] = checksum;
      sendNow = true;
    }
    if (sendNow) {
      let completedFile = completedFiles[key];
      if (completedFile !== true && isJs && !islib) {
        completedFile = `((exports) => { const _imprt = app.demand; return ${replaceImports(completedFile)}});`;
      }
      post(workerInfo.id, {
        cs: checksums[key],
        dirname,
        file: completedFile,
        isCss,
        isJs,
        isJson,
        isLib,
        key,
      }, {
        keep: true,
      });
    }
    if (config.filesLoaded === config.fileListLength) {
      const returned = {};
      if (config.callback) {
        config.callback(returned);
      } else {
        post(workerInfo.id, returned);
      }
      requestStatus = false;
    }
    return requestStatus;
  };
  /*
  This asyncronously streams required filesLoadedfrom socket
  or from cache.
  */
  assign(events.socket, {
    get(options, workerInfo) {
      /*
      Config for stream callback function
      */
      const dataProp = options.data;
      const fileList = dataProp.files;
      const config = {
        callback: options.callback,
        checksum: [],
        completedFiles: map(fileList, () => {
          return '';
        }),
        fileList: dataProp,
        fileListLength: fileList.length,
        filesLoaded: 0,
        progress: options.progress,
      };
      const body = {
        async: true,
        callback(json) {
          return getCallback(json, config, workerInfo);
        },
        data: {
          request: 'file.get',
        },
      };
      body.data.data = dataProp;
      request(body);
    },
    request,
  });
  const socketInitialize = () => {
    console.log('Worker Socket Module', 'notify');
    const serverLocation = `${routerData.protocol}//${(app.config.socketHostname || routerData.hostname)}:${app.config.port}`;
    socket = self.io.connect(serverLocation, {
      transports: ['websocket'],
    });
    socket.on('reconnect', () => {
      console.log('connected', app.creditSave);
      if (app.creditSave) {
        request({
          callback() {
            console.log('Re-authenticated');
            postMessage({
              data: {
                type: 'reconnected',
              },
              id: '_',
            });
          },
          data: {
            data: app.creditSave,
            request: 'user.verify',
          },
        });
      }
    });
    // this listens for client API calls
    socket.on('api', apiClient);
    socket.on('ready', socketIsReady);
    socket.on('configure', () => {
      socket.emit('configure', {
        language: navigator.language,
      });
    });
    socket.on('disconnected', () => {
      postMessage({
        data: {
          type: 'disconnected',
        },
        id: '_',
      });
    });
  };

  const {utility: {get}} = app;
  self.onmessage = (e) => {
    const data = e.data;
    const requestName = data.request;
    const id = data.id;
    const body = data.data;
    const eventCallback = get(requestName, events);
    if (eventCallback) {
      const returned = eventCallback(body, {
        id
      });
      if (returned) {
        post(returned, id);
      }
      console.log(`Worker api.${requestName}`);
    } else {
      console.log(`FAILED Worker api.${requestName}`);
    }
  };

}());
//# sourceMappingURL=coreBundle.js.map
