import app from './app.js';
import { demand } from './demand.js';
const {
  utility: {
    assign,
    cnsl,
    hasValue,
    promise,
    uid,
    isString
  }
} = app;
export const mainWorker = new Worker('/worker.js');
assign(app.events, {
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
export const workerRequest = async (requestName, dataArg) => {
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
  return promise((accept) => {
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
  const {
    id,
    data
  } = eventData;
  let generatedId = id;
  if (!hasValue(generatedId)) {
    generatedId = '_';
  }
  events[generatedId](data);
  if (!eventData.keep && !isString(generatedId)) {
    events[generatedId] = null;
    uid.free(generatedId);
  }
};
mainWorker.onmessage = (workerEvent) => {
  return workerMessage(workerEvent);
};
app.workerRequest = workerRequest;
