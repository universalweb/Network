(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('lgnd Component', 'notify');
	await component('lgnd', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
		}
	});
})();
