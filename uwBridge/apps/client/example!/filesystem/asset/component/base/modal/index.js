(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('modal Component', 'notify');
	const dirname = exports.dirname;
	await component('modal', {
		asset: {
			template: `${dirname}template`,
			styles: [`${dirname}style`]
		}
	});
})();
