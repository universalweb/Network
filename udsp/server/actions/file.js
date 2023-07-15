import { isString, isEmpty, hasDot } from '@universalweb/acid';
import cleanPath from '#cleanPath';
import { info } from '#logs';
import { read } from '#utilities/file';
import path from 'path';
const dots = /\./g;
/**
 * @todo
 */
const cache = {};
export async function file(reply) {
	const {
		resourceDirectory,
		defaultExtension,
		cryptography
	} = this;
	const {
		response,
		request
	} = reply;
	info(request.data);
	const { path: requestPath } = request.data;
	if (!isString(requestPath) || isEmpty(requestPath) || requestPath.match(dots).length > 1) {
		console.log('No valid state request received - Returning empty data');
		response.code = 404;
		return true;
	}
	let cleanedPath = cleanPath(`${resourceDirectory}/${requestPath}`);
	if (!hasDot(cleanedPath)) {
		cleanedPath = cleanedPath + defaultExtension;
	}
	console.log(cleanedPath);
	const data = await read(cleanedPath);
	const ext = path.extname(cleanedPath).replace('.', '');
	console.log(`EXT => ${ext}`);
	response.ext = ext;
	response.data = data;
	// checksum: cryptography.hash(data)
	reply.send('binary');
}
