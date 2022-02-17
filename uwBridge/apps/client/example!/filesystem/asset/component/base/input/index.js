(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('Input Component', 'notify');
	await component('inpt', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
		}
	});
})();
