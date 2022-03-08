module.exports = (utility) => {
	const {
		compactMap,
		mapAsync,
		promise,
	} = utility;
	const dir = require('node-dir');
	const {
		access: fileAccess
	} = require('fs/promises');
	const {
		constants
	} = require('fs');
	const {
		resolve
	} = require('path');
	async function fileExists(path) {
		try {
			await fileAccess(path, constants.R_OK);
			return true;
		} catch {
			return false;
		}
	}
	const shallow = (dirName, depth = 1) => {
		return promise((accept) => {
			const depthLevel = '\\/(.+)'.repeat(depth);
			const regexDirName = new RegExp(`${dirName}(.+)${depthLevel}`);
			dir.subdirs(dirName, (err, subdirs) => {
				if (err) {
					return console.trace('ERROR SHALLOW REQUIRE', err);
				}
				accept(compactMap(subdirs, (item) => {
					if (item && !item.match(regexDirName) && item[0] !== '.') {
						return item;
					}
				}));
			});
		});
	};
	const shallowRequire = async (dirName) => {
		const dirsReturned = await shallow(dirName);
		const imported = mapAsync(dirsReturned, async (itemArg) => {
			let item = itemArg;
			if (!item) {
				return	console.trace(`shallowRequire - string is missing  \n ${item} \n`);
			}
			item = resolve(item, 'index.js');
			const fileCheck = await fileExists(item);
			if (!fileCheck) {
				return	console.trace(`shallowRequire - Module File doesn't exist \n ${item} \n`);
			}
			const requiredModule = require(item);
			requiredModule._directory = item;
			return requiredModule;
		});
		return imported;
	};
	utility.shallow = shallow;
	utility.shallowRequire = shallowRequire;
	utility.fileExists = fileExists;
};
