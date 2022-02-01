(async () => {
	const { component, } = app;
	const dirname = exports.dirname;
	await component('question', {
		asset: {
			template: `${dirname}template`
		}
	});
})();
