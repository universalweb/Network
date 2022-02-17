module.exports = (utility) => {
	const {
		compactMap,
		map,
		promise,
	} = utility;
	const dir = require('node-dir');
	const shallow = (dirName, depth = 1) => {
		return promise((accept) => {
			const depthLevel = '\\/(.+)'.repeat(depth);
			const regexDirName = new RegExp(`${dirName}(.+)${depthLevel}`, 'i');
			dir.subdirs(dirName, (err, subdirs) => {
				if (err) {
					return console.log('ERROR SHALLOW REQUIRE', err);
				}
				accept(compactMap(subdirs, (item) => {
					if (!item.match(regexDirName) && item[0] !== '.') {
						return `${item}/`;
					}
				}));
			});
		});
	};
	const shallowRequire = async (dirName) => {
		const dirsReturned = await shallow(dirName);
		const imported = map(dirsReturned, (item) => {
			return {
				directory: item,
				module: require(item),
			};
		});
		return imported;
	};
	utility.shallow = shallow;
	utility.shallowRequire = shallowRequire;
};
