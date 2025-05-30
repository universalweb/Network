import { clientResponseObject } from '../request/objects/client/response.js';
// If path arg has params in it then paramArg becomes dataArg
// params support both Complex Data Binary Supported Params and simple traditional URL percent encoded params
export async function fetchRequest(path, config = {}) {
	this.logInfo(`FETCH => ${path}`);
	const params = config.params || config.param;
	const data = config.data || config.body;
	const head = config.head || config.headers;
	const request = await this.request(config.method, path, params, data, head, config.options);
	const askObject = await request.send();
	if (askObject) {
		const response = clientResponseObject(askObject);
		return response;
	}
}
