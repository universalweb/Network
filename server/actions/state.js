import { cleanPath, isString, isEmpty } from 'Acid';
import { info } from 'utilities/logs.js';
import { read } from 'utilities/file.js';
export async function state(socket, request, response) {
	const { configuration: { resourceDirectory, }, } = this;
	info(request);
	const { state: fileName } = request.body;
	response.head = {};
	if (!isString(fileName) || isEmpty(fileName)) {
		console.log('No valid state request received - Returning empty data');
		response.head.status = 404;
		return true;
	}
	const cleanedPath = (fileName) ? cleanPath(`${resourceDirectory}/states/${fileName}/index.js`) : cleanPath(`${resourceDirectory}/states/index.js`);
	const data = await read(cleanedPath);
	console.log(cleanedPath, data);
	response.body = {
		data
	};
	return true;
}
