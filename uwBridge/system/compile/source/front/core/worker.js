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
	console.log(task, dataArg);
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
	console.log(uniq);
	requestObject.id = uniq;
	return promise((accept) => {
		app.events[uniq] = async function(responseData) {
			if (callbackOptional) {
				await callbackOptional(responseData);
			}
			accept(responseData);
		};
		mainWorker.postMessage(requestObject);
	});
};
const workerMessage = (workerEvent) => {
	console.log(workerEvent.data);
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
		console.log(generatedId);
	}
	console.log(app.events[generatedId], data);
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
