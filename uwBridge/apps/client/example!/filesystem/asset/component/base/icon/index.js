(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('icon Component', 'notify');
	await component('icon', {
		asset: {
			template: `${exports.dirname}template`,
			styles: [`${exports.dirname}style`]
		}
	});
})();
