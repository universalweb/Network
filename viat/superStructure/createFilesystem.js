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
	genesis: {
		url: 'g'
	},
	pending: {
		url: 'p'
	},
	wallets: {
		url: 'w',
	},
	audits: {
		url: 'a',
	},
	domains: {
		url: 'd',
	}
};
export async function createViatFilesystem(basePath, filesystemObject = viatFilesystemObject) {
	return objectToFilesystem(basePath || getViatDirectory(), filesystemObject);
}
export async function viatConfigToFilesystem(config = {}) {
	config.source ??= viatFilesystemObject;
	config.folderPath ??= getViatDirectory();
	await configToFilesystem(config);
	return true;
}
// console.log(await viatConfigToFilesystem());
// const filesystemFolder = path.normalize(`${currentPath(import.meta)}/../filesystem/testnet/`);
// await createFolderStructure({
// 	folderPath: filesystemFolder,
// 	filesystemObject: viatFilesystemObject,
// });
