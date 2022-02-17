(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('btn Component', 'notify');
	await component('btn', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
		}
	});
})();
