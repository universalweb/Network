import fs from 'node:fs';
const { readFileSync } = fs;
import {
	writeFile,
	readFile,
} from 'node:fs/promises';
import { promise, jsonParse } from '@universalweb/acid';
import path from 'path';
const { normalize } = path;
import { decode } from '#utilities/serialize';
function createFoldersIfNotExist(folderPath) {
	const directories = path.normalize(folderPath).split(path.sep);
	let currentPath = `${path.sep}`;
	console.log(directories);
	for (const dir of directories) {
		if (dir.length) {
			currentPath = path.join(currentPath, dir);
			const pathExists = fs.existsSync(currentPath);
			console.log(pathExists, currentPath);
			if (!pathExists) {
				fs.mkdirSync(currentPath);
			}
		}
	}
}
export async function write(filePath, contents, encode, createPathFlag) {
	const pathNormalized = normalize(filePath);
	console.log('FILE WRITE', pathNormalized, contents.length, encode);
	if (createPathFlag) {
		createFoldersIfNotExist(path.dirname(pathNormalized));
	}
	return writeFile(pathNormalized, contents, encode);
}
export async function read(filePath, encode) {
	return readFile(normalize(filePath), encode);
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
export function readJson(filePath) {
	return jsonParse(readFileSync(filePath));
}
export function readMsgpack(filePath) {
	return decode(readFileSync(filePath));
}
