(async () => {
	console.log('coreComponents');
	const {
		demand,
		utility: { map }
	} = app;
	await demand(map(['icon', 'button', 'input', 'form', 'legend', 'tabs', 'hero', 'modal', 'listSearch'], (item) => {
		return `${import.meta.path}${item}/`;
	}));
})();
