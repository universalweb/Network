import app from './app.js';
const {
	utility: {
		hasValue,
		promise,
		uid,
		isString
	}
} = app;
export const mainWorker = new Worker('/assets/worker.js');
export const workerRequest = async (task, dataArg) => {
	if (app.debug) {
		console.log(task, dataArg);
	}
	let compiledRequest;
	let callbackOptional;
	if (dataArg) {
		compiledRequest = {
			data: dataArg,
			task,
		};
	} else {
		compiledRequest = task;
		callbackOptional = task.callback;
	}
	const requestObject = {
		data: compiledRequest.data,
		task: compiledRequest.task,
	};
	if (requestObject.data.id) {
		return mainWorker.postMessage(requestObject);
	}
	const uniq = uid();
	if (app.debug) {
		console.log(uniq);
	}
	requestObject.id = uniq;
	const results = await promise((accept) => {
		app.events[uniq] = async function(responseData) {
			if (app.debug) {
				console.log(responseData);
			}
			if (callbackOptional) {
				await callbackOptional(responseData);
			}
			accept(responseData);
		};
		if (app.debug) {
			app.events[uniq].requestObject = requestObject;
		}
		mainWorker.postMessage(requestObject);
	});
	// console.log('workerRequest', results);
	return results;
};
const workerMessage = (workerEvent) => {
	// console.log(workerEvent.data);
	const eventData = workerEvent.data;
	const {
		id,
		data
	} = eventData;
	let generatedId = id;
	if (!hasValue(generatedId)) {
		generatedId = '_';
	}
	if (!app.events[generatedId]) {
		console.warn('Event Missing', generatedId);
	}
	if (app.debug) {
		console.log(app.events[generatedId], data);
	}
	app.events[generatedId](data);
	if (!eventData.keep && !isString(generatedId)) {
		console.log('DONT KEEP', eventData, generatedId);
		app.events[generatedId] = null;
		uid.free(generatedId);
	}
};
mainWorker.onmessage = (workerEvent) => {
	return workerMessage(workerEvent);
};
app.workerRequest = workerRequest;
