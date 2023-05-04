import { isString, isEmpty, hasDot } from 'Acid';
import cleanPath from '#cleanPath';
import { info } from '#logs';
import { read } from '#utilities/file';
import path from 'path';
const dots = /\./g;
export async function file(socket, request, response) {
	const {
		resourceDirectory, defaultExtension
	} = this;
	info(request);
	console.log(this);
	const { path: requestPath } = request.body;
	response.head = {};
	if (!isString(requestPath) || isEmpty(requestPath) || requestPath.match(dots).length > 1) {
		console.log('No valid state request received - Returning empty data');
		response.head.status = 404;
		return true;
	}
	let cleanedPath = cleanPath(`${resourceDirectory}/${requestPath}`);
	if (!hasDot(cleanedPath)) {
		cleanedPath = cleanedPath + defaultExtension;
	}
	console.log(cleanedPath);
	const data = await read(cleanedPath);
	const ext = path.extname(cleanedPath);
	console.log(`EXT => ${ext}`);
	response.body = {
		ext,
		data
	};
	return true;
}
