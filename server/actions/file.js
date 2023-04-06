import { cleanPath, isString, isEmpty } from 'Acid';
import { info } from 'utilities/logs.js';
import { read } from 'utilities/file.js';
import path from 'path';
export async function file(socket, request, response) {
	const { configuration: { resourceDirectory, }, } = this;
	info(request);
	const { path: requestPath } = request.body;
	response.head = {};
	if (!isString(requestPath) || isEmpty(requestPath)) {
		console.log('No valid state request received - Returning empty data');
		response.head.status = 404;
		return true;
	}
	const cleanedPath = cleanPath(`${resourceDirectory}/${requestPath}`);
	const data = await read(cleanedPath);
	const ext = path.extname(cleanedPath);
	console.log(`EXT => ${ext}`);
	response.body = {
		ext,
		data
	};
	return true;
}
