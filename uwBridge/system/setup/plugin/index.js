module.exports = async (utility) => {
	require('./directory')(utility);
	const {
		each,
		shallowRequire,
		isFunction
	} = utility;
	const plugins = await shallowRequire(__dirname);
	each(plugins, (item) => {
		if (!item) {
			return	console.error(`${item} Module doesn't exist`);
		}
		if (!isFunction(item)) {
			return console.error(`${item} Module isn't a function`);
		}
		item(utility);
	});
};
