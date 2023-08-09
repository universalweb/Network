import { isString, isEmpty } from '@universalweb/acid';
import { cleanPath, isPathAllowed } from '#cleanPath';
import { info } from '#logs';
import { read } from '#utilities/file';
export async function state(socket, request, response) {
	const { configuration: { resourceDirectory, }, } = this;
	info(request);
	const { state: fileName } = request.data;
	response.head = {};
	if (!isString(fileName) || isEmpty(fileName)) {
		console.log('No fileName - Returning empty data');
		response.head.state = 404;
		return true;
	}
	if (!isPathAllowed(fileName)) {
		response.data = {
			err: 'Invalid path'
		};
		return true;
	}
	const cleanedPath = (fileName) ? cleanPath(`${resourceDirectory}/states/${fileName}/index.js`) : cleanPath(`${resourceDirectory}/states/index.js`);
	const data = await read(cleanedPath);
	console.log(cleanedPath, data);
	response.data = {
		data
	};
	return true;
}
