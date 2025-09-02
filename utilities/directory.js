import { eachAsyncObject, hasDot, isPlainObject } from '@universalweb/utilitylib';
import fs from 'fs';
import os from 'os';
import path from 'path';
export function getHomeDirectory(appendPath = '') {
	const homeDirectory = os.homedir();
	return path.join(homeDirectory, appendPath);
}
export function getViatDirectory(appendPath = '') {
	return getHomeDirectory('viat', appendPath);
}
export function getDesktopDirectory(appendPath = '') {
	return getHomeDirectory('Desktop', appendPath);
}
export function getDocumentsDirectory(appendPath = '') {
	return getHomeDirectory('Documents', appendPath);
}
export function getDownloadsDirectory(appendPath = '') {
	return getHomeDirectory('Downloads', appendPath);
}
export function getWalletsDirectory(appendPath = '') {
	return getViatDirectory('wallets', appendPath);
}
const exportAPI = {
	getHomeDirectory,
	getDesktopDirectory,
	getDocumentsDirectory,
	getDownloadsDirectory,
	getViatDirectory,
	getWalletsDirectory,
};
export default exportAPI;
// console.log('homeDirectory', getHomeDirectory());
// console.log('desktopDirectory', getDesktopDirectory());
// console.log('documentsDirectory', getDocumentsDirectory());
// console.log('downloadsDirectory', getDownloadsDirectory());
