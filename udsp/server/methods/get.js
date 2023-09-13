import { isString, isEmpty, hasDot } from '@universalweb/acid';
import cleanPath from '#cleanPath';
import { info } from '#logs';
import { read } from '#utilities/file';
import { promises as fs } from 'fs';
import path from 'path';
const dots = /\./g;
/**
 * @todo
 */
const cache = {};
async function checkFileExists(filePath) {
	try {
		await fs.access(filePath, fs.constants.F_OK);
		console.log('File exists');
	} catch (err) {
		console.error('File does not exist');
	}
}
export async function get(reply) {
	const {
		resourceDirectory,
		defaultExtension,
		cryptography
	} = this;
	const {
		response,
		data,
		path: filePath
	} = reply;
	if (!isString(filePath) || isEmpty(filePath) || filePath.match(dots).length > 1) {
		console.log('No fileName - Returning empty data');
		reply.setHeader('status', 404);
		reply.send();
		return true;
	}
	let cleanedPath = cleanPath(`${resourceDirectory}/${filePath}`);
	if (!hasDot(cleanedPath)) {
		cleanedPath = cleanedPath + defaultExtension;
	}
	console.log(cleanedPath);
	try {
		const fileData = await read(cleanedPath);
		const ext = path.extname(cleanedPath).replace('.', '');
		console.log(`EXT => ${ext}`);
		reply.setHeader('contentType', ext);
		response.data = fileData;
	} catch {
		reply.setHeader('status', 404);
	} finally {
		reply.send();
	}
	// checksum: cryptography.hash(data)
	reply.send();
}