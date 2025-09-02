import { configToFilesystem, objectToFilesystem } from '#utilities/filesystem';
import {
	currentPath,
	eachAsyncObject,
	eachObject,
	hasDot,
	isPlainObject,
} from '@universalweb/utilitylib';
import { getViatDirectory } from '#utilities/directory';
import path from 'node:path';
const viatFilesystemObject = {
	cache: true,
	pending: true,
	wallets: true,
	audits: true,
	domains: true,
};
export async function createViatFilesystem(basePath, filesystemObject = viatFilesystemObject) {
	if (basePath) {
		return objectToFilesystem(basePath, filesystemObject);
	}
}
export async function viatConfigToFilesystem(config = {}) {
	config.source ??= viatFilesystemObject;
	config.directory ??= getViatDirectory();
	await configToFilesystem(config);
	return true;
}
// console.log(await viatConfigToFilesystem());
// const filesystemFolder = path.normalize(`${currentPath(import.meta)}/../filesystem/testnet/`);
// await createFolderStructure({
// 	folderPath: filesystemFolder,
// 	filesystemObject: viatFilesystemObject,
// });
