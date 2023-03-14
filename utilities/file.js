import {
	writeFile,
	readFile,
	readFileSync
} from 'fs';
import { promise, jsonParse } from 'Acid';
import { normalize } from 'path';
export function write(filePath, contents, encode) {
	return promise((accept, reject) => {
		writeFile(normalize(filePath), contents, encode, (error) => {
			if (error) {
				reject(error);
			} else {
				accept();
			}
		});
	});
}
export function read(filePath, encode) {
	return promise((accept, reject) => {
		readFile(normalize(filePath), encode, (error, contents) => {
			if (error) {
				reject(error);
			} else {
				accept(contents);
			}
		});
	});
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
