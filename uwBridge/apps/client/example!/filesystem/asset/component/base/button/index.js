(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('btn Component', 'notify');
	const dirname = exports.dirname;
	await component('btn', {
		asset: {
			template: `${dirname}template`,
			styles: [`${dirname}style`]
		}
	});
})();
