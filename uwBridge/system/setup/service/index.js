module.exports = async (utility) => {
	const {
		shallowRequire,
		each
	} = utility;
	const apps = await shallowRequire(__dirname);
	each(apps, (item) => {
		item(utility);
	});
	console.log(`ServicesReady ${process.pid}`);
};
