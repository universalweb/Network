module.exports = async (utility) => {
	const {
		shallowRequire,
		each
	} = utility;
	const extendServiceObject = (item) => {
		item.module(utility);
	};
	const apps = await shallowRequire(__dirname);
	each(apps, extendServiceObject);
	console.log(`ServicesReady ${process.pid}`);
};
