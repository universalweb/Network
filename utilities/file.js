import { jsonParse, promise } from '@universalweb/utilitylib';
import {
	mkdir,
	opendir,
	readFile,
	stat,
	writeFile,
} from 'node:fs/promises';
import { decode } from '#utilities/serialize';
import dirTree from 'directory-tree';
import fsExtra from 'fs-extra';
import path from 'path';
const { normalize } = path;
/**
 * Recursively reads all files in a directory and its subdirectories,
 * with optional filtering by regex, excluding specific folders, and limiting recursion depth.
 * Handles errors gracefully by returning an empty array and logging warnings.
 *
 * @param {string} directoryPath - The path to the directory to start reading from.
 * @param {object} [options={}] - An object containing optional parameters.
 * @param {RegExp} [options.nameFilter] - An optional RegExp object to filter filenames.
 * @param {string[]} [options.excludeFolderNames=[]] - An array of folder names to exclude from traversal.
 * @param {number} [options.maxDepth=Infinity] - The maximum depth to traverse. 0 means only the starting directory.
 * @param {number} [currentDepth=0] - Internal parameter for tracking current recursion depth. Do not set manually.
 * @returns {Promise<string[]>} A promise that resolves to an array of matching file names (including their full paths).
 */
export async function getFiles(directoryPath, options = {}, currentDepth = 0) {
	// Initialize an array to store matching files.
	let matchingFiles = [];
	// Destructure options with default values for robustness.
	const {
		nameFilter,
		pathFilter,
		excludeFolderNames = [],
		ignoreHidden = true,
		maxDepth = Infinity,
	} = options;
	// Check if the maximum recursion depth has been reached.
	if (currentDepth > maxDepth) {
		return [];
	}
	try {
		// Check if the provided directory path exists.
		const exists = await fsExtra.pathExists(directoryPath);
		if (!exists) {
			console.warn(`Warning: Directory does not exist: "${directoryPath}". Returning empty array.`);
			return;
		}
		// Read the names of all files and folders within the current directory.
		const filesAndFolders = await fsExtra.readdir(directoryPath);
		// Iterate over each item (file or folder) found in the directory.
		for (const item of filesAndFolders) {
			// Construct the full path to the current item.
			const itemPath = path.join(directoryPath, item);
			// Declare a variable to hold file/folder stats.
			let stats;
			try {
				// Get detailed statistics (e.g., if it's a file or directory) for the current item.
				stats = await fsExtra.stat(itemPath);
			} catch (statError) {
				// If unable to stat an item (e.g., due to permission issues or broken symlinks),
				// log a warning and skip this item.
				if (statError.code === 'EACCES' || statError.code === 'EPERM') {
					console.warn(`Permission denied or unable to access item: "${itemPath}". Skipping.`);
					// Move to the next item in the loop.
					continue;
				}
				// For any other unexpected errors during stat, log and skip.
				console.warn(`Unexpected error statting item: "${itemPath}". Error: ${statError.message}. Skipping.`);
				// Move to the next item in the loop.
				continue;
			}
			// Check if the current item is a file.
			if (stats.isFile()) {
				if (ignoreHidden && item.startsWith('.')) {
					continue;
				} else if (nameFilter && nameFilter.test(item)) {
					matchingFiles.push(itemPath);
				} else if (pathFilter && pathFilter.test(itemPath)) {
					matchingFiles.push(itemPath);
				} else if (!nameFilter && !pathFilter) {
					matchingFiles.push(itemPath);
				}
			} else if (stats.isDirectory()) {
				// Check if the current directory's name is in the list of excluded folder names.
				if (excludeFolderNames.includes(item)) {
					// If the folder is excluded, log a message.
					console.log(`Skipping excluded folder: "${itemPath}"`);
					// Skip this directory and its contents, moving to the next item.
					continue;
				}
				// Recursively call the function for subdirectories.
				// Pass the same options object down to maintain filters, exclusions, and maxDepth.
				// Increment the current depth for the recursive call.
				const subDirFiles = await getFiles(
					itemPath,
					options,
					currentDepth + 1
				);
				// Concatenate the files found in the subdirectory to the main results array.
				matchingFiles = matchingFiles.concat(subDirFiles);
			}
		}
		// Return the array of all matching files found.
		return matchingFiles;
	} catch (error) {
		// This catch block handles errors that occur when reading the directory itself (fse.readdir).
		// If the error is a permission denied error for the entire directory.
		if (error.code === 'EACCES' || error.code === 'EPERM') {
			// Log a warning about the permission issue.
			console.warn(`Permission denied for directory: "${directoryPath}". Returning empty array.`);
			// Return an empty array as per requirement.
			return [];
		}
		// For any other unexpected errors at the directory level, log the error.
		console.error(`Unexpected error reading directory "${directoryPath}":`, error);
		// Return an empty array for any other errors, ensuring no error is thrown.
		return [];
	}
}
export function getDirectoryStructure(folderPath) {
	const tree = dirTree(folderPath, {
		// Include type (file/directory)
		attributes: ['type'],
		// Normalize paths for consistency
		normalizePath: true,
	});
	return tree;
}
export async function ensureDirLegacy(folderPath) {
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
export async function ensureDirectoryPath(filePath) {
	const pathNormalized = normalize(filePath);
	return fsExtra.ensureDir(path.dirname(pathNormalized));
}
export async function write(filePath, contents, encoding, createPathFlag) {
	const pathNormalized = normalize(filePath);
	// console.log('FILE WRITE', pathNormalized, contents.length, encoding);
	if (createPathFlag) {
		await ensureDirectoryPath(pathNormalized);
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
		const file = await read(filePath);
		if (file) {
			return decode(file);
		}
	} catch (err) {
		console.log('Read Decode Error', err);
		return;
	}
}
/**
 * Stream and traverse a directory with depth and pattern matching.
 *
 * @param {string} dirPath - The root directory to start reading from.
 * @param {object} options - Options to control behavior.
 * @param {number} [options.maxDepth=Infinity] - Max recursion depth.
 * @param {RegExp} [options.match] - Optional RegExp to match filenames.
 * @param {(filePath: string) => void | Promise<void>} [options.onMatch] - Callback if match is found.
 * @param {number} [depth=0] - Current depth (internal use).
 */
async function streamDirectory(dirPath, config = {}, depth = 0) {
	const {
		maxDepth = 10,
		match,
		onMatch,
	} = config;
	const dir = await opendir(dirPath);
	for await (const dirent of dir) {
		const fullPath = path.join(dirPath, dirent.name);
		if (dirent.isDirectory()) {
			if (depth < maxDepth) {
				await streamDirectory(fullPath, {
					maxDepth,
					match,
					onMatch,
				}, depth + 1);
			}
		} else if (onMatch && match?.test(dirent.name)) {
			await onMatch(fullPath);
		}
	}
}
