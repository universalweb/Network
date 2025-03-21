import { get, hasValue, stringify } from '@universalweb/acid';
export async function processEvent(request, response, source) {
	const { onRequest } = source;
	this.logInfo('processEvent method', request.method);
	this.logInfo('processEvent path', request.path);
	this.logInfo('processEvent parameters', request.parameters);
	this.logInfo('processEvent head', request.head);
	this.logInfo('processEvent data', request.data);
	// this.logInfo(actions);
	if (onRequest) {
		onRequest(request, response, source);
	} else {
		response.setHeader('status', 404);
		response.send();
	}
}
