import app from './app.js';
import { workerRequest } from './worker';
const { assign } = app.utility;
export const request = async (requestName, body) => {
	const requestPackage = (body) ? {
		body,
		request: requestName
	} : requestName;
	const workerPackage = {
		data: {
			data: requestPackage,
		},
		request: 'socket.request'
	};
	if (requestPackage.id) {
		workerPackage.data.id = requestPackage.id;
	}
	return workerRequest(workerPackage);
};
assign(app, {
	request,
});
