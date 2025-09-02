import {
	eachAsyncObject, hasDot, hasValue, isPlainObject
} from '@universalweb/utilitylib';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { write } from './file.js';
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
			if (hasValue(value)) {
				await write(folderPath, value);
			}
		} else if (value === true) {
			console.log('FOLDER', folderPath);
			await fs.ensureDir(folderPath);
		}
	});
}
export async function configToFilesystem(config) {
	const {
		directory,
		source,
	} = config;
	await objectToFilesystem(directory, source);
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
