(async () => {
	const { component, } = app;
	const dirname = exports.dirname;
	await component('questions', {
		asset: {
			template: `${dirname}template`
		}
	});
})();
