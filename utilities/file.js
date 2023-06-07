import { readFileSync } from 'fs';
import {
	writeFile,
	readFile,
} from 'node:fs/promises';
import { promise, jsonParse } from '@universalweb/acid';
import { normalize } from 'path';
import { decode } from 'msgpackr';
export async function write(filePath, contents, encode) {
	const pathNormalized = normalize(filePath);
	console.log('FILE WRITE', pathNormalized, contents.length, encode);
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
