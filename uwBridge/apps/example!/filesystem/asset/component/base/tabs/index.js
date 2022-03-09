(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('Input Component', 'notify');
	await component('tabs', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
		},
		onredner() {
			const source = this;
			source.on({});
		}
	});
})();
