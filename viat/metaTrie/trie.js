import {
	eachArray, forOf, hasDot, hasValue,
	isMap,
} from '@universalweb/acid';
class FileSystemTrie {
	constructor() {
		this.root = new Map();
	}
	insert(path, value) {
		const parts = path.split('/').filter(Boolean);
		let current = this.root;
		eachArray(parts, (part, index, source, arrayLength) => {
			console.log(path, value, current, arrayLength, index);
			if (isMap(current) && index === (arrayLength - 1) && hasValue(value)) {
				current.set(part, value);
			} else if (!current.has(part)) {
				if (!hasDot(part)) {
					current.set(part, new Map());
				}
			}
			current = current.get(part);
		});
	}
	get(path) {
		// Split path into parts, ignoring empty segments
		const parts = path.split('/').filter(Boolean);
		let current = this.root;
		eachArray(parts, (part) => {
			if (!current.has(part)) {
				// Break the loop if the path does not exist
				current = undefined;
				return false;
			}
			current = current.get(part);
		});
		return current;
	}
	print(root = this.root, indent = '') {
		const classSource = this;
		forOf(root.entries(), (value, key) => {
			if (isMap(value)) {
				console.log(`${indent}${key}/`);
				classSource.print(value, `${indent}  `);
			} else {
				console.log(`${indent}${key}`, value);
			}
		});
	}
	buildObject(root = this.root) {
		const obj = {};
		forOf(root.entries(), (value, key) => {
			if (isMap(value)) {
				obj[key] = this.buildObject(value);
			} else {
				obj[key] = value;
			}
		});
		return obj;
	}
}
export async function fileSystemTrie(...args) {
	return new FileSystemTrie(...args);
}
export default fileSystemTrie;
// Example usage:
// const fsTrie = new FileSystemTrie();
// fsTrie.insert('/folder1/folder2/file.txt', 'File content');
// fsTrie.insert('/folder1/folder3');
// fsTrie.insert('/folder1/folder3/file2.txt', 'Another file');
// fsTrie.insert('/folder1/folder3/folder4', new Map());
// fsTrie.print();
// console.log('Retrieved:', fsTrie.get('/folder1/folder2/file.txt'));
// console.log('Retrieved folder:', fsTrie.get('/folder1/folder3'));
// console.log(fsTrie.buildObject());
