(async () => {
	console.log('coreComponents');
	const dirname = exports.dirname;
	const {
		demand,
		utility: { map }
	} = app;
	await demand(map(['icon', 'button', 'input', 'form', 'legend', 'tabs', 'hero', 'modal', 'listSearch'], (item) => {
		return `${dirname}${item}/`;
	}));
})();
