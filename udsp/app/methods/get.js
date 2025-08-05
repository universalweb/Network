import { hasDot, isEmpty, isString } from '@universalweb/utilitylib';
import cleanPath from '#cleanPath';
import { promises as fs } from 'fs';
import path from 'path';
import { read } from '#utilities/file';
const dots = /\./g;
/**
 * @todo
 */
const cache = {};
// Might just want to read file and catch error instead of access checking
// Need cache mechanisms built in
async function checkFileExists(filePath) {
	try {
		await fs.access(filePath, fs.constants.F_OK);
		console.log('File exists');
	} catch (err) {
		console.error('File does not exist');
	}
}
export async function getMethod(req, resp, appServer) {
	const {
		resourceDirectory,
		defaultExtension,
	} = appServer;
	const {
		data,
		path: filePath,
	} = req;
	if (!isString(filePath) || isEmpty(filePath)) {
		console.log('No fileName - Returning empty data');
		await resp.setHeader('status', 404);
		resp.send();
		return true;
	}
	let compiledPath = (filePath === '' || filePath === '/') ? 'index' : filePath;
	if (!hasDot(compiledPath) && defaultExtension) {
		compiledPath = `${compiledPath}.${defaultExtension}`;
	}
	const cleanedPath = cleanPath(`${resourceDirectory}/${compiledPath}`);
	console.log(cleanedPath);
	// const fileCheck = checkFileExists(cleanedPath);
	// Check best way to check for file or just read it with try catch
	try {
		const fileData = await read(cleanedPath);
		const ext = path.extname(cleanedPath).replace('.', '');
		console.log(`EXT => ${ext}`);
		await resp.setHeader('contentType', ext);
		resp.data = fileData;
	} catch (err) {
		await resp.setHeader('status', 404);
	} finally {
		resp.send();
	}
}
