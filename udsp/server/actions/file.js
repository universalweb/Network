import { isString, isEmpty, hasDot } from '@universalweb/acid';
import cleanPath from '#cleanPath';
import { info } from '#logs';
import { read } from '#utilities/file';
import path from 'path';
const dots = /\./g;
/**
 *
 * @todo Include file size & other metadata as mandatory single packet data. In the head section first so that it can be built and prepared before the data begins sending. After head completes it can then proceed with the data.
 */
const cache = {};
// This is for small static resource files only which could be loaded into memory or could be loaded in on the fly and then discarded or cached.
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
	info(request.body);
	const { path: requestPath } = request.body;
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
	response.body = data;
	// checksum: cryptography.hash(data)
	reply.send('binary');
}
