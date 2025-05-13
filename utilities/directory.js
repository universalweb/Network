import { eachAsyncObject, hasDot, isPlainObject } from '@universalweb/acid';
import fs from 'fs';
import os from 'os';
import path from 'path';
export function getHomeDirectory() {
	const homeDirectory = os.homedir();
	return homeDirectory;
}
export function getDesktopDirectory() {
	const homeDirectory = getHomeDirectory();
	const desktopDirectory = path.join(homeDirectory, 'Desktop');
	return desktopDirectory;
}
export function getDocumentsDirectory() {
	const homeDirectory = getHomeDirectory();
	const documentsDirectory = path.join(homeDirectory, 'Documents');
	return documentsDirectory;
}
export function getDownloadsDirectory() {
	const homeDirectory = getHomeDirectory();
	const downloadsDirectory = path.join(homeDirectory, 'Downloads');
	return downloadsDirectory;
}
export function getViatDirectory() {
	const homeDirectory = getHomeDirectory();
	const downloadsDirectory = path.join(homeDirectory, 'VIAT');
	return downloadsDirectory;
}
const exportAPI = {
	getHomeDirectory,
	getDesktopDirectory,
	getDocumentsDirectory,
	getDownloadsDirectory,
	getViatDirectory,
};
export default exportAPI;
// console.log('homeDirectory', getHomeDirectory());
// console.log('desktopDirectory', getDesktopDirectory());
// console.log('documentsDirectory', getDocumentsDirectory());
// console.log('downloadsDirectory', getDownloadsDirectory());
