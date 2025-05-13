import { configToFilesystem, objectToFilesystem } from '#utilities/filesystem';
import {
	currentPath,
	eachAsyncObject,
	eachObject,
	hasDot,
	isPlainObject
} from '@universalweb/acid';
import { getViatDirectory } from '#utilities/directory';
import path from 'node:path';
const viatFilesystemObject = {
	genesis: {},
	pending: {},
	wallets: {},
	audit: {},
	domains: {}
};
export async function createViatFilesystem(basePath, filesystemObject = viatFilesystemObject) {
	return objectToFilesystem(basePath || getViatDirectory(), filesystemObject);
}
export async function viatConfigToFilesystem(config = {}) {
	config.source ??= viatFilesystemObject;
	config.folderPath ??= getViatDirectory();
	console.log(config);
	// await configToFilesystem(config);
	return true;
}
console.log(await viatConfigToFilesystem());
// const filesystemFolder = path.normalize(`${currentPath(import.meta)}/../filesystem/testnet/`);
// await createFolderStructure({
// 	folderPath: filesystemFolder,
// 	filesystemObject: viatFilesystemObject,
// });
