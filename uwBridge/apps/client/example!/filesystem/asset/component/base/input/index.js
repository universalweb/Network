(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('Input Component', 'notify');
	const dirname = exports.dirname;
	await component('inpt', {
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`]
		}
	});
})();
