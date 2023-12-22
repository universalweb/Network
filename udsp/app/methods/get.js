import { hasDot, isEmpty, isString } from '@universalweb/acid';
import cleanPath from '#cleanPath';
import { promises as fs } from 'fs';
import { info } from '#logs';
import path from 'path';
import { read } from '#utilities/file';
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
export async function get(req, resp, client) {
	const {
		resourceDirectory,
		defaultExtension,
		cryptography
	} = client;
	const {
		data,
		path: filePath
	} = req;
	if (!isString(filePath) || isEmpty(filePath)) {
		console.log('No fileName - Returning empty data');
		resp.setHeader('status', 404);
		resp.send();
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
		resp.setHeader('contentType', ext);
		resp.data = fileData;
	} catch (err) {
		resp.setHeader('status', 404);
	} finally {
		resp.send();
	}
}
