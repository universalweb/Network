import { eachAsyncObject, hasDot, isPlainObject } from '@universalweb/acid';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
export async function objectToFilesystem(basePath, filesystemObject) {
	if (!filesystemObject) {
		return;
	}
	await fs.ensureDir(basePath);
	console.log('FILESYSTEM DIR ENSURED', basePath);
	await eachAsyncObject(filesystemObject, async (value, key) => {
		const folderPath = path.join(basePath, key);
		if (isPlainObject(value)) {
			await objectToFilesystem(folderPath, value);
		} else if (hasDot(key)) {
			console.log('FILE', folderPath);
		}
	});
}
export async function configToFilesystem(config) {
	const {
		folderPath,
		source,
	} = config;
	await objectToFilesystem(folderPath, source);
	return true;
}
const exportAPI = {
	objectToFilesystem,
	configToFilesystem,
};
export default exportAPI;
// console.log('homeDirectory', getHomeDirectory());
// console.log('desktopDirectory', getDesktopDirectory());
// console.log('documentsDirectory', getDocumentsDirectory());
// console.log('downloadsDirectory', getDownloadsDirectory());
