(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('hero Component', 'notify');
	await component('hero', {
		asset: {
			template: `${exports.dirname}template`,
			styles: [`${exports.dirname}style`]
		}
	});
})();
