import { jsonParse, promise } from '@universalweb/acid';
import {
	mkdir,
	readFile,
	stat,
	writeFile
} from 'node:fs/promises';
import { decode } from '#utilities/serialize';
import fs from 'node:fs';
import fsExtra from 'fs-extra';
import path from 'path';
const { normalize } = path;
async function createFoldersIfNotExist(folderPath) {
	const directories = normalize(folderPath).split(path.sep);
	let currentPath = `${path.sep}`;
	for (const dir of directories) {
		if (dir.length) {
			currentPath = path.join(currentPath, dir);
			try {
				await stat(currentPath);
			} catch {
				try {
					await mkdir(currentPath);
				} catch {
					console.log('Error creating folder', currentPath);
				}
			}
		}
	}
}
export async function write(filePath, contents, encoding, createPathFlag) {
	const pathNormalized = normalize(filePath);
	console.log('FILE WRITE', pathNormalized, contents.length, encoding);
	if (createPathFlag) {
		await fsExtra.ensureDir(path.dirname(pathNormalized));
	}
	return writeFile(pathNormalized, contents, encoding);
}
export async function read(filePath, encoding) {
	return readFile(normalize(filePath), encoding);
}
export async function copy(source, destination, config) {
	let file = await read(source);
	if (config) {
		if (config.prepend) {
			file = config.prepend + file;
		}
	}
	await write(normalize(destination), file);
}
export async function readJson(filePath) {
	try {
		return jsonParse(await read(filePath));
	} catch (err) {
		console.log('Read JSON Error', err);
		return;
	}
}
export async function readStructured(filePath) {
	try {
		return decode(await read(filePath));
	} catch (err) {
		console.log('Read Decode Error', err);
		return;
	}
}
