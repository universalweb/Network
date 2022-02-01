(async () => {
	const {
		watch,
		view,
	} = app;
	view.set('@shared.stats', {});
	watch(/stats\./, (json) => {
		console.log(json, '_________________STATS___________________________');
		app.assign('@shared.stats', json.item);
	});
})();
