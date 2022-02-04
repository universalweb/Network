(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('Input Component', 'notify');
	const dirname = exports.dirname;
	await component('tabs', {
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`]
		},
		onredner() {
			const source = this;
			source.on({});
		}
	});
})();