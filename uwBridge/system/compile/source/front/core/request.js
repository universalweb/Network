import app from './app.js';
import { workerRequest } from './worker';
const { assign } = app.utility;
export const request = async (task, body) => {
	const requestPackage = (body) ? {
		body,
		task
	} : task;
	const workerPackage = {
		data: {
			data: requestPackage,
		},
		task: 'socket.request'
	};
	if (requestPackage.id) {
		workerPackage.data.id = requestPackage.id;
	}
	const results = await workerRequest(workerPackage);
	console.log('request', results.body);
	if (results) {
		return results.body || results;
	}
};
assign(app, {
	request,
});
