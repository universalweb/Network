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
	return workerRequest(workerPackage);
};
assign(app, {
	request,
});
