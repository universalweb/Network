(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('slideshow Component', 'notify');
	const dirname = exports.dirname;
	await component('slideshow', {
		asset: {
			template: `${dirname}template`
		}
	});
})();
