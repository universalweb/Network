import app from './app.js';
const {
	utility: {
		hasValue,
		promise,
		uid,
		isString
	}
} = app;
export const mainWorker = new Worker('/worker.js');
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
		app.events[uniq] = (callback) ? function(dataCallback) {
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
	app.events[generatedId](data);
	if (!eventData.keep && !isString(generatedId)) {
		app.events[generatedId] = null;
		uid.free(generatedId);
	}
};
mainWorker.onmessage = (workerEvent) => {
	return workerMessage(workerEvent);
};
app.workerRequest = workerRequest;
