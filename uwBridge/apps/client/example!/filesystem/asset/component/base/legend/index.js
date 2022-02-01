(async () => {
	const {
		component,
		utility: {
			cnsl
		}
	} = app;
	cnsl('lgnd Component', 'notify');
	const dirname = exports.dirname;
	await component('lgnd', {
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`]
		}
	});
})();
