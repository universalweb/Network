(function() {
  'use strict';

  localStorage.clear();
  const app = {
    componentMethods: {},
    events: {},
    start(data) {
      return app.workerRequest('configure', data);
    },
    utility: window.$,
  };
  window.app = app;

  const isEventNode = (componentEvent) => {
    if (!componentEvent || !componentEvent.original || !componentEvent.original.target) {
      return false;
    }
    return componentEvent.node === componentEvent.original.target;
  };
  app.isEventNode = isEventNode;

  const {last, first} = app.utility;
  const isLang = new RegExp(/^language\//);
  const languagePath = (filePath) => {
    let filePathCompiled = filePath;
    if (!isLang.test(filePathCompiled)) {
      if (first(filePathCompiled) !== '/') {
        filePathCompiled = `/${filePathCompiled}`;
      }
      filePathCompiled = `language${filePathCompiled}`;
    }
    if (last(filePathCompiled) !== '/') {
      filePathCompiled = `${filePathCompiled}/`;
    }
    return `${filePathCompiled}${app.systemLanguage}.json`;
  };
  app.languagePath = languagePath;

  const {utility: {assign: assign$2, cnsl, hasValue: hasValue$1, promise: promise$1, uid, isString: isString$2}} = app;
  const mainWorker = new Worker('/worker.js');
  assign$2(app.events, {
    async setupCompleted(data) {
      cnsl('Worker is Ready', 'notify');
      app.systemLanguage = data.language;
      try {
        await demand('Sentivate/');
        app.translate = await demand('language/global');
        await demand('app/');
      } catch (error) {
        console.log(error);
        localStorage.clear();
        window.location.reload();
      }
    },
  });
  const events = app.events;
  const workerRequest = async (requestName, dataArg) => {
    let compiledRequest;
    let callback;
    if (dataArg) {
      compiledRequest = {
        data: dataArg,
        request: requestName,
      };
    } else {
      compiledRequest = requestName;
      callback = requestName.callback;
    }
    const requestObject = {
      data: compiledRequest.data,
      request: compiledRequest.request,
    };
    if (requestObject.data.id) {
      return mainWorker.postMessage(requestObject);
    }
    return promise$1((accept) => {
      const uniq = uid();
      events[uniq] = (callback) ? function(dataCallback) {
        accept(dataCallback);
        callback(dataCallback);
      } : accept;
      requestObject.id = uniq;
      mainWorker.postMessage(requestObject);
    });
  };
  const workerMessage = (workerEvent) => {
    const eventData = workerEvent.data;
    const {id, data} = eventData;
    let generatedId = id;
    if (!hasValue$1(generatedId)) {
      generatedId = '_';
    }
    events[generatedId](data);
    if (!eventData.keep && !isString$2(generatedId)) {
      events[generatedId] = null;
      uid.free(generatedId);
    }
  };
  mainWorker.onmessage = (workerEvent) => {
    return workerMessage(workerEvent);
  };
  app.workerRequest = workerRequest;

  const {assign: assign$1, querySelector, map: map$1, hasValue, model, isString: isString$1, } = app.utility;
  const local = localStorage;
  const imported = {};
  const headNode = querySelector('head');
  const styleNode = document.createElement('style');
  const loadScript = window.eval;
  const iJson = (contents) => {
    if (contents) {
      return loadScript(`(${contents})`);
    }
    return {};
  };
  const isLibRegex = new RegExp(/^js\/lib\//);
  const checksumReturn = (item) => {
    return localStorage[`cs-${item}`];
  };
  const constructStyleTagThenAppendToHead = (text, filePath) => {
    const node = styleNode.cloneNode(false);
    node.textContent = text;
    node.setAttribute('data-src', filePath);
    headNode.appendChild(node);
    return node;
  };
  /*
  When all the required items have been downloaded
  */
  const getLoadedAssets = (item) => {
    return imported[item];
  };
  const getCompleted = async (config) => {
    const {callback, data, } = config;
    const assetCollection = map$1(data, getLoadedAssets);
    callback(...assetCollection);
  };
  const checkIfCompleted = (config) => {
    if (!config.done && config.filesLoaded === config.fileCount) {
      config.done = true;
      getCompleted(config);
    }
  };
  const saveCompleted = async (json, config) => {
    const {file, cs, key, isJs, isJson, isCss, dirname, } = json;
    const {appendCSS, data, } = config;
    const filename = data[key];
    let fileContents = file;
    let skipCheck;
    if (fileContents === true) {
      if (!imported[filename]) {
        fileContents = local[filename];
      }
    } else {
      local[`cs-${filename}`] = cs;
      local[filename] = fileContents;
    }
    if (!hasValue(imported[filename]) || fileContents !== true) {
      if (!isJs) {
        if (fileContents === false) {
          imported[filename] = {};
        } else {
          imported[filename] = (isJson) ? iJson(fileContents) : fileContents;
        }
      } else if (fileContents) {
        if (isLibRegex.test(filename)) {
          loadScript(fileContents);
          imported[filename] = true;
        } else {
          if (imported[filename]) {
            config.filesLoaded++;
            return checkIfCompleted(config);
          }
          skipCheck = true;
          const moduleExports = {
            dirname: `${dirname}/`,
            name: filename
          };
          await loadScript(fileContents)(moduleExports);
          config.filesLoaded++;
          imported[filename] = moduleExports;
          return checkIfCompleted(config);
        }
      }
    }
    if (isCss && appendCSS && isString$1(imported[filename])) {
      constructStyleTagThenAppendToHead(imported[filename], filename);
      imported[filename] = true;
    }
    if (!skipCheck) {
      config.filesLoaded++;
      return checkIfCompleted(config);
    }
  };
  const fetchFile = async (config) => {
    const configData = config.data;
    config.filesLoaded = 0;
    config.fileCount = config.data.length;
    await workerRequest({
      async callback(json) {
        if (hasValue(json.file)) {
          await saveCompleted(json, config);
        } else {
          return checkIfCompleted(config);
        }
      },
      data: {
        data: {
          cs: map$1(configData, checksumReturn),
          files: configData,
        },
      },
      request: 'socket.get',
    });
  };
  assign$1(app, {
    fetchFile,
  });

  const {utility: {assign, hasDot, has, promise, last: last$1, map, isString, isPlainObject, each}} = app;
  const commaString = ',';
  const buildFilePath = (itemArg) => {
    let item = itemArg;
    if (!hasDot(item)) {
      if (has(item, 'language/')) {
        item = languagePath(item);
      } else if (last$1(item) === '/') {
        item += 'index.js';
      }
    }
    return item;
  };
  const singleDemand = (items) => {
    return items[0];
  };
  const objectDemand = (items, arrayToObjectMap) => {
    return map(arrayToObjectMap, (item) => {
      return items[item];
    });
  };
  const multiDemand = (items) => {
    return items;
  };
  const streamAssets = (data, options) => {
    return promise((accept) => {
      fetchFile(assign({
        callback(...args) {
          accept(args);
        },
        data
      }, options));
    });
  };
  const demand = async (filesArg, options) => {
    const assets = [];
    let demandType;
    let arrayToObjectMap;
    let files = filesArg;
    if (isPlainObject(files)) {
      demandType = objectDemand;
      arrayToObjectMap = {};
      let index = 0;
      each(files, (item, key) => {
        arrayToObjectMap[key] = index;
        index++;
        assets.push(buildFilePath(item));
      });
    } else {
      files = (isString(files)) ? files.split(commaString) : files;
      demandType = (files.length < 2) ? singleDemand : multiDemand;
      each(files, (item) => {
        assets.push(buildFilePath(item));
      });
    }
    const results = await streamAssets(assets, options);
    return demandType(results, arrayToObjectMap);
  };
  const demandTypeMethod = (type, optionsFunction) => {
    return function(filesArg, options) {
      let files = filesArg;
      if (isString(files)) {
        files = files.split(commaString);
      }
      if (optionsFunction) {
        optionsFunction(options);
      }
      files = map(files, (itemArg) => {
        let item = itemArg;
        if (type === 'js' && last$1(item) === '/') {
          item += 'index';
        }
        return `${item}.${type}`;
      });
      return demand(files, options);
    };
  };
  const demandCss = demandTypeMethod('css', (appendCSS) => {
    return {
      appendCSS
    };
  });
  const demandJs = demandTypeMethod('js');
  const demandHtml = demandTypeMethod('html');
  const demandLang = (fileList) => {
    const files = (isString(fileList)) ? fileList.split(commaString) : fileList;
    return demand(map(files, languagePath));
  };
  assign(app, {
    demand,
    demandCss,
    demandHtml,
    demandJs,
    demandLang,
  });

  const {assign: assign$3, } = app.utility;
  const request = async (requestName, config) => {
    const requestPackage = (config) ? {
      data: config,
      request: requestName
    } : requestName;
    const workerPackage = {
      data: {
        data: requestPackage,
        name: 'api'
      },
      request: 'socket.request'
    };
    if (requestPackage.id) {
      workerPackage.data.id = requestPackage.id;
      return workerRequest(workerPackage);
    }
    const json = await workerRequest(workerPackage);
    return json;
  };
  assign$3(app, {
    request,
  });

  const {utility: {assign: assign$4, cnsl: cnsl$1, compactMapArray, isEmpty, eachAsync, eachObject, eachArray, isString: isString$3, isPlainObject: isPlainObject$1, hasValue: hasValue$2, drop}, } = app;
  cnsl$1('Initilizing watchers module.', 'notify');
  const watchers = {};
  const watchersRegex = [];
  const onRegex = (type, callable) => {
    const watchObject = {};
    callable.regex = type;
    let number = watchersRegex.push(callable) - 1;
    assign$4(watchObject, {
      _: {
        isWatcher: true,
      },
      callable,
      start() {
        if (!hasValue$2(number)) {
          number = watchersRegex.push(callable) - 1;
        }
      },
      stop() {
        if (hasValue$2(number)) {
          drop(watchersRegex, number);
          number = null;
        }
      },
    });
    return watchObject;
  };
  const onString = (type, callable) => {
    const watchObject = {};
    if (!watchers[type]) {
      watchers[type] = [];
    }
    const levelObject = watchers[type];
    let number = levelObject.push(callable) - 1;
    assign$4(watchObject, {
      _: {
        isWatcher: true,
      },
      callable,
      start() {
        if (!hasValue$2(number)) {
          number = levelObject.push(callable) - 1;
        }
      },
      stop() {
        if (hasValue$2(number)) {
          drop(levelObject, number);
          number = null;
        }
      },
    });
    return watchObject;
  };
  const onCollection = (object, settings) => {
    const watching = [];
    const prefix = (settings.prefix) ? `${settings.prefix}.` : '';
    const suffix = (settings.suffix) ? `.${settings.suffix}` : '';
    const watchCollection = {
      _: {
        isWatcher: true,
      },
      start() {
        eachArray(watching, (item) => {
          item.start();
        });
      },
      stop() {
        eachArray(watching, (item) => {
          item.stop();
        });
      },
      watching,
    };
    eachObject(object, (item, key) => {
      watching.push(onString(`${prefix}${key}${suffix}`, item, settings));
    });
    return watchCollection;
  };
  const watch = (type, callable) => {
    let method;
    if (isString$3(type)) {
      method = onString;
    } else if (isPlainObject$1(type)) {
      method = onCollection;
    } else {
      method = onRegex;
    }
    return method(type, callable);
  };
  watch.status = true;
  watch.start = () => {
    watch.status = true;
  };
  watch.stop = () => {
    watch.status = null;
  };
  const onUpdate = async (json) => {
    if (!watch.status || !json) {
      return;
    }
    const type = json.type;
    const subscribers = [];
    const levelObject = watchers[type];
    const regexSubscribers = compactMapArray(watchersRegex, (item) => {
      if (item.regex.test(type)) {
        return item;
      }
    });
    if (!isEmpty(regexSubscribers)) {
      subscribers.push(...regexSubscribers);
    }
    if (levelObject) {
      subscribers.push(...levelObject);
    }
    console.log(subscribers);
    if (subscribers.length) {
      eachAsync(subscribers, (watcher) => {
        return watcher(json, watcher);
      });
    }
  };
  const push = (requestName, data) => {
    return request({
      data,
      id: '_',
      request: requestName,
    });
  };
  assign$4(app.events, {
    _(json) {
      return onUpdate(json.data);
    }
  });
  assign$4(app, {
    push,
    watch,
    watchers
  });

}());
//# sourceMappingURL=coreBundle.js.map
