(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('slideshow Component', 'notify');
	await component('slideshow', {
		asset: {
			template: `${import.meta.path}template`
		}
	});
})();
