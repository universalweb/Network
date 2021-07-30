import app from './app.js';
import { fetchFile } from './fetchFile.js';
import languagePath from './language.js';
const {
  utility: {
    assign,
    hasDot,
    has,
    promise,
    last,
    map,
    isString,
    isPlainObject,
    each
  }
} = app;
const commaString = ',';
const buildFilePath = (itemArg) => {
  let item = itemArg;
  if (!hasDot(item)) {
    if (has(item, 'language/')) {
      item = languagePath(item);
    } else if (last(item) === '/') {
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
export const demand = async (filesArg, options) => {
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
      if (type === 'js' && last(item) === '/') {
        item += 'index';
      }
      return `${item}.${type}`;
    });
    return demand(files, options);
  };
};
export const demandCss = demandTypeMethod('css', (appendCSS) => {
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
